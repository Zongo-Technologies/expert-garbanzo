import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  database: process.env.TEST_DB_NAME || 'que_test',
  user: process.env.TEST_DB_USER || 'que_user',
  password: process.env.TEST_DB_PASSWORD || 'que_password',
  ssl: process.env.TEST_DB_SSL === 'true' ? true : false,
};

export async function setupTestDatabase(): Promise<Pool> {
  const pool = new Pool(TEST_DB_CONFIG);
  
  // Test connection
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    throw new Error(`Failed to connect to test database: ${error}`);
  }

  // The table should already exist from Docker initialization
  // But we'll ensure it exists for non-Docker environments
  await pool.query(`
    CREATE TABLE IF NOT EXISTS que_jobs (
      priority    smallint    NOT NULL DEFAULT 100,
      run_at      timestamptz NOT NULL DEFAULT now(),
      job_id      bigserial   NOT NULL,
      job_class   text        NOT NULL,
      args        json        NOT NULL DEFAULT '[]'::json,
      error_count integer     NOT NULL DEFAULT 0,
      last_error  text,
      queue       text        NOT NULL DEFAULT '',
      PRIMARY KEY (queue, priority, run_at, job_id)
    )
  `);

  // Always drop and recreate que_routines to ensure the schema matches the current migration.
  await pool.query('DROP TABLE IF EXISTS que_routines CASCADE');
  await pool.query('DROP FUNCTION IF EXISTS que_next_daily_slot(time[], text, timestamptz)');
  const routinesPath = path.join(__dirname, '../migrations/que_routines.sql');
  const routinesSql = fs.readFileSync(routinesPath, 'utf8');
  await pool.query(routinesSql);

  return pool;
}

export async function cleanupTestDatabase(pool: Pool): Promise<void> {
  await pool.query('TRUNCATE que_jobs, que_routines RESTART IDENTITY CASCADE');
  await pool.end();
}