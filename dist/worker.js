"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const client_1 = require("./client");
class Worker {
    constructor(clientConfig = {}, options = {}) {
        this.workMap = {};
        this.running = false;
        this.shutdownPromise = null;
        this.activeWorkers = 0;
        this.wakeResolvers = new Set();
        this.listenClient = null;
        this.client = new client_1.Client(clientConfig);
        this.queue = options.queue || '';
        this.interval = options.interval || 60 * 1000;
        this.concurrency = options.concurrency || 3;
        this.maxAttempts = options.maxAttempts || 5;
    }
    register(jobClass, workFunc) {
        this.workMap[jobClass] = workFunc;
    }
    async work() {
        if (this.running) {
            throw new Error('Worker is already running');
        }
        this.running = true;
        await this.startListening();
        const loops = Array.from({ length: this.concurrency }, () => this.workLoop());
        this.shutdownPromise = Promise.all(loops).then(() => { });
        return this.shutdownPromise;
    }
    async workOne() {
        const job = await this.client.lockJob(this.queue, this.maxAttempts);
        if (!job) {
            return false;
        }
        await this.processJob(job);
        return true;
    }
    async shutdown() {
        if (!this.running) {
            return;
        }
        this.running = false;
        // Wake all sleeping loops so they can exit
        for (const resolve of this.wakeResolvers) {
            resolve();
        }
        this.wakeResolvers.clear();
        if (this.shutdownPromise) {
            await this.shutdownPromise;
        }
        await this.stopListening();
        await this.client.close();
    }
    async startListening() {
        const pool = this.client.getPool();
        this.listenClient = await pool.connect();
        const channel = `que_jobs_${this.queue}`;
        await this.listenClient.query(`LISTEN ${this.escapeIdentifier(channel)}`);
        this.listenClient.on('notification', () => {
            // Wake all sleeping worker loops
            for (const resolve of this.wakeResolvers) {
                resolve();
            }
            this.wakeResolvers.clear();
        });
    }
    async stopListening() {
        if (this.listenClient) {
            try {
                const channel = `que_jobs_${this.queue}`;
                await this.listenClient.query(`UNLISTEN ${this.escapeIdentifier(channel)}`);
            }
            catch {
                // Connection may already be closed
            }
            finally {
                this.listenClient.release();
                this.listenClient = null;
            }
        }
    }
    escapeIdentifier(str) {
        // Simple escape for channel names — only allow safe characters
        return '"' + str.replace(/"/g, '""') + '"';
    }
    async workLoop() {
        this.activeWorkers++;
        try {
            while (this.running) {
                try {
                    const processed = await this.workOne();
                    if (!processed && this.running) {
                        await this.waitForWake();
                    }
                }
                catch (error) {
                    console.error('Worker error:', error);
                    if (this.running) {
                        await this.waitForWake();
                    }
                }
            }
        }
        finally {
            this.activeWorkers--;
        }
    }
    /**
     * Wait for either a LISTEN/NOTIFY wake or the poll interval, whichever comes first.
     */
    waitForWake() {
        return new Promise((resolve) => {
            const wrappedResolve = () => {
                clearTimeout(timeoutId);
                this.wakeResolvers.delete(wrappedResolve);
                resolve();
            };
            this.wakeResolvers.add(wrappedResolve);
            const timeoutId = setTimeout(wrappedResolve, this.interval);
        });
    }
    async processJob(job) {
        const workFunc = this.workMap[job.jobClass];
        if (!workFunc) {
            await job.error(`No work function registered for job class: ${job.jobClass}`);
            return;
        }
        try {
            await workFunc(job);
            await job.done();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await job.error(errorMessage);
        }
    }
}
exports.Worker = Worker;
//# sourceMappingURL=worker.js.map