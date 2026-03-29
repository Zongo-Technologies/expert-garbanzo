import { Pool } from 'pg';
export interface QueueStats {
    total: number;
    scheduled: number;
    ready: number;
    failed: number;
    errorRate: number;
    avgErrorCount: number;
    oldestJob: Date | null;
    newestJob: Date | null;
    totalByQueue: Array<{
        queue: string;
        count: number;
    }>;
    totalByClass: Array<{
        jobClass: string;
        count: number;
    }>;
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
export declare class DashboardService {
    private pool;
    private options;
    constructor(pool: Pool, options?: DashboardOptions);
    getStats(): Promise<QueueStats>;
    getJobs(options?: {
        queue?: string;
        jobClass?: string;
        status?: 'ready' | 'scheduled' | 'failed' | 'all';
        limit?: number;
        offset?: number;
    }): Promise<{
        jobs: Job[];
        total: number;
    }>;
    getJob(jobId: number): Promise<Job | null>;
    deleteJob(jobId: number): Promise<boolean>;
    retryJob(jobId: number): Promise<boolean>;
    getQueues(): Promise<string[]>;
    getJobClasses(): Promise<string[]>;
    getOptions(): DashboardInternalOptions;
}
//# sourceMappingURL=service.d.ts.map