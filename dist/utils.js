"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = void 0;
exports.intPow = intPow;
exports.calculateRetryDelay = calculateRetryDelay;
exports.formatJobArgs = formatJobArgs;
exports.computeNextRunAt = computeNextRunAt;
exports.validateCronExpression = validateCronExpression;
exports.parseJobArgs = parseJobArgs;
exports.parseDailyTimesForRoutine = parseDailyTimesForRoutine;
const cron_parser_1 = require("cron-parser");
function intPow(base, exponent) {
    if (exponent < 0) {
        return 0;
    }
    let result = 1;
    for (let i = 0; i < exponent; i++) {
        result *= base;
    }
    return result;
}
function calculateRetryDelay(errorCount) {
    return intPow(errorCount, 4);
}
function formatJobArgs(args) {
    return JSON.stringify(args);
}
/**
 * Computes the next fire time for a cron expression after `after` (defaults to now).
 * Throws if the expression is invalid or no next occurrence exists.
 */
function computeNextRunAt(cronExpression, timeZone, after = new Date()) {
    const interval = cron_parser_1.CronExpressionParser.parse(cronExpression, { currentDate: after, tz: timeZone });
    return interval.next().toDate();
}
/**
 * Validates a cron expression + timezone pair. Throws a descriptive error if invalid.
 */
function validateCronExpression(cronExpression, timeZone) {
    try {
        cron_parser_1.CronExpressionParser.parse(cronExpression, { tz: timeZone });
    }
    catch (err) {
        throw new Error(`Invalid cron expression "${cronExpression}" with timezone "${timeZone}": ${err instanceof Error ? err.message : String(err)}`);
    }
}
/**
 * Helpers to build common cron expressions without writing raw cron syntax.
 *
 * All `time` parameters use 24-hour `HH:mm` format.
 * `dayOfWeek`: 0 = Sunday … 6 = Saturday.
 * `month`: 1 = January … 12 = December.
 */
exports.Schedule = {
    /** Every day at the given time. e.g. `Schedule.daily('09:00')` → `'0 9 * * *'` */
    daily(time) {
        const [h, m] = parseTime(time);
        return `${m} ${h} * * *`;
    },
    /** Every week on the given day at the given time. e.g. `Schedule.weekly(1, '09:00')` → `'0 9 * * 1'` */
    weekly(dayOfWeek, time) {
        if (dayOfWeek < 0 || dayOfWeek > 6)
            throw new Error('dayOfWeek must be 0 (Sun) – 6 (Sat)');
        const [h, m] = parseTime(time);
        return `${m} ${h} * * ${dayOfWeek}`;
    },
    /** Every month on the given day-of-month at the given time. e.g. `Schedule.monthly(1, '09:00')` → `'0 9 1 * *'` */
    monthly(dayOfMonth, time) {
        if (dayOfMonth < 1 || dayOfMonth > 31)
            throw new Error('dayOfMonth must be 1–31');
        const [h, m] = parseTime(time);
        return `${m} ${h} ${dayOfMonth} * *`;
    },
    /** Four times a year (Jan/Apr/Jul/Oct 1st) at the given time. e.g. `Schedule.quarterly('09:00')` → `'0 9 1 1,4,7,10 *'` */
    quarterly(time) {
        const [h, m] = parseTime(time);
        return `${m} ${h} 1 1,4,7,10 *`;
    },
    /**
     * Once a year on the given month + day at the given time.
     * e.g. `Schedule.yearly(1, 1, '00:00')` → `'0 0 1 1 *'` (Jan 1st midnight)
     */
    yearly(month, dayOfMonth, time) {
        if (month < 1 || month > 12)
            throw new Error('month must be 1–12');
        if (dayOfMonth < 1 || dayOfMonth > 31)
            throw new Error('dayOfMonth must be 1–31');
        const [h, m] = parseTime(time);
        return `${m} ${h} ${dayOfMonth} ${month} *`;
    },
};
const TIME_RE = /^(\d{1,2}):(\d{2})$/;
function parseTime(raw) {
    const m = TIME_RE.exec(raw.trim());
    if (!m)
        throw new Error(`Invalid time "${raw}", expected HH:mm (24-hour)`);
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 0 || h > 23)
        throw new Error(`Invalid hour in "${raw}"`);
    if (min < 0 || min > 59)
        throw new Error(`Invalid minute in "${raw}"`);
    return [h, min];
}
function parseJobArgs(args) {
    if (!Array.isArray(args)) {
        throw new Error(`Expected job arguments to be an array, received: ${typeof args}`);
    }
    return args;
}
// Keep for any external callers that may import it directly.
/** @deprecated Use `Schedule.daily()` or a raw `cronExpression` instead. */
function parseDailyTimesForRoutine(_times) {
    throw new Error('parseDailyTimesForRoutine is removed. Use Schedule.daily() or pass a cronExpression directly.');
}
//# sourceMappingURL=utils.js.map