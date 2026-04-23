"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const routineSql_1 = require("../routineSql");
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
        const [totalResult, scheduledResult, readyResult, failedResult, avgErrorResult, oldestResult, newestResult, byQueueResult, byClassResult, recentFailuresResult, totalRunsResult,] = await Promise.all([
            this.pool.query('SELECT COUNT(*) as count FROM que_jobs'),
            this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE run_at > $1', [now]),
            this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE run_at <= $1', [now]),
            this.pool.query('SELECT COUNT(*) as count FROM que_jobs WHERE error_count > 0'),
            this.pool.query('SELECT AVG(error_count) as avg FROM que_jobs WHERE error_count > 0'),
            this.pool.query('SELECT run_at FROM que_jobs ORDER BY run_at ASC LIMIT 1'),
            this.pool.query('SELECT run_at FROM que_jobs ORDER BY run_at DESC LIMIT 1'),
            this.pool.query('SELECT queue, COUNT(*) as count FROM que_jobs GROUP BY queue ORDER BY count DESC'),
            this.pool.query('SELECT job_class, COUNT(*) as count FROM que_jobs GROUP BY job_class ORDER BY count DESC LIMIT 20'),
            this.pool.query('SELECT job_id, job_class, queue, error_count, last_error, run_at FROM que_jobs WHERE error_count > 0 ORDER BY run_at DESC LIMIT $1', [this.options.maxRecentFailures]),
            this.pool.query(routineSql_1.ROUTINE_SQL.TOTAL_RUNS).catch(() => ({ rows: [{ total: '0' }] })),
        ]);
        const total = parseInt(totalResult.rows[0].count);
        const failed = parseInt(failedResult.rows[0].count);
        return {
            total,
            scheduled: parseInt(scheduledResult.rows[0].count),
            ready: parseInt(readyResult.rows[0].count),
            failed,
            errorRate: total > 0 ? (failed / total) * 100 : 0,
            avgErrorCount: parseFloat(avgErrorResult.rows[0].avg) || 0,
            oldestJob: oldestResult.rows[0]?.run_at || null,
            newestJob: newestResult.rows[0]?.run_at || null,
            totalByQueue: byQueueResult.rows.map(r => ({ queue: r.queue || '(default)', count: parseInt(r.count) })),
            totalByClass: byClassResult.rows.map(r => ({ jobClass: r.job_class, count: parseInt(r.count) })),
            totalRoutineRuns: parseInt(totalRunsResult.rows[0].total, 10),
            recentFailures: recentFailuresResult.rows.map(r => ({
                id: parseInt(r.job_id),
                jobClass: r.job_class,
                queue: r.queue || '(default)',
                errorCount: r.error_count,
                lastError: r.last_error || '',
                runAt: r.run_at,
            })),
        };
    }
    async getJobs(options = {}) {
        const { queue, jobClass, status = 'all', limit = 50, offset = 0 } = options;
        const where = [];
        const params = [];
        let p = 1;
        if (queue !== undefined) {
            where.push(`queue = $${p++}`);
            params.push(queue);
        }
        if (jobClass) {
            where.push(`job_class = $${p++}`);
            params.push(jobClass);
        }
        const now = new Date();
        if (status === 'ready') {
            where.push(`run_at <= $${p++}`);
            params.push(now);
        }
        else if (status === 'scheduled') {
            where.push(`run_at > $${p++}`);
            params.push(now);
        }
        else if (status === 'failed') {
            where.push('error_count > 0');
        }
        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const [countResult, jobsResult] = await Promise.all([
            this.pool.query(`SELECT COUNT(*) as count FROM que_jobs ${whereClause}`, params),
            this.pool.query(`SELECT job_id, queue, priority, run_at, job_class, args, error_count, last_error
         FROM que_jobs ${whereClause}
         ORDER BY priority ASC, run_at ASC, job_id ASC
         LIMIT $${p++} OFFSET $${p++}`, [...params, limit, offset]),
        ]);
        return {
            total: parseInt(countResult.rows[0].count),
            jobs: jobsResult.rows.map(r => ({
                id: parseInt(r.job_id),
                queue: r.queue,
                priority: r.priority,
                runAt: r.run_at,
                jobClass: r.job_class,
                args: r.args,
                errorCount: r.error_count,
                lastError: r.last_error || undefined,
            })),
        };
    }
    async getJob(jobId) {
        const result = await this.pool.query('SELECT job_id, queue, priority, run_at, job_class, args, error_count, last_error FROM que_jobs WHERE job_id = $1', [jobId]);
        if (!result.rows.length)
            return null;
        const r = result.rows[0];
        return {
            id: parseInt(r.job_id), queue: r.queue, priority: r.priority,
            runAt: r.run_at, jobClass: r.job_class, args: r.args,
            errorCount: r.error_count, lastError: r.last_error || undefined,
        };
    }
    async deleteJob(jobId) {
        const result = await this.pool.query('DELETE FROM que_jobs WHERE job_id = $1', [jobId]);
        return (result.rowCount ?? 0) > 0;
    }
    async retryJob(jobId) {
        const result = await this.pool.query('UPDATE que_jobs SET error_count = 0, last_error = NULL, run_at = NOW() WHERE job_id = $1', [jobId]);
        return (result.rowCount ?? 0) > 0;
    }
    async bulkDeleteJobs(jobIds) {
        if (!jobIds.length)
            return 0;
        const result = await this.pool.query('DELETE FROM que_jobs WHERE job_id = ANY($1::bigint[])', [jobIds]);
        return result.rowCount ?? 0;
    }
    async bulkRetryJobs(jobIds) {
        if (!jobIds.length)
            return 0;
        const result = await this.pool.query('UPDATE que_jobs SET error_count = 0, last_error = NULL, run_at = NOW() WHERE job_id = ANY($1::bigint[])', [jobIds]);
        return result.rowCount ?? 0;
    }
    async updateJobArgs(jobId, args) {
        const result = await this.pool.query('UPDATE que_jobs SET args = $1::jsonb WHERE job_id = $2', [JSON.stringify(args), jobId]);
        return (result.rowCount ?? 0) > 0;
    }
    async getQueues() {
        const result = await this.pool.query('SELECT DISTINCT queue FROM que_jobs ORDER BY queue');
        return result.rows.map(r => r.queue || '(default)');
    }
    async getJobClasses() {
        const result = await this.pool.query('SELECT DISTINCT job_class FROM que_jobs ORDER BY job_class');
        return result.rows.map(r => r.job_class);
    }
    async getRoutines() {
        const result = await this.pool.query(routineSql_1.ROUTINE_SQL.LIST_ALL).catch(() => ({ rows: [] }));
        return result.rows.map(r => ({
            id: parseInt(r.routine_id, 10),
            name: r.name,
            jobClass: r.job_class,
            cronExpression: r.cron_expr,
            timeZone: r.time_zone,
            enabled: r.enabled,
            nextRunAt: r.next_run_at,
            totalRuns: parseInt(r.total_runs, 10),
            createdAt: r.created_at,
        }));
    }
    async setRoutineEnabled(routineId, enabled) {
        const result = await this.pool.query('UPDATE que_routines SET enabled = $2 WHERE routine_id = $1', [routineId, enabled]);
        return (result.rowCount ?? 0) > 0;
    }
    async deleteRoutine(routineId) {
        const result = await this.pool.query('DELETE FROM que_routines WHERE routine_id = $1', [routineId]);
        return (result.rowCount ?? 0) > 0;
    }
    getOptions() {
        return this.options;
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=service.js.map