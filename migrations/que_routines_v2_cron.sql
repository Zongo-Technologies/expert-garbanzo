-- Migration: replace daily_times time[] with cron_expr text
-- Run this once against an existing database that has the v1 que_routines schema.
--
-- IMPORTANT: routines with multiple daily_times are migrated to a single cron
-- expression using only the FIRST time in the array. If you had a routine
-- running at multiple times per day, create additional routines after migrating.

BEGIN;

-- 1. Add the new column (nullable during migration)
ALTER TABLE que_routines
  ADD COLUMN IF NOT EXISTS cron_expr text;

-- 2. Convert existing daily_times to a cron expression using the first slot.
--    e.g. daily_times = {09:00:00, 14:00:00} → '0 9 * * *'
UPDATE que_routines
SET cron_expr = CONCAT(
  EXTRACT(MINUTE FROM daily_times[1])::int::text, ' ',
  EXTRACT(HOUR   FROM daily_times[1])::int::text, ' * * *'
)
WHERE cron_expr IS NULL
  AND daily_times IS NOT NULL
  AND array_length(daily_times, 1) > 0;

-- 3. Enforce NOT NULL now that all rows are filled
ALTER TABLE que_routines
  ALTER COLUMN cron_expr SET NOT NULL;

-- 4. Drop the old column
ALTER TABLE que_routines
  DROP COLUMN IF EXISTS daily_times;

-- 5. Drop the old PG helper function (no longer used)
DROP FUNCTION IF EXISTS que_next_daily_slot(time[], text, timestamptz);

COMMIT;
