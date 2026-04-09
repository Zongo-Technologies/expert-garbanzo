import { Pool, PoolClient } from "pg";
import { Job, EnqueueOptions, ClientConfig, JobRow, JSONArray } from "./types";
import { JobInstance } from "./job";
import { SQL_QUERIES } from "./sql";
import { formatJobArgs } from "./utils";

export class Client {
  private pool: Pool;

  constructor(config: ClientConfig = {}) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: config.maxConnections || 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    });
  }

  async enqueue(
    jobClass: string,
    args: JSONArray = [],
    options: EnqueueOptions = {},
  ): Promise<Job> {
    const { priority = 100, runAt = new Date(), queue = "" } = options;

    const argsJson = formatJobArgs(args);

    const client = await this.pool.connect();
    try {
      const result = await client.query(SQL_QUERIES.ENQUEUE_JOB, [
        jobClass,
        argsJson,
        priority,
        runAt,
        queue,
      ]);

      const row = result.rows[0] as JobRow;
      // Notify workers that a new job is available
      await client.query(`SELECT pg_notify('que_jobs_' || $1, '')`, [queue]);
      // Enqueued jobs don't hold advisory locks, so release the connection
      return new JobInstance(row, client);
    } finally {
      client.release();
    }
  }

  async enqueueInTx(
    txClient: PoolClient,
    jobClass: string,
    args: JSONArray = [],
    options: EnqueueOptions = {},
  ): Promise<Job> {
    const { priority = 100, runAt = new Date(), queue = "" } = options;

    const argsJson = formatJobArgs(args);

    const result = await txClient.query(SQL_QUERIES.ENQUEUE_JOB, [
      jobClass,
      argsJson,
      priority,
      runAt,
      queue,
    ]);

    const row = result.rows[0] as JobRow;
    // Notify workers — will fire when the transaction commits
    await txClient.query(`SELECT pg_notify('que_jobs_' || $1, '')`, [queue]);
    // Transaction client is managed by the caller, not by JobInstance
    return new JobInstance(row, txClient);
  }

  async lockJob(queue: string = "", maxAttempts: number = 5): Promise<Job | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(SQL_QUERIES.LOCK_JOB, [queue, maxAttempts]);

      if (result.rows.length === 0) {
        client.release();
        return null;
      }

      const row = result.rows[0] as JobRow;
      // Pass the dedicated client — it holds the advisory lock.
      // JobInstance.unlock() will release it back to the pool.
      return new JobInstance(row, client);
    } catch (err) {
      client.release();
      throw err;
    }
  }

  /**
   * Send a NOTIFY on the que_jobs channel to wake up listening workers.
   */
  async notify(queue: string = ""): Promise<void> {
    await this.pool.query(`SELECT pg_notify('que_jobs_' || $1, '')`, [queue]);
  }

  /**
   * Delete jobs that have exceeded the maximum number of attempts.
   * Returns the number of removed jobs.
   */
  async cleanupDeadJobs(maxAttempts: number = 5): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM que_jobs WHERE error_count >= $1 RETURNING job_id`,
      [maxAttempts],
    );
    return result.rowCount ?? 0;
  }

  getPool(): Pool {
    return this.pool;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
