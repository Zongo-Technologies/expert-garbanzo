import { WorkFunction, WorkerOptions, ClientConfig } from './types';
export declare class Worker {
    private client;
    private workMap;
    private queue;
    private interval;
    private concurrency;
    private maxAttempts;
    private running;
    private shutdownPromise;
    private activeWorkers;
    private wakeResolvers;
    private listenClient;
    constructor(clientConfig?: ClientConfig, options?: WorkerOptions);
    register(jobClass: string, workFunc: WorkFunction): void;
    work(): Promise<void>;
    workOne(): Promise<boolean>;
    shutdown(): Promise<void>;
    private startListening;
    private stopListening;
    private escapeIdentifier;
    private workLoop;
    /**
     * Wait for either a LISTEN/NOTIFY wake or the poll interval, whichever comes first.
     */
    private waitForWake;
    private processJob;
}
//# sourceMappingURL=worker.d.ts.map