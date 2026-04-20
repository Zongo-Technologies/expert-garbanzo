-- Recurring routines: enqueue the same job class on a daily wall-clock schedule (IANA timezone).

CREATE OR REPLACE FUNCTION que_next_daily_slot(
  p_clock_times time[],
  p_tz text,
  p_after timestamptz
) RETURNS timestamptz
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  d0 date;
  d date;
  t time;
  candidate timestamptz;
  best timestamptz := NULL;
  day_off int;
BEGIN
  IF p_clock_times IS NULL OR coalesce(array_length(p_clock_times, 1), 0) = 0 THEN
    RETURN NULL;
  END IF;

  d0 := (p_after AT TIME ZONE p_tz)::date;

  FOR day_off IN 0..3 LOOP
    d := d0 + day_off;
    FOREACH t IN ARRAY p_clock_times LOOP
      candidate := ((d + t)::timestamp AT TIME ZONE p_tz);
      IF candidate > p_after THEN
        IF best IS NULL OR candidate < best THEN
          best := candidate;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RETURN best;
END;
$$;

CREATE TABLE IF NOT EXISTS que_routines (
  routine_id bigserial PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  job_class text NOT NULL,
  args jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority smallint NOT NULL DEFAULT 100,
  queue text NOT NULL DEFAULT '',
  time_zone text NOT NULL DEFAULT 'UTC',
  daily_times time[] NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  next_run_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS que_routines_due_idx
  ON que_routines (next_run_at)
  WHERE enabled;
