import { PoolClient } from 'pg';
import { Job, JobRow } from './types';
import { SQL_QUERIES } from './sql';
import { parseJobArgs, calculateRetryDelay } from './utils';

export class JobInstance implements Job {
  public readonly id: number;
  public readonly queue: string;
  public readonly priority: number;
  public readonly runAt: Date;
  public readonly jobClass: string;
  public readonly args: any[];
  public readonly errorCount: number;
  public readonly lastError?: string;

  private client: PoolClient;

  constructor(row: JobRow, client: PoolClient) {
    this.id = parseInt(row.job_id, 10);
    this.queue = row.queue;
    this.priority = row.priority;
    this.runAt = row.run_at;
    this.jobClass = row.job_class;
    this.args = parseJobArgs(row.args);
    this.errorCount = row.error_count;
    this.lastError = row.last_error || undefined;
    this.client = client;
  }

  async delete(): Promise<void> {
    await this.client.query(SQL_QUERIES.DELETE_JOB, [this.id]);
    await this.unlock();
  }

  async done(): Promise<void> {
    await this.delete();
  }

  async error(errorMessage: string): Promise<void> {
    const retryDelay = calculateRetryDelay(this.errorCount + 1);
    await this.client.query(SQL_QUERIES.UPDATE_JOB_ERROR, [this.id, errorMessage, retryDelay]);
    await this.unlock();
  }

  private async unlock(): Promise<void> {
    try {
      await this.client.query(SQL_QUERIES.UNLOCK_JOB, [this.id]);
    } finally {
      this.client.release();
    }
  }
}
