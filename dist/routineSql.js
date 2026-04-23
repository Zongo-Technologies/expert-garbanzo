"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTINE_SQL = void 0;
const COLS = `routine_id, name, job_class, args, priority, queue, time_zone, cron_expr, enabled, next_run_at, total_runs, created_at`;
exports.ROUTINE_SQL = {
    INSERT: `
    INSERT INTO que_routines (name, job_class, args, priority, queue, time_zone, cron_expr, next_run_at)
    VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)
    ON CONFLICT (name) WHERE name != ''
    DO UPDATE SET
      job_class   = EXCLUDED.job_class,
      args        = EXCLUDED.args,
      priority    = EXCLUDED.priority,
      queue       = EXCLUDED.queue,
      time_zone   = EXCLUDED.time_zone,
      cron_expr   = EXCLUDED.cron_expr,
      next_run_at = EXCLUDED.next_run_at
    RETURNING ${COLS}
  `,
    SELECT_BY_ID: `SELECT ${COLS} FROM que_routines WHERE routine_id = $1`,
    LIST: `
    SELECT ${COLS} FROM que_routines
    WHERE ($1::boolean IS NULL OR enabled = $1)
    ORDER BY routine_id
  `,
    LIST_ALL: `SELECT ${COLS} FROM que_routines ORDER BY routine_id`,
    DELETE: `DELETE FROM que_routines WHERE routine_id = $1 RETURNING routine_id`,
    SET_ENABLED: `
    UPDATE que_routines
    SET enabled = $2, next_run_at = $3
    WHERE routine_id = $1
    RETURNING ${COLS}
  `,
    UPDATE: `
    UPDATE que_routines
    SET name = $2, job_class = $3, args = $4::jsonb, priority = $5,
        queue = $6, time_zone = $7, cron_expr = $8, next_run_at = $9
    WHERE routine_id = $1
    RETURNING ${COLS}
  `,
    SELECT_DUE: `
    SELECT ${COLS} FROM que_routines
    WHERE enabled AND next_run_at <= now()
    ORDER BY next_run_at
    LIMIT $1
    FOR UPDATE SKIP LOCKED
  `,
    BUMP_NEXT: `
    UPDATE que_routines
    SET next_run_at = $2, total_runs = total_runs + 1
    WHERE routine_id = $1
  `,
    TOTAL_RUNS: `SELECT COALESCE(SUM(total_runs), 0)::bigint AS total FROM que_routines`,
};
//# sourceMappingURL=routineSql.js.map