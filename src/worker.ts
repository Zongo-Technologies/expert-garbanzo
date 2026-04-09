import { PoolClient } from 'pg';
import { Client } from './client';
import { Job, WorkFunction, WorkMap, WorkerOptions, ClientConfig } from './types';

export class Worker {
  private client: Client;
  private workMap: WorkMap = {};
  private queue: string;
  private interval: number;
  private concurrency: number;
  private maxAttempts: number;
  private running: boolean = false;
  private shutdownPromise: Promise<void> | null = null;
  private activeWorkers: number = 0;
  private wakeResolvers: Set<() => void> = new Set();
  private listenClient: PoolClient | null = null;

  constructor(clientConfig: ClientConfig = {}, options: WorkerOptions = {}) {
    this.client = new Client(clientConfig);
    this.queue = options.queue || '';
    this.interval = options.interval || 60 * 1000;
    this.concurrency = options.concurrency || 3;
    this.maxAttempts = options.maxAttempts || 5;
  }

  register(jobClass: string, workFunc: WorkFunction): void {
    this.workMap[jobClass] = workFunc;
  }

  async work(): Promise<void> {
    if (this.running) {
      throw new Error('Worker is already running');
    }

    this.running = true;

    await this.startListening();

    const loops = Array.from({ length: this.concurrency }, () => this.workLoop());
    this.shutdownPromise = Promise.all(loops).then(() => { });
    return this.shutdownPromise;
  }

  async workOne(): Promise<boolean> {
    const job = await this.client.lockJob(this.queue, this.maxAttempts);

    if (!job) {
      return false;
    }

    await this.processJob(job);
    return true;
  }

  async shutdown(): Promise<void> {
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

  private async startListening(): Promise<void> {
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

  private async stopListening(): Promise<void> {
    if (this.listenClient) {
      try {
        const channel = `que_jobs_${this.queue}`;
        await this.listenClient.query(`UNLISTEN ${this.escapeIdentifier(channel)}`);
      } catch {
        // Connection may already be closed
      } finally {
        this.listenClient.release();
        this.listenClient = null;
      }
    }
  }

  private escapeIdentifier(str: string): string {
    // Simple escape for channel names — only allow safe characters
    return '"' + str.replace(/"/g, '""') + '"';
  }

  private async workLoop(): Promise<void> {
    this.activeWorkers++;

    try {
      while (this.running) {
        try {
          const processed = await this.workOne();

          if (!processed && this.running) {
            await this.waitForWake();
          }
        } catch (error) {
          console.error('Worker error:', error);

          if (this.running) {
            await this.waitForWake();
          }
        }
      }
    } finally {
      this.activeWorkers--;
    }
  }

  /**
   * Wait for either a LISTEN/NOTIFY wake or the poll interval, whichever comes first.
   */
  private waitForWake(): Promise<void> {
    return new Promise<void>((resolve) => {
      const wrappedResolve = () => {
        clearTimeout(timeoutId);
        this.wakeResolvers.delete(wrappedResolve);
        resolve();
      };

      this.wakeResolvers.add(wrappedResolve);

      const timeoutId = setTimeout(wrappedResolve, this.interval);
    });
  }

  private async processJob(job: Job): Promise<void> {
    const workFunc = this.workMap[job.jobClass];

    if (!workFunc) {
      await job.error(`No work function registered for job class: ${job.jobClass}`);
      return;
    }

    try {
      await workFunc(job);
      await job.done();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await job.error(errorMessage);
    }
  }
}
