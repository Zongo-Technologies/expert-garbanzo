-- Migration: add unique index on name for idempotent routine upserts.
-- Run this once against an existing database that has the v2 que_routines schema.
--
-- NOTE: if you have existing routines with duplicate non-empty names, deduplicate
-- them first (keep the one you want, delete the others) before running this migration.

CREATE UNIQUE INDEX IF NOT EXISTS que_routines_name_key
  ON que_routines (name)
  WHERE name != '';
