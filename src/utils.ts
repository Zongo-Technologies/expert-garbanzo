import { JSONArray, JSONValue } from './types';

export function intPow(base: number, exponent: number): number {
  if (exponent < 0) {
    return 0;
  }

  let result = 1;
  for (let i = 0; i < exponent; i++) {
    result *= base;
  }

  return result;
}

export function calculateRetryDelay(errorCount: number): number {
  return intPow(errorCount, 4);
}

export function formatJobArgs(args: JSONArray): string {
  return JSON.stringify(args);
}

const DAILY_TIME_RE = /^(\d{1,2}):(\d{2})$/;

/**
 * Validates `HH:mm` (24-hour) strings and returns `HH:MM:SS` values suitable for PostgreSQL `time[]`.
 */
export function parseDailyTimesForRoutine(times: string[]): string[] {
  if (!times.length) {
    throw new Error("dailyTimes must include at least one time");
  }

  const normalized: string[] = [];
  for (const raw of times) {
    const m = DAILY_TIME_RE.exec(raw.trim());
    if (!m) {
      throw new Error(`Invalid daily time "${raw}", expected HH:mm (24-hour)`);
    }
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error(`Invalid daily time "${raw}", hour must be 0-23 and minute 0-59`);
    }
    normalized.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
  }

  return normalized;
}

export function parseJobArgs(args: JSONArray): JSONArray {
  // PostgreSQL JSON column is already parsed by the pg driver
  // Just validate it's an array and return it
  if (!Array.isArray(args)) {
    throw new Error(`Expected job arguments to be an array, received: ${typeof args}`);
  }

  return args;
}
