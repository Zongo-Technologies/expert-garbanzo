import { Que, WorkerInterface } from './test_client';
import { Pool } from 'pg';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';

const workerResult: (string | undefined)[] = []

class TestWorker implements WorkerInterface<string> {
  async worker(args: string | undefined) {
    // Worker successfully processed job with args: args
    console.log(`TestWorker processed with args ${args}`)
    workerResult.push(args)
    return undefined;
  }
}

describe('que', () => {
  let pool: Pool;
  let que: Que;
  const testQueue = 'test-impl-queue';

  beforeAll(async () => {
    pool = await setupTestDatabase();
  });

  beforeEach(async () => {
    // Clear workerResult array before each test
    workerResult.length = 0;
    // Clear any existing jobs in our test queue
    await pool.query('DELETE FROM que_jobs WHERE queue = $1', [testQueue]);
    // Create a fresh Que instance for each test with a unique queue
    que = new Que(testQueue);
    await que.registerWorker(new TestWorker());
    que.start();
    // Give worker a moment to start
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await que.shutdown();
    // Extra safety: clean up jobs in our queue after shutdown
    await pool.query('DELETE FROM que_jobs WHERE queue = $1', [testQueue]);
  });

  afterAll(async () => {
    await cleanupTestDatabase(pool);
  });

  it('should enqueue a job', async () => {
    const job = await que.enqueue(TestWorker, 'test');
    expect(job).toBeDefined();
    expect(job.jobClass).toBe('TestWorker');
    expect(job.id).toBeGreaterThan(0);

    expect(workerResult).toHaveLength(0)

    // Wait for job to be processed with a retry mechanism
    let attempts = 0;
    const maxAttempts = 5;
    while (workerResult.length === 0 && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    expect(workerResult).toHaveLength(1)
    expect(workerResult[0]).toBe('test')
  });
});
