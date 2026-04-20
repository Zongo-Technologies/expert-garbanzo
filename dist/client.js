"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const pg_1 = require("pg");
const job_1 = require("./job");
const sql_1 = require("./sql");
const routineSql_1 = require("./routineSql");
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
    async createRoutine(input) {
        const { name = "", jobClass, args = [], priority = 100, queue = "", timeZone, dailyTimes, } = input;
        const pgTimes = (0, utils_1.parseDailyTimesForRoutine)(dailyTimes);
        const argsJson = (0, utils_1.formatJobArgs)(args);
        const result = await this.pool.query(routineSql_1.ROUTINE_SQL.INSERT, [
            name,
            jobClass,
            argsJson,
            priority,
            queue,
            timeZone,
            pgTimes,
        ]);
        return Client.mapRoutineRow(result.rows[0]);
    }
    async getRoutine(routineId) {
        const result = await this.pool.query(routineSql_1.ROUTINE_SQL.SELECT_BY_ID, [routineId]);
        if (result.rows.length === 0) {
            return null;
        }
        return Client.mapRoutineRow(result.rows[0]);
    }
    async listRoutines(filter) {
        const enabledParam = filter?.enabled === undefined ? null : filter.enabled;
        const result = await this.pool.query(routineSql_1.ROUTINE_SQL.LIST, [enabledParam]);
        return result.rows.map(Client.mapRoutineRow);
    }
    async deleteRoutine(routineId) {
        const result = await this.pool.query(routineSql_1.ROUTINE_SQL.DELETE, [routineId]);
        return (result.rowCount ?? 0) > 0;
    }
    async setRoutineEnabled(routineId, enabled) {
        const result = await this.pool.query(routineSql_1.ROUTINE_SQL.SET_ENABLED, [routineId, enabled]);
        if (result.rows.length === 0) {
            return null;
        }
        return Client.mapRoutineRow(result.rows[0]);
    }
    async updateRoutine(routineId, patch) {
        const existing = await this.getRoutine(routineId);
        if (!existing) {
            return null;
        }
        const mergedName = patch.name ?? existing.name;
        const mergedJobClass = patch.jobClass ?? existing.jobClass;
        const mergedArgs = patch.args ?? existing.args;
        const mergedPriority = patch.priority ?? existing.priority;
        const mergedQueue = patch.queue ?? existing.queue;
        const mergedTz = patch.timeZone ?? existing.timeZone;
        const mergedTimes = patch.dailyTimes
            ? (0, utils_1.parseDailyTimesForRoutine)(patch.dailyTimes)
            : (0, utils_1.parseDailyTimesForRoutine)(existing.dailyTimes);
        const scheduleChanged = patch.dailyTimes !== undefined ||
            patch.timeZone !== undefined;
        const result = await this.pool.query(routineSql_1.ROUTINE_SQL.UPDATE, [
            routineId,
            mergedName,
            mergedJobClass,
            (0, utils_1.formatJobArgs)(mergedArgs),
            mergedPriority,
            mergedQueue,
            mergedTz,
            mergedTimes,
            scheduleChanged,
            existing.nextRunAt,
        ]);
        if (result.rows.length === 0) {
            return null;
        }
        return Client.mapRoutineRow(result.rows[0]);
    }
    /**
     * Enqueues one job per due routine and advances each routine's `nextRunAt`.
     * Call this from a scheduler (cron, `setInterval`, or an external worker) at a steady cadence.
     */
    async runDueRoutines(limit = 100) {
        const client = await this.pool.connect();
        const enqueuedJobIds = [];
        const processedRoutineIds = [];
        try {
            await client.query("BEGIN");
            const due = await client.query(routineSql_1.ROUTINE_SQL.SELECT_DUE, [limit]);
            for (const row of due.rows) {
                const slotAt = row.next_run_at;
                const job = await this.enqueueInTx(client, row.job_class, (0, utils_1.parseJobArgs)(row.args), {
                    priority: row.priority,
                    runAt: slotAt,
                    queue: row.queue,
                });
                enqueuedJobIds.push(job.id);
                processedRoutineIds.push(parseInt(row.routine_id, 10));
                await client.query(routineSql_1.ROUTINE_SQL.BUMP_NEXT, [row.routine_id, slotAt]);
            }
            await client.query("COMMIT");
        }
        catch (err) {
            try {
                await client.query("ROLLBACK");
            }
            catch {
                // ignore rollback errors
            }
            throw err;
        }
        finally {
            client.release();
        }
        return { enqueuedJobIds, processedRoutineIds };
    }
    static mapRoutineRow(row) {
        return {
            id: parseInt(row.routine_id, 10),
            name: row.name,
            jobClass: row.job_class,
            args: (0, utils_1.parseJobArgs)(row.args),
            priority: row.priority,
            queue: row.queue,
            timeZone: row.time_zone,
            dailyTimes: (row.daily_times ?? []).map(Client.formatDailyTimeFromPg),
            enabled: row.enabled,
            nextRunAt: row.next_run_at,
            createdAt: row.created_at,
        };
    }
    static formatDailyTimeFromPg(value) {
        if (typeof value === "string") {
            return value.slice(0, 5);
        }
        if (value instanceof Date) {
            const hours = value.getUTCHours();
            const minutes = value.getUTCMinutes();
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        }
        return String(value);
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map