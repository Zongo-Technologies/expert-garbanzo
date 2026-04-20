"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTINE_SQL = void 0;
exports.ROUTINE_SQL = {
    INSERT: `
    INSERT INTO que_routines (name, job_class, args, priority, queue, time_zone, daily_times, next_run_at)
    VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7::time[], que_next_daily_slot($7::time[], $6::text, now()))
    RETURNING routine_id, name, job_class, args, priority, queue, time_zone, daily_times, enabled, next_run_at, created_at
  `,
    SELECT_BY_ID: `
    SELECT routine_id, name, job_class, args, priority, queue, time_zone, daily_times, enabled, next_run_at, created_at
    FROM que_routines
    WHERE routine_id = $1
  `,
    LIST: `
    SELECT routine_id, name, job_class, args, priority, queue, time_zone, daily_times, enabled, next_run_at, created_at
    FROM que_routines
    WHERE ($1::boolean IS NULL OR enabled = $1)
    ORDER BY routine_id
  `,
    DELETE: `DELETE FROM que_routines WHERE routine_id = $1 RETURNING routine_id`,
    SET_ENABLED: `
    UPDATE que_routines
    SET enabled = $2,
        next_run_at = CASE
          WHEN $2 THEN que_next_daily_slot(daily_times, time_zone, now())
          ELSE next_run_at
        END
    WHERE routine_id = $1
    RETURNING routine_id, name, job_class, args, priority, queue, time_zone, daily_times, enabled, next_run_at, created_at
  `,
    UPDATE: `
    UPDATE que_routines
    SET
      name = $2,
      job_class = $3,
      args = $4::jsonb,
      priority = $5,
      queue = $6,
      time_zone = $7,
      daily_times = $8::time[],
      next_run_at = CASE
        WHEN $9 THEN que_next_daily_slot($8::time[], $7::text, now())
        ELSE $10::timestamptz
      END
    WHERE routine_id = $1
    RETURNING routine_id, name, job_class, args, priority, queue, time_zone, daily_times, enabled, next_run_at, created_at
  `,
    SELECT_DUE: `
    SELECT routine_id, name, job_class, args, priority, queue, time_zone, daily_times, enabled, next_run_at, created_at
    FROM que_routines
    WHERE enabled AND next_run_at <= now()
    ORDER BY next_run_at
    LIMIT $1
    FOR UPDATE SKIP LOCKED
  `,
    BUMP_NEXT: `
    UPDATE que_routines
    SET next_run_at = que_next_daily_slot(daily_times, time_zone, $2::timestamptz)
    WHERE routine_id = $1
  `,
};
//# sourceMappingURL=routineSql.js.map