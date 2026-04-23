import { Client } from '../src/client';
import { Schedule } from '../src/utils';
import { setupTestDatabase, cleanupTestDatabase, TEST_DB_CONFIG } from './setup';
import { Pool } from 'pg';

describe('Routines', () => {
  let pool: Pool;
  let client: Client;

  beforeAll(async () => {
    pool = await setupTestDatabase();
  });

  beforeEach(async () => {
    client = new Client(TEST_DB_CONFIG);
    await pool.query('TRUNCATE que_jobs, que_routines RESTART IDENTITY CASCADE');
  });

  afterEach(async () => {
    await client.close();
  });

  afterAll(async () => {
    await cleanupTestDatabase(pool);
  });

  it('creates a routine with a future nextRunAt', async () => {
    const routine = await client.createRoutine({
      name: 'Weather checks',
      jobClass: 'FetchWeather',
      args: [{ city: 'Accra' }],
      timeZone: 'UTC',
      cronExpression: Schedule.daily('07:00'),
    });

    expect(routine.id).toBeGreaterThan(0);
    expect(routine.jobClass).toBe('FetchWeather');
    expect(routine.cronExpression).toBe('0 7 * * *');
    expect(routine.nextRunAt.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it('creates a weekly routine', async () => {
    const routine = await client.createRoutine({
      name: 'Weekly report',
      jobClass: 'WeeklyReport',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.weekly(1, '09:00'), // every Monday
    });

    expect(routine.cronExpression).toBe('0 9 * * 1');
    expect(routine.nextRunAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('creates a monthly routine', async () => {
    const routine = await client.createRoutine({
      name: 'Monthly billing',
      jobClass: 'MonthlyBilling',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.monthly(1, '00:00'),
    });

    expect(routine.cronExpression).toBe('0 0 1 * *');
  });

  it('creates a quarterly routine', async () => {
    const routine = await client.createRoutine({
      name: 'Quarterly review',
      jobClass: 'QuarterlyReview',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.quarterly('09:00'),
    });

    expect(routine.cronExpression).toBe('0 9 1 1,4,7,10 *');
  });

  it('creates a yearly routine', async () => {
    const routine = await client.createRoutine({
      name: 'Annual audit',
      jobClass: 'AnnualAudit',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.yearly(1, 1, '00:00'),
    });

    expect(routine.cronExpression).toBe('0 0 1 1 *');
  });

  it('accepts a raw cron expression', async () => {
    const routine = await client.createRoutine({
      jobClass: 'CustomJob',
      args: [],
      timeZone: 'America/New_York',
      cronExpression: '*/30 9-17 * * 1-5', // every 30 min, 9-5, weekdays
    });

    expect(routine.cronExpression).toBe('*/30 9-17 * * 1-5');
  });

  it('rejects an invalid cron expression', async () => {
    await expect(
      client.createRoutine({
        jobClass: 'X',
        args: [],
        timeZone: 'UTC',
        cronExpression: 'not-a-cron',
      })
    ).rejects.toThrow(/invalid cron expression/i);
  });

  it('runDueRoutines enqueues jobs and advances nextRunAt', async () => {
    const routine = await client.createRoutine({
      jobClass: 'FetchWeather',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.daily('07:00'),
    });

    await pool.query(
      `UPDATE que_routines SET next_run_at = now() - interval '1 minute' WHERE routine_id = $1`,
      [routine.id]
    );

    const before = await client.getRoutine(routine.id);
    expect(before).not.toBeNull();

    const result = await client.runDueRoutines(10);
    expect(result.processedRoutineIds).toEqual([routine.id]);
    expect(result.enqueuedJobIds.length).toBe(1);

    const jobs = await pool.query(`SELECT job_class, run_at FROM que_jobs WHERE job_id = $1`, [
      result.enqueuedJobIds[0],
    ]);
    expect(jobs.rows[0].job_class).toBe('FetchWeather');

    const after = await client.getRoutine(routine.id);
    expect(after!.nextRunAt.getTime()).toBeGreaterThan(before!.nextRunAt.getTime());
  });

  it('does not enqueue when routine is disabled', async () => {
    const routine = await client.createRoutine({
      jobClass: 'FetchWeather',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.daily('08:00'),
    });

    await pool.query(
      `UPDATE que_routines SET next_run_at = now() - interval '1 minute' WHERE routine_id = $1`,
      [routine.id]
    );
    await client.setRoutineEnabled(routine.id, false);

    const result = await client.runDueRoutines(10);
    expect(result.enqueuedJobIds.length).toBe(0);

    const count = await pool.query(`SELECT count(*)::int AS c FROM que_jobs`);
    expect(count.rows[0].c).toBe(0);
  });

  it('lists routines with enabled filter', async () => {
    const a = await client.createRoutine({
      name: 'A',
      jobClass: 'JobA',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.daily('09:00'),
    });
    const b = await client.createRoutine({
      name: 'B',
      jobClass: 'JobB',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.daily('10:00'),
    });
    await client.setRoutineEnabled(b.id, false);

    const enabledOnly = await client.listRoutines({ enabled: true });
    expect(enabledOnly.map((r) => r.id)).toEqual([a.id]);

    const disabledOnly = await client.listRoutines({ enabled: false });
    expect(disabledOnly.map((r) => r.id)).toEqual([b.id]);

    const all = await client.listRoutines();
    expect(all.length).toBe(2);
  });

  it('deletes a routine', async () => {
    const routine = await client.createRoutine({
      jobClass: 'X',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.daily('11:00'),
    });
    const removed = await client.deleteRoutine(routine.id);
    expect(removed).toBe(true);
    expect(await client.getRoutine(routine.id)).toBeNull();
  });

  it('updateRoutine keeps nextRunAt when only name changes', async () => {
    const routine = await client.createRoutine({
      name: 'Old',
      jobClass: 'X',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.daily('12:00'),
    });
    const nextBefore = routine.nextRunAt.getTime();

    const updated = await client.updateRoutine(routine.id, { name: 'New' });
    expect(updated!.name).toBe('New');
    expect(updated!.nextRunAt.getTime()).toBe(nextBefore);
  });

  describe('idempotency', () => {
    it('second createRoutine with same name updates the existing routine', async () => {
      const first = await client.createRoutine({
        name: 'daily-report',
        jobClass: 'SendDailyReport',
        args: [],
        timeZone: 'UTC',
        cronExpression: Schedule.daily('09:00'),
      });

      const second = await client.createRoutine({
        name: 'daily-report',
        jobClass: 'SendDailyReport',
        args: [{ format: 'pdf' }],
        timeZone: 'UTC',
        cronExpression: Schedule.daily('10:00'),
      });

      // Same row, not a new one
      expect(second.id).toBe(first.id);
      // Updated fields
      expect(second.cronExpression).toBe('0 10 * * *');
      expect(second.args).toEqual([{ format: 'pdf' }]);

      const all = await client.listRoutines();
      expect(all.length).toBe(1);
    });

    it('unnamed routines are not deduplicated', async () => {
      await client.createRoutine({
        jobClass: 'SomeJob',
        args: [],
        timeZone: 'UTC',
        cronExpression: Schedule.daily('09:00'),
      });
      await client.createRoutine({
        jobClass: 'SomeJob',
        args: [],
        timeZone: 'UTC',
        cronExpression: Schedule.daily('09:00'),
      });

      const all = await client.listRoutines();
      expect(all.length).toBe(2);
    });

    it('is safe to call createRoutine on every app startup', async () => {
      const definitions = [
        { name: 'billing',  jobClass: 'RunBilling',  cronExpression: Schedule.monthly(1, '00:00') },
        { name: 'report',   jobClass: 'SendReport',  cronExpression: Schedule.weekly(1, '09:00') },
      ];

      // Simulate two deploys
      for (let i = 0; i < 2; i++) {
        for (const def of definitions) {
          await client.createRoutine({ ...def, args: [], timeZone: 'UTC' });
        }
      }

      const all = await client.listRoutines();
      expect(all.length).toBe(2);
    });
  });

  it('updateRoutine recalculates nextRunAt when schedule changes', async () => {
    const routine = await client.createRoutine({
      name: 'Test',
      jobClass: 'X',
      args: [],
      timeZone: 'UTC',
      cronExpression: Schedule.daily('12:00'),
    });

    // Force nextRunAt into the past
    await pool.query(
      `UPDATE que_routines SET next_run_at = now() - interval '1 day' WHERE routine_id = $1`,
      [routine.id]
    );

    const updated = await client.updateRoutine(routine.id, {
      cronExpression: Schedule.weekly(1, '09:00'),
    });
    expect(updated!.cronExpression).toBe('0 9 * * 1');
    expect(updated!.nextRunAt.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });
});
