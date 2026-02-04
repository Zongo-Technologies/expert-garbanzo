import { ConnectionOptions } from "tls";

// JSON type that represents valid JSON values
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONArray;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

export interface Job {
  id: number;
  queue: string;
  priority: number;
  runAt: Date;
  jobClass: string;
  args: JSONArray;
  errorCount: number;
  lastError?: string;

  // Job instance methods
  delete(): Promise<void>;
  done(): Promise<void>;
  error(errorMessage: string): Promise<void>;
}

export interface EnqueueOptions {
  priority?: number;
  runAt?: Date;
  queue?: string;
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
}

export interface JobRow {
  priority: number;
  run_at: Date;
  job_id: string; // PostgreSQL bigserial comes as string from pg driver
  job_class: string;
  args: JSONArray; // PostgreSQL JSON column - always an array for job arguments
  error_count: number;
  last_error?: string | null;
  queue: string;
}
