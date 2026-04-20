import { Pool, PoolClient } from "pg";
import { Job, EnqueueOptions, ClientConfig, JSONArray, CreateRoutineInput, Routine, UpdateRoutineInput, RunDueRoutinesResult } from "./types";
export declare class Client {
    private pool;
    constructor(config?: ClientConfig);
    enqueue(jobClass: string, args?: JSONArray, options?: EnqueueOptions): Promise<Job>;
    enqueueInTx(txClient: PoolClient, jobClass: string, args?: JSONArray, options?: EnqueueOptions): Promise<Job>;
    lockJob(queue?: string, maxAttempts?: number): Promise<Job | null>;
    /**
     * Send a NOTIFY on the que_jobs channel to wake up listening workers.
     */
    notify(queue?: string): Promise<void>;
    /**
     * Delete jobs that have exceeded the maximum number of attempts.
     * Returns the number of removed jobs.
     */
    cleanupDeadJobs(maxAttempts?: number): Promise<number>;
    getPool(): Pool;
    close(): Promise<void>;
    createRoutine(input: CreateRoutineInput): Promise<Routine>;
    getRoutine(routineId: number): Promise<Routine | null>;
    listRoutines(filter?: {
        enabled?: boolean;
    }): Promise<Routine[]>;
    deleteRoutine(routineId: number): Promise<boolean>;
    setRoutineEnabled(routineId: number, enabled: boolean): Promise<Routine | null>;
    updateRoutine(routineId: number, patch: UpdateRoutineInput): Promise<Routine | null>;
    /**
     * Enqueues one job per due routine and advances each routine's `nextRunAt`.
     * Call this from a scheduler (cron, `setInterval`, or an external worker) at a steady cadence.
     */
    runDueRoutines(limit?: number): Promise<RunDueRoutinesResult>;
    private static mapRoutineRow;
    private static formatDailyTimeFromPg;
}
//# sourceMappingURL=client.d.ts.map