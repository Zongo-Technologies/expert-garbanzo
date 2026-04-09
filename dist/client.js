"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const pg_1 = require("pg");
const job_1 = require("./job");
const sql_1 = require("./sql");
const utils_1 = require("./utils");
class Client {
    constructor(config = {}) {
        this.pool = new pg_1.Pool({
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
    async enqueue(jobClass, args = [], options = {}) {
        const { priority = 100, runAt = new Date(), queue = "" } = options;
        const argsJson = (0, utils_1.formatJobArgs)(args);
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql_1.SQL_QUERIES.ENQUEUE_JOB, [
                jobClass,
                argsJson,
                priority,
                runAt,
                queue,
            ]);
            const row = result.rows[0];
            // Notify workers that a new job is available
            await client.query(`SELECT pg_notify('que_jobs_' || $1, '')`, [queue]);
            // Enqueued jobs don't hold advisory locks, so release the connection
            return new job_1.JobInstance(row, client);
        }
        finally {
            client.release();
        }
    }
    async enqueueInTx(txClient, jobClass, args = [], options = {}) {
        const { priority = 100, runAt = new Date(), queue = "" } = options;
        const argsJson = (0, utils_1.formatJobArgs)(args);
        const result = await txClient.query(sql_1.SQL_QUERIES.ENQUEUE_JOB, [
            jobClass,
            argsJson,
            priority,
            runAt,
            queue,
        ]);
        const row = result.rows[0];
        // Notify workers — will fire when the transaction commits
        await txClient.query(`SELECT pg_notify('que_jobs_' || $1, '')`, [queue]);
        // Transaction client is managed by the caller, not by JobInstance
        return new job_1.JobInstance(row, txClient);
    }
    async lockJob(queue = "", maxAttempts = 5) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql_1.SQL_QUERIES.LOCK_JOB, [queue, maxAttempts]);
            if (result.rows.length === 0) {
                client.release();
                return null;
            }
            const row = result.rows[0];
            // Pass the dedicated client — it holds the advisory lock.
            // JobInstance.unlock() will release it back to the pool.
            return new job_1.JobInstance(row, client);
        }
        catch (err) {
            client.release();
            throw err;
        }
    }
    /**
     * Send a NOTIFY on the que_jobs channel to wake up listening workers.
     */
    async notify(queue = "") {
        await this.pool.query(`SELECT pg_notify('que_jobs_' || $1, '')`, [queue]);
    }
    /**
     * Delete jobs that have exceeded the maximum number of attempts.
     * Returns the number of removed jobs.
     */
    async cleanupDeadJobs(maxAttempts = 5) {
        const result = await this.pool.query(`DELETE FROM que_jobs WHERE error_count >= $1 RETURNING job_id`, [maxAttempts]);
        return result.rowCount ?? 0;
    }
    getPool() {
        return this.pool;
    }
    async close() {
        await this.pool.end();
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map