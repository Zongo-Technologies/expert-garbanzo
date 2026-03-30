"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
class DashboardService {
    constructor(pool, options = {}) {
        this.pool = pool;
        this.options = {
            title: options.title || 'Que Dashboard',
            basePath: options.basePath || '/que',
            refreshInterval: options.refreshInterval || 5000,
            maxRecentFailures: options.maxRecentFailures || 50,
        };
    }
    async getStats() {
        const now = new Date();
        // Get total count
        const totalResult = await this.pool.query('SELECT COUNT(*) as count FROM que_jobs');
        const total = parseInt(totalResult.rows[0].count);
        // Get scheduled jobs (future run_at)
        const scheduledResult = await this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE run_at > $1', [now]);
        const scheduled = parseInt(scheduledResult.rows[0].count);
        // Get ready jobs (past run_at)
        const readyResult = await this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE run_at <= $1', [now]);
        const ready = parseInt(readyResult.rows[0].count);
        // Get failed jobs (error_count > 0)
        const failedResult = await this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE error_count > 0');
        const failed = parseInt(failedResult.rows[0].count);
        // Calculate error rate
        const errorRate = total > 0 ? (failed / total) * 100 : 0;
        // Get average error count
        const avgErrorResult = await this.pool.query('SELECT AVG(error_count) as avg FROM que_jobs WHERE error_count > 0');
        const avgErrorCount = parseFloat(avgErrorResult.rows[0].avg) || 0;
        // Get oldest and newest jobs
        const oldestResult = await this.pool.query('SELECT run_at FROM que_jobs ORDER BY run_at ASC LIMIT 1');
        const oldestJob = oldestResult.rows[0]?.run_at || null;
        const newestResult = await this.pool.query('SELECT run_at FROM que_jobs ORDER BY run_at DESC LIMIT 1');
        const newestJob = newestResult.rows[0]?.run_at || null;
        // Get jobs by queue
        const byQueueResult = await this.pool.query(`
      SELECT queue, COUNT(*) as count 
      FROM que_jobs 
      GROUP BY queue 
      ORDER BY count DESC
    `);
        const totalByQueue = byQueueResult.rows.map(row => ({
            queue: row.queue || '(default)',
            count: parseInt(row.count),
        }));
        // Get jobs by class
        const byClassResult = await this.pool.query(`
      SELECT job_class, COUNT(*) as count 
      FROM que_jobs 
      GROUP BY job_class 
      ORDER BY count DESC 
      LIMIT 20
    `);
        const totalByClass = byClassResult.rows.map(row => ({
            jobClass: row.job_class,
            count: parseInt(row.count),
        }));
        // Get recent failures
        const recentFailuresResult = await this.pool.query(`
      SELECT job_id, job_class, queue, error_count, last_error, run_at
      FROM que_jobs
      WHERE error_count > 0
      ORDER BY run_at DESC
      LIMIT $1
    `, [this.options.maxRecentFailures]);
        const recentFailures = recentFailuresResult.rows.map(row => ({
            id: parseInt(row.job_id),
            jobClass: row.job_class,
            queue: row.queue || '(default)',
            errorCount: row.error_count,
            lastError: row.last_error || '',
            runAt: row.run_at,
        }));
        return {
            total,
            scheduled,
            ready,
            failed,
            errorRate,
            avgErrorCount,
            oldestJob,
            newestJob,
            totalByQueue,
            totalByClass,
            recentFailures,
        };
    }
    async getJobs(options = {}) {
        const { queue, jobClass, status = 'all', limit = 50, offset = 0, } = options;
        const whereConditions = [];
        const params = [];
        let paramIndex = 1;
        if (queue !== undefined) {
            whereConditions.push(`queue = $${paramIndex++}`);
            params.push(queue);
        }
        if (jobClass) {
            whereConditions.push(`job_class = $${paramIndex++}`);
            params.push(jobClass);
        }
        const now = new Date();
        if (status === 'ready') {
            whereConditions.push(`run_at <= $${paramIndex++}`);
            params.push(now);
        }
        else if (status === 'scheduled') {
            whereConditions.push(`run_at > $${paramIndex++}`);
            params.push(now);
        }
        else if (status === 'failed') {
            whereConditions.push('error_count > 0');
        }
        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
        // Get total count
        const countQuery = `SELECT COUNT(*) as count FROM que_jobs ${whereClause}`;
        const countResult = await this.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        // Get jobs
        params.push(limit, offset);
        const jobsQuery = `
      SELECT job_id, queue, priority, run_at, job_class, args, error_count, last_error
      FROM que_jobs
      ${whereClause}
      ORDER BY priority ASC, run_at ASC, job_id ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
        const jobsResult = await this.pool.query(jobsQuery, params);
        const jobs = jobsResult.rows.map(row => ({
            id: parseInt(row.job_id),
            queue: row.queue,
            priority: row.priority,
            runAt: row.run_at,
            jobClass: row.job_class,
            args: row.args,
            errorCount: row.error_count,
            lastError: row.last_error || undefined,
        }));
        return { jobs, total };
    }
    async getJob(jobId) {
        const result = await this.pool.query(`
      SELECT job_id, queue, priority, run_at, job_class, args, error_count, last_error
      FROM que_jobs
      WHERE job_id = $1
    `, [jobId]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: parseInt(row.job_id),
            queue: row.queue,
            priority: row.priority,
            runAt: row.run_at,
            jobClass: row.job_class,
            args: row.args,
            errorCount: row.error_count,
            lastError: row.last_error || undefined,
        };
    }
    async deleteJob(jobId) {
        const result = await this.pool.query('DELETE FROM que_jobs WHERE job_id = $1', [jobId]);
        return (result.rowCount ?? 0) > 0;
    }
    async retryJob(jobId) {
        const result = await this.pool.query(`
      UPDATE que_jobs
      SET error_count = 0,
          last_error = NULL,
          run_at = NOW()
      WHERE job_id = $1
    `, [jobId]);
        return (result.rowCount ?? 0) > 0;
    }
    async updateJobArgs(jobId, args) {
        const result = await this.pool.query('UPDATE que_jobs SET args = $1::jsonb WHERE job_id = $2', [JSON.stringify(args), jobId]);
        return (result.rowCount ?? 0) > 0;
    }
    async getQueues() {
        const result = await this.pool.query(`
      SELECT DISTINCT queue 
      FROM que_jobs 
      ORDER BY queue
    `);
        return result.rows.map(row => row.queue || '(default)');
    }
    async getJobClasses() {
        const result = await this.pool.query(`
      SELECT DISTINCT job_class 
      FROM que_jobs 
      ORDER BY job_class
    `);
        return result.rows.map(row => row.job_class);
    }
    getOptions() {
        return this.options;
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=service.js.map