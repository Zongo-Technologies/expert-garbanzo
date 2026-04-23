-- Recurring routines: enqueue the same job class on any cron schedule (IANA timezone).

CREATE TABLE IF NOT EXISTS que_routines (
  routine_id bigserial PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  job_class text NOT NULL,
  args jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority smallint NOT NULL DEFAULT 100,
  queue text NOT NULL DEFAULT '',
  time_zone text NOT NULL DEFAULT 'UTC',
  cron_expr text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  next_run_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS que_routines_due_idx
  ON que_routines (next_run_at)
  WHERE enabled;

-- Named routines are unique by name, enabling idempotent upserts on startup.
CREATE UNIQUE INDEX IF NOT EXISTS que_routines_name_key
  ON que_routines (name)
  WHERE name != '';
