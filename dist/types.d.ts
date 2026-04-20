import { ConnectionOptions } from "tls";
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
    [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {
}
export interface Job {
    id: number;
    queue: string;
    priority: number;
    runAt: Date;
    jobClass: string;
    args: JSONArray;
    errorCount: number;
    lastError?: string;
    delete(): Promise<void>;
    done(): Promise<void>;
    error(errorMessage: string): Promise<void>;
}
export interface EnqueueOptions {
    priority?: number;
    runAt?: Date;
    queue?: string;
}
/**
 * Repeating schedule: same wall-clock times every calendar day in an IANA time zone
 * (e.g. `America/New_York`). Times use 24-hour `HH:mm`.
 */
export interface CreateRoutineInput {
    /** Optional label for operators or UI */
    name?: string;
    jobClass: string;
    args?: JSONArray;
    priority?: number;
    queue?: string;
    /** IANA zone name, e.g. `UTC`, `Europe/London`, `America/New_York` */
    timeZone: string;
    /** Distinct or duplicate wall-clock times per day, e.g. `['07:00', '14:00', '19:00']` */
    dailyTimes: string[];
}
export interface UpdateRoutineInput {
    name?: string;
    jobClass?: string;
    args?: JSONArray;
    priority?: number;
    queue?: string;
    timeZone?: string;
    dailyTimes?: string[];
}
export interface Routine {
    id: number;
    name: string;
    jobClass: string;
    args: JSONArray;
    priority: number;
    queue: string;
    timeZone: string;
    dailyTimes: string[];
    enabled: boolean;
    nextRunAt: Date;
    createdAt: Date;
}
export interface RunDueRoutinesResult {
    enqueuedJobIds: number[];
    processedRoutineIds: number[];
}
export interface RoutineRow {
    routine_id: string;
    name: string;
    job_class: string;
    args: JSONArray;
    priority: number;
    queue: string;
    time_zone: string;
    daily_times: string[];
    enabled: boolean;
    next_run_at: Date;
    created_at: Date;
}
export interface WorkFunction {
    (job: Job): Promise<void>;
}
export interface WorkMap {
    [jobClass: string]: WorkFunction;
}
/**
 * SSL configuration options for PostgreSQL connection
 */
export interface SSLConfig extends ConnectionOptions {
    /**
     * Reject unauthorized certificates (default: true for security)
     * Set to false only in development/testing environments
     */
    rejectUnauthorized?: boolean;
    /**
     * Path to client certificate file (.crt or .pem)
     */
    cert?: string | Buffer;
    /**
     * Path to client private key file (.key)
     */
    key?: string | Buffer;
    /**
     * Path to CA certificate file to verify server certificate
     */
    ca?: string | Buffer | Array<string | Buffer>;
    /**
     * Passphrase for the private key if encrypted
     */
    passphrase?: string;
}
export interface ClientConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    /**
     * SSL configuration:
     * - false: No SSL
     * - true: SSL with default settings (rejectUnauthorized: true)
     * - SSLConfig object: Custom SSL configuration with certificates
     */
    ssl?: boolean | SSLConfig;
    dialectOptions?: object;
    maxConnections?: number;
}
export interface WorkerOptions {
    queue?: string;
    interval?: number;
    maxAttempts?: number;
    concurrency?: number;
}
export interface JobRow {
    priority: number;
    run_at: Date;
    job_id: string;
    job_class: string;
    args: JSONArray;
    error_count: number;
    last_error?: string | null;
    queue: string;
}
//# sourceMappingURL=types.d.ts.map