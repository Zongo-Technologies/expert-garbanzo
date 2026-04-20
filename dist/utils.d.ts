import { JSONArray } from './types';
export declare function intPow(base: number, exponent: number): number;
export declare function calculateRetryDelay(errorCount: number): number;
export declare function formatJobArgs(args: JSONArray): string;
/**
 * Validates `HH:mm` (24-hour) strings and returns `HH:MM:SS` values suitable for PostgreSQL `time[]`.
 */
export declare function parseDailyTimesForRoutine(times: string[]): string[];
export declare function parseJobArgs(args: JSONArray): JSONArray;
//# sourceMappingURL=utils.d.ts.map