-- Migration: add total_runs counter to que_routines for dashboard stats.
-- Run this once against an existing database that has the v3 que_routines schema.

ALTER TABLE que_routines
  ADD COLUMN IF NOT EXISTS total_runs bigint NOT NULL DEFAULT 0;
