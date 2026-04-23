import { Pool } from 'pg';
import { ROUTINE_SQL } from '../routineSql';

export interface QueueStats {
  total: number;
  scheduled: number;
  ready: number;
  failed: number;
  errorRate: number;
  avgErrorCount: number;
  oldestJob: Date | null;
  newestJob: Date | null;
  totalByQueue: Array<{ queue: string; count: number }>;
  totalByClass: Array<{ jobClass: string; count: number }>;
  totalRoutineRuns: number;
  recentFailures: Array<{
    id: number;
    jobClass: string;
    queue: string;
    errorCount: number;
    lastError: string;
    runAt: Date;
  }>;
}

export interface Job {
  id: number;
  queue: string;
  priority: number;
  runAt: Date;
  jobClass: string;
  args: unknown[];
  errorCount: number;
  lastError?: string;
}

export interface RoutineSummary {
  id: number;
  name: string;
  jobClass: string;
  cronExpression: string;
  timeZone: string;
  enabled: boolean;
  nextRunAt: Date;
  totalRuns: number;
  createdAt: Date;
}

export interface DashboardOptions {
  title?: string;
  basePath?: string;
  refreshInterval?: number;
  maxRecentFailures?: number;
  auth?: {
    email: string;
    password: string;
  };
}

export interface DashboardInternalOptions {
  title: string;
  basePath: string;
  refreshInterval: number;
  maxRecentFailures: number;
}

export class DashboardService {
  private pool: Pool;
  private options: DashboardInternalOptions;

  constructor(pool: Pool, options: DashboardOptions = {}) {
    this.pool = pool;
    this.options = {
      title: options.title || 'Que Dashboard',
      basePath: options.basePath || '/que',
      refreshInterval: options.refreshInterval || 5000,
      maxRecentFailures: options.maxRecentFailures || 50,
    };
  }

  async getStats(): Promise<QueueStats> {
    const now = new Date();

    const [
      totalResult,
      scheduledResult,
      readyResult,
      failedResult,
      avgErrorResult,
      oldestResult,
      newestResult,
      byQueueResult,
      byClassResult,
      recentFailuresResult,
      totalRunsResult,
    ] = await Promise.all([
      this.pool.query('SELECT COUNT(*) as count FROM que_jobs'),
      this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE run_at > $1', [now]),
      this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE run_at <= $1', [now]),
      this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE error_count > 0'),
      this.pool.query('SELECT AVG(error_count) as avg FROM que_jobs WHERE error_count > 0'),
      this.pool.query('SELECT run_at FROM que_jobs ORDER BY run_at ASC LIMIT 1'),
      this.pool.query('SELECT run_at FROM que_jobs ORDER BY run_at DESC LIMIT 1'),
      this.pool.query('SELECT queue, COUNT(*) as count FROM que_jobs GROUP BY queue ORDER BY count DESC'),
      this.pool.query('SELECT job_class, COUNT(*) as count FROM que_jobs GROUP BY job_class ORDER BY count DESC LIMIT 20'),
      this.pool.query(
        'SELECT job_id, job_class, queue, error_count, last_error, run_at FROM que_jobs WHERE error_count > 0 ORDER BY run_at DESC LIMIT $1',
        [this.options.maxRecentFailures]
      ),
      this.pool.query(ROUTINE_SQL.TOTAL_RUNS).catch(() => ({ rows: [{ total: '0' }] })),
    ]);

    const total    = parseInt(totalResult.rows[0].count);
    const failed   = parseInt(failedResult.rows[0].count);

    return {
      total,
      scheduled:        parseInt(scheduledResult.rows[0].count),
      ready:            parseInt(readyResult.rows[0].count),
      failed,
      errorRate:        total > 0 ? (failed / total) * 100 : 0,
      avgErrorCount:    parseFloat(avgErrorResult.rows[0].avg) || 0,
      oldestJob:        oldestResult.rows[0]?.run_at || null,
      newestJob:        newestResult.rows[0]?.run_at || null,
      totalByQueue:     byQueueResult.rows.map(r => ({ queue: r.queue || '(default)', count: parseInt(r.count) })),
      totalByClass:     byClassResult.rows.map(r => ({ jobClass: r.job_class, count: parseInt(r.count) })),
      totalRoutineRuns: parseInt(totalRunsResult.rows[0].total, 10),
      recentFailures:   recentFailuresResult.rows.map(r => ({
        id:         parseInt(r.job_id),
        jobClass:   r.job_class,
        queue:      r.queue || '(default)',
        errorCount: r.error_count,
        lastError:  r.last_error || '',
        runAt:      r.run_at,
      })),
    };
  }

