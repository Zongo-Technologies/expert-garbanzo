import { JSONArray, JSONValue } from './types';
import { CronExpressionParser } from 'cron-parser';

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

/**
 * Computes the next fire time for a cron expression after `after` (defaults to now).
 * Throws if the expression is invalid or no next occurrence exists.
 */
export function computeNextRunAt(cronExpression: string, timeZone: string, after: Date = new Date()): Date {
  const interval = CronExpressionParser.parse(cronExpression, { currentDate: after, tz: timeZone });
  return interval.next().toDate();
}

/**
 * Validates a cron expression + timezone pair. Throws a descriptive error if invalid.
 */
export function validateCronExpression(cronExpression: string, timeZone: string): void {
  try {
    CronExpressionParser.parse(cronExpression, { tz: timeZone });
  } catch (err: unknown) {
    throw new Error(
      `Invalid cron expression "${cronExpression}" with timezone "${timeZone}": ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Helpers to build common cron expressions without writing raw cron syntax.
 *
 * All `time` parameters use 24-hour `HH:mm` format.
 * `dayOfWeek`: 0 = Sunday … 6 = Saturday.
 * `month`: 1 = January … 12 = December.
 */
export const Schedule = {
  /** Every day at the given time. e.g. `Schedule.daily('09:00')` → `'0 9 * * *'` */
  daily(time: string): string {
    const [h, m] = parseTime(time);
    return `${m} ${h} * * *`;
  },

  /** Every week on the given day at the given time. e.g. `Schedule.weekly(1, '09:00')` → `'0 9 * * 1'` */
  weekly(dayOfWeek: number, time: string): string {
    if (dayOfWeek < 0 || dayOfWeek > 6) throw new Error('dayOfWeek must be 0 (Sun) – 6 (Sat)');
    const [h, m] = parseTime(time);
    return `${m} ${h} * * ${dayOfWeek}`;
  },

  /** Every month on the given day-of-month at the given time. e.g. `Schedule.monthly(1, '09:00')` → `'0 9 1 * *'` */
  monthly(dayOfMonth: number, time: string): string {
    if (dayOfMonth < 1 || dayOfMonth > 31) throw new Error('dayOfMonth must be 1–31');
    const [h, m] = parseTime(time);
    return `${m} ${h} ${dayOfMonth} * *`;
  },

  /** Four times a year (Jan/Apr/Jul/Oct 1st) at the given time. e.g. `Schedule.quarterly('09:00')` → `'0 9 1 1,4,7,10 *'` */
  quarterly(time: string): string {
    const [h, m] = parseTime(time);
    return `${m} ${h} 1 1,4,7,10 *`;
  },

  /**
   * Once a year on the given month + day at the given time.
   * e.g. `Schedule.yearly(1, 1, '00:00')` → `'0 0 1 1 *'` (Jan 1st midnight)
   */
  yearly(month: number, dayOfMonth: number, time: string): string {
    if (month < 1 || month > 12) throw new Error('month must be 1–12');
    if (dayOfMonth < 1 || dayOfMonth > 31) throw new Error('dayOfMonth must be 1–31');
    const [h, m] = parseTime(time);
    return `${m} ${h} ${dayOfMonth} ${month} *`;
  },
} as const;

const TIME_RE = /^(\d{1,2}):(\d{2})$/;

function parseTime(raw: string): [hour: number, minute: number] {
  const m = TIME_RE.exec(raw.trim());
  if (!m) throw new Error(`Invalid time "${raw}", expected HH:mm (24-hour)`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23) throw new Error(`Invalid hour in "${raw}"`);
  if (min < 0 || min > 59) throw new Error(`Invalid minute in "${raw}"`);
  return [h, min];
}

export function parseJobArgs(args: JSONArray): JSONArray {
  if (!Array.isArray(args)) {
    throw new Error(`Expected job arguments to be an array, received: ${typeof args}`);
  }
  return args;
}

// Keep for any external callers that may import it directly.
/** @deprecated Use `Schedule.daily()` or a raw `cronExpression` instead. */
export function parseDailyTimesForRoutine(_times: string[]): string[] {
  throw new Error(
    'parseDailyTimesForRoutine is removed. Use Schedule.daily() or pass a cronExpression directly.'
  );
}
