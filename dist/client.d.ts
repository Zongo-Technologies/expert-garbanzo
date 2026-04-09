import { Pool, PoolClient } from "pg";
import { Job, EnqueueOptions, ClientConfig, JSONArray } from "./types";
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
}
//# sourceMappingURL=client.d.ts.map