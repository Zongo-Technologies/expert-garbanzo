import { JSONArray } from './types';
export declare function intPow(base: number, exponent: number): number;
export declare function calculateRetryDelay(errorCount: number): number;
export declare function formatJobArgs(args: JSONArray): string;
/**
 * Computes the next fire time for a cron expression after `after` (defaults to now).
 * Throws if the expression is invalid or no next occurrence exists.
 */
export declare function computeNextRunAt(cronExpression: string, timeZone: string, after?: Date): Date;
/**
 * Validates a cron expression + timezone pair. Throws a descriptive error if invalid.
 */
export declare function validateCronExpression(cronExpression: string, timeZone: string): void;
/**
 * Helpers to build common cron expressions without writing raw cron syntax.
 *
 * All `time` parameters use 24-hour `HH:mm` format.
 * `dayOfWeek`: 0 = Sunday … 6 = Saturday.
 * `month`: 1 = January … 12 = December.
 */
export declare const Schedule: {
    /** Every day at the given time. e.g. `Schedule.daily('09:00')` → `'0 9 * * *'` */
    readonly daily: (time: string) => string;
    /** Every week on the given day at the given time. e.g. `Schedule.weekly(1, '09:00')` → `'0 9 * * 1'` */
    readonly weekly: (dayOfWeek: number, time: string) => string;
    /** Every month on the given day-of-month at the given time. e.g. `Schedule.monthly(1, '09:00')` → `'0 9 1 * *'` */
    readonly monthly: (dayOfMonth: number, time: string) => string;
    /** Four times a year (Jan/Apr/Jul/Oct 1st) at the given time. e.g. `Schedule.quarterly('09:00')` → `'0 9 1 1,4,7,10 *'` */
    readonly quarterly: (time: string) => string;
    /**
     * Once a year on the given month + day at the given time.
     * e.g. `Schedule.yearly(1, 1, '00:00')` → `'0 0 1 1 *'` (Jan 1st midnight)
     */
    readonly yearly: (month: number, dayOfMonth: number, time: string) => string;
};
export declare function parseJobArgs(args: JSONArray): JSONArray;
/** @deprecated Use `Schedule.daily()` or a raw `cronExpression` instead. */
export declare function parseDailyTimesForRoutine(_times: string[]): string[];
//# sourceMappingURL=utils.d.ts.map