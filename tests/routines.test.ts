import { Client } from '../src/client';
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
      dailyTimes: ['07:00', '14:00', '19:00'],
    });

    expect(routine.id).toBeGreaterThan(0);
    expect(routine.jobClass).toBe('FetchWeather');
    expect(routine.dailyTimes).toEqual(['07:00', '14:00', '19:00']);
    expect(routine.nextRunAt.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it('runDueRoutines enqueues jobs and advances nextRunAt', async () => {
    const routine = await client.createRoutine({
      jobClass: 'FetchWeather',
      args: [],
      timeZone: 'UTC',
      dailyTimes: ['07:00', '14:00', '19:00'],
    });

    await pool.query(`UPDATE que_routines SET next_run_at = now() - interval '1 minute' WHERE routine_id = $1`, [
      routine.id,
    ]);

    const before = await client.getRoutine(routine.id);
    expect(before).not.toBeNull();

    const result = await client.runDueRoutines(10);
    expect(result.processedRoutineIds).toEqual([routine.id]);
    expect(result.enqueuedJobIds.length).toBe(1);

    const jobs = await pool.query(`SELECT job_class, run_at FROM que_jobs WHERE job_id = $1`, [
      result.enqueuedJobIds[0],
    ]);
    expect(jobs.rows[0].job_class).toBe('FetchWeather');
    expect(Math.abs(new Date(jobs.rows[0].run_at).getTime() - before!.nextRunAt.getTime())).toBeLessThan(2000);

    const after = await client.getRoutine(routine.id);
    expect(after!.nextRunAt.getTime()).toBeGreaterThan(before!.nextRunAt.getTime());
  });

  it('does not enqueue when routine is disabled', async () => {
    const routine = await client.createRoutine({
      jobClass: 'FetchWeather',
      args: [],
      timeZone: 'UTC',
      dailyTimes: ['08:00'],
    });

    await pool.query(`UPDATE que_routines SET next_run_at = now() - interval '1 minute' WHERE routine_id = $1`, [
      routine.id,
    ]);
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
      dailyTimes: ['09:00'],
    });
    const b = await client.createRoutine({
      name: 'B',
      jobClass: 'JobB',
      args: [],
      timeZone: 'UTC',
      dailyTimes: ['10:00'],
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
      dailyTimes: ['11:00'],
    });
    const removed = await client.deleteRoutine(routine.id);
    expect(removed).toBe(true);
    expect(await client.getRoutine(routine.id)).toBeNull();
  });

  it('updateRoutine keeps schedule when only name changes', async () => {
    const routine = await client.createRoutine({
      name: 'Old',
      jobClass: 'X',
      args: [],
      timeZone: 'UTC',
      dailyTimes: ['12:00', '18:00'],
    });
    const nextBefore = routine.nextRunAt.getTime();

    const updated = await client.updateRoutine(routine.id, { name: 'New' });
    expect(updated!.name).toBe('New');
    expect(updated!.nextRunAt.getTime()).toBe(nextBefore);
  });
});