  async getJobs(options: {
    queue?: string;
    jobClass?: string;
    status?: 'ready' | 'scheduled' | 'failed' | 'all';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ jobs: Job[]; total: number }> {
    const { queue, jobClass, status = 'all', limit = 50, offset = 0 } = options;

    const where: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (queue !== undefined) { where.push(`queue = $${p++}`); params.push(queue); }
    if (jobClass)             { where.push(`job_class = $${p++}`); params.push(jobClass); }

    const now = new Date();
    if (status === 'ready')     { where.push(`run_at <= $${p++}`); params.push(now); }
    else if (status === 'scheduled') { where.push(`run_at > $${p++}`); params.push(now); }
    else if (status === 'failed')    { where.push('error_count > 0'); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countResult, jobsResult] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) as count FROM que_jobs ${whereClause}`, params),
      this.pool.query(
        `SELECT job_id, queue, priority, run_at, job_class, args, error_count, last_error
         FROM que_jobs ${whereClause}
         ORDER BY priority ASC, run_at ASC, job_id ASC
         LIMIT $${p++} OFFSET $${p++}`,
        [...params, limit, offset]
      ),
    ]);

    return {
      total: parseInt(countResult.rows[0].count),
      jobs: jobsResult.rows.map(r => ({
        id:         parseInt(r.job_id),
        queue:      r.queue,
        priority:   r.priority,
        runAt:      r.run_at,
        jobClass:   r.job_class,
        args:       r.args,
        errorCount: r.error_count,
        lastError:  r.last_error || undefined,
      })),
    };
  }

  async getJob(jobId: number): Promise<Job | null> {
    const result = await this.pool.query(
      'SELECT job_id, queue, priority, run_at, job_class, args, error_count, last_error FROM que_jobs WHERE job_id = $1',
      [jobId]
    );
    if (!result.rows.length) return null;
    const r = result.rows[0];
    return {
      id: parseInt(r.job_id), queue: r.queue, priority: r.priority,
      runAt: r.run_at, jobClass: r.job_class, args: r.args,
      errorCount: r.error_count, lastError: r.last_error || undefined,
    };
  }

  async deleteJob(jobId: number): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM que_jobs WHERE job_id = $1', [jobId]);
    return (result.rowCount ?? 0) > 0;
  }

  async retryJob(jobId: number): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE que_jobs SET error_count = 0, last_error = NULL, run_at = NOW() WHERE job_id = $1',
      [jobId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async bulkDeleteJobs(jobIds: number[]): Promise<number> {
    if (!jobIds.length) return 0;
    const result = await this.pool.query(
      'DELETE FROM que_jobs WHERE job_id = ANY($1::bigint[])',
      [jobIds]
    );
    return result.rowCount ?? 0;
  }

  async bulkRetryJobs(jobIds: number[]): Promise<number> {
    if (!jobIds.length) return 0;
    const result = await this.pool.query(
      'UPDATE que_jobs SET error_count = 0, last_error = NULL, run_at = NOW() WHERE job_id = ANY($1::bigint[])',
      [jobIds]
    );
    return result.rowCount ?? 0;
  }

  async updateJobArgs(jobId: number, args: unknown[]): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE que_jobs SET args = $1::jsonb WHERE job_id = $2',
      [JSON.stringify(args), jobId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getQueues(): Promise<string[]> {
    const result = await this.pool.query('SELECT DISTINCT queue FROM que_jobs ORDER BY queue');
    return result.rows.map(r => r.queue || '(default)');
  }

  async getJobClasses(): Promise<string[]> {
    const result = await this.pool.query('SELECT DISTINCT job_class FROM que_jobs ORDER BY job_class');
    return result.rows.map(r => r.job_class);
  }

  async getRoutines(): Promise<RoutineSummary[]> {
    const result = await this.pool.query(ROUTINE_SQL.LIST_ALL).catch(() => ({ rows: [] }));
    return result.rows.map(r => ({
      id:             parseInt(r.routine_id, 10),
      name:           r.name,
      jobClass:       r.job_class,
      cronExpression: r.cron_expr,
      timeZone:       r.time_zone,
      enabled:        r.enabled,
      nextRunAt:      r.next_run_at,
      totalRuns:      parseInt(r.total_runs, 10),
      createdAt:      r.created_at,
    }));
  }

  async setRoutineEnabled(routineId: number, enabled: boolean): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE que_routines SET enabled = $2 WHERE routine_id = $1',
      [routineId, enabled]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteRoutine(routineId: number): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM que_routines WHERE routine_id = $1',
      [routineId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  getOptions(): DashboardInternalOptions {
    return this.options;
  }
}
