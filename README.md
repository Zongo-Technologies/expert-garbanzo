# worker-que

> A production-ready TypeScript job queue library for PostgreSQL with real-time monitoring dashboard

[![npm version](https://badge.fury.io/js/worker-que.svg)](https://www.npmjs.com/package/worker-que)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)

## Features

- ⚡ **High Performance** - PostgreSQL-backed with advisory locks for reliable job processing
- 📊 **Real-time Dashboard** - Beautiful web UI for monitoring and managing jobs
- 🕐 **Routines** - Recurring scheduled jobs with cron expressions, any frequency
- 🔐 **Enterprise Security** - SSL/TLS support with client certificates
- 🎯 **Priority Queues** - Multiple queues with configurable priorities
- 🔄 **Automatic Retries** - Exponential backoff for failed jobs
- 💾 **Transaction Support** - Enqueue jobs within database transactions
- 🌐 **Cross-Platform** - Compatible with Ruby Que and que-go
- 📝 **TypeScript Native** - Full type safety and IntelliSense support

## Quick Start

### Installation

```bash
npm install worker-que pg express
```

### Basic Usage

```typescript
import { Client, Worker } from 'worker-que';

// Create client
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

// Enqueue jobs
await client.enqueue('SendEmail', ['user@example.com', 'Welcome!']);

// Create worker
const worker = new Worker({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

// Register handlers
worker.register('SendEmail', async (job) => {
  const [email, message] = job.args;
  console.log(`Sending email to ${email}: ${message}`);
  // Your email logic here
});

// Start processing
await worker.work();
```

### Database Setup

Copy the migration files into your project, then run them against your database:

```bash
npx worker-que migrate        # copies SQL files to ./migrations/
psql -U postgres -d myapp -f migrations/schema.sql
psql -U postgres -d myapp -f migrations/que_routines.sql   # optional: only if using routines
```

Or run the SQL directly from the package:

```bash
psql -U postgres -d myapp -f node_modules/worker-que/migrations/schema.sql
```

## Web Dashboard

Monitor and manage your jobs with the built-in web dashboard featuring **Microsoft Fluent Design** and **secure authentication**:

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from 'worker-que/dist/dashboard';

const app = express();
const pool = new Pool({ /* your config */ });

// Built-in email/password authentication
app.use('/admin/queue', createDashboard(pool, {
  title: 'My Job Queue',
  auth: {
    email: 'admin@example.com',
    password: 'your-secure-password'
  }
}));

app.listen(3000);
// Visit http://localhost:3000/admin/queue
```

**Dashboard Features:**
- 📊 Real-time job statistics with auto-refresh
- 🕐 Routines tab — view all schedules, enable/disable, see total runs
- 📈 Visual analytics by queue and class
- 🔍 Filter jobs by status, queue, and class
- ☑️ Multi-select jobs for bulk retry or delete
- 🔴 Click-to-expand error viewer with full stack trace
- 🔄 Retry failed jobs (single or bulk)
- 🗑️ Delete jobs (single or bulk)
- 🔐 Built-in secure authentication with sessions
- 🎨 Modern Microsoft Fluent Design UI
- 📱 Fully responsive design

[**→ Complete Dashboard Documentation**](./DASHBOARD.md)

## Core Concepts

### Jobs

Jobs are units of work stored in PostgreSQL:

```typescript
await client.enqueue('ProcessPayment', [
  { amount: 100, userId: 123 }
], {
  priority: 10,        // Lower = higher priority
  queue: 'critical',   // Queue name
  runAt: new Date()    // Scheduled time
});
```

### Workers

Workers poll for jobs and execute registered handlers:

```typescript
const worker = new Worker({
  host: 'localhost',
  port: 5432,
  database: 'myapp'
}, {
  queue: 'critical',   // Process specific queue
  interval: 1000       // Poll every 1 second
});

worker.register('ProcessPayment', async (job) => {
  const [payment] = job.args;
  // Process payment...
  // Job automatically marked as done
});

await worker.work();
```

### Error Handling

Failed jobs are automatically retried with exponential backoff:

- 1st retry: after 1 second
- 2nd retry: after 16 seconds
- 3rd retry: after 81 seconds
- 4th retry: after 256 seconds

```typescript
worker.register('RiskyJob', async (job) => {
  try {
    await riskyOperation();
  } catch (error) {
    throw error; // Job will be retried
  }
});
```

## Advanced Features

### Priority Queues

Organize jobs by priority and queue:

```typescript
// High priority
await client.enqueue('UrgentTask', [data], { priority: 1 });

// Critical queue
await client.enqueue('Payment', [data], {
  priority: 1,
  queue: 'critical'
});

// Background queue
await client.enqueue('Analytics', [data], {
  priority: 500,
  queue: 'background'
});
```

### Scheduled Jobs

Schedule jobs for future execution:

```typescript
// Run in 1 hour
const runAt = new Date(Date.now() + 3600000);
await client.enqueue('SendReminder', [data], { runAt });

// Daily at 9 AM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0);
await client.enqueue('DailyReport', [data], { runAt: tomorrow });
```

### Routines

Routines are recurring jobs that fire on a cron schedule. They are stored in PostgreSQL — no external cron daemon or `setInterval` needed beyond a single polling call.

#### Setup

```bash
psql -U postgres -d myapp -f migrations/que_routines.sql
```

#### Defining routines

Use the `Schedule` helpers to build common patterns, or pass any standard 5-field cron expression:

```typescript
import { Client, Schedule } from 'worker-que';

const client = new Client({ /* config */ });

// Every day at 09:00 America/New_York
await client.createRoutine({
  name: 'daily-report',           // unique name → idempotent (safe to call on every deploy)
  jobClass: 'SendDailyReport',
  args: [{ format: 'pdf' }],
  timeZone: 'America/New_York',
  cronExpression: Schedule.daily('09:00'),
});

// Every Monday at 08:00 UTC
await client.createRoutine({
  name: 'weekly-digest',
  jobClass: 'SendWeeklyDigest',
  args: [],
  timeZone: 'UTC',
  cronExpression: Schedule.weekly(1, '08:00'),   // 1 = Monday
});

// 1st of every month at midnight
await client.createRoutine({
  name: 'monthly-billing',
  jobClass: 'RunMonthlyBilling',
  args: [],
  timeZone: 'UTC',
  cronExpression: Schedule.monthly(1, '00:00'),
});

// Quarterly (Jan/Apr/Jul/Oct 1st)
await client.createRoutine({
  name: 'quarterly-review',
  jobClass: 'RunQuarterlyReview',
  args: [],
  timeZone: 'Europe/London',
  cronExpression: Schedule.quarterly('09:00'),
});

// Annually — January 1st at midnight
await client.createRoutine({
  name: 'annual-audit',
  jobClass: 'RunAnnualAudit',
  args: [],
  timeZone: 'UTC',
  cronExpression: Schedule.yearly(1, 1, '00:00'),
});

// Raw cron — every 30 min, 9–5, weekdays
await client.createRoutine({
  name: 'business-hours-sync',
  jobClass: 'SyncData',
  args: [],
  timeZone: 'UTC',
  cronExpression: '*/30 9-17 * * 1-5',
});
```

#### Schedule helpers

| Helper | Example | Cron produced |
|---|---|---|
| `Schedule.daily(time)` | `Schedule.daily('09:00')` | `0 9 * * *` |
| `Schedule.weekly(dow, time)` | `Schedule.weekly(1, '09:00')` | `0 9 * * 1` |
| `Schedule.monthly(day, time)` | `Schedule.monthly(1, '09:00')` | `0 9 1 * *` |
| `Schedule.quarterly(time)` | `Schedule.quarterly('09:00')` | `0 9 1 1,4,7,10 *` |
| `Schedule.yearly(month, day, time)` | `Schedule.yearly(1, 1, '00:00')` | `0 0 1 1 *` |

`dow` is 0 (Sunday) – 6 (Saturday). All `time` values are 24-hour `HH:mm`.

#### Firing due routines

Routines don't fire on their own — you drive them from a scheduler loop. Call `runDueRoutines()` at a regular cadence (every minute is typical):

```typescript
// Using setInterval
setInterval(async () => {
  const result = await client.runDueRoutines();
  // result = { enqueuedJobIds: [...], processedRoutineIds: [...] }
}, 60_000);

// Or from an existing cron job / external scheduler
// The call is concurrency-safe (uses FOR UPDATE SKIP LOCKED)
```

Each call enqueues one job per due routine and advances `nextRunAt` to the next slot. Multiple processes can call `runDueRoutines()` simultaneously without double-firing.

#### Idempotency

Named routines are **idempotent**: calling `createRoutine` with the same `name` a second time updates the existing routine rather than creating a duplicate. This makes it safe to register all routines on every application startup:

```typescript
// Safe to run on every deploy
async function registerRoutines(client: Client) {
  await client.createRoutine({
    name: 'daily-report',
    jobClass: 'SendDailyReport',
    cronExpression: Schedule.daily('09:00'),
    timeZone: 'UTC',
    args: [],
  });
  // ...more routines
}
```

Routines without a `name` (or with an empty name) are not deduplicated.

#### Managing routines

```typescript
// List all routines
const routines = await client.listRoutines();
const active   = await client.listRoutines({ enabled: true });

// Pause / resume
await client.setRoutineEnabled(routineId, false);   // pause
await client.setRoutineEnabled(routineId, true);    // resume (recalculates nextRunAt)

// Update schedule
await client.updateRoutine(routineId, {
  cronExpression: Schedule.weekly(5, '17:00'),      // change to Friday 5 PM
  timeZone: 'America/Los_Angeles',
});

// Delete
await client.deleteRoutine(routineId);
```

#### Routine object

```typescript
{
  id: number;
  name: string;
  jobClass: string;
  args: JSONArray;
  priority: number;
  queue: string;
  timeZone: string;
  cronExpression: string;
  enabled: boolean;
  nextRunAt: Date;
  totalRuns: number;      // incremented each time a job is enqueued
  createdAt: Date;
}
```

#### Existing database migrations

If you are upgrading from a previous version of worker-que, run the numbered migration files in order:

```bash
psql -U postgres -d myapp -f migrations/que_routines_v2_cron.sql       # daily_times → cron_expr
psql -U postgres -d myapp -f migrations/que_routines_v3_idempotent.sql  # unique name index
psql -U postgres -d myapp -f migrations/que_routines_v4_stats.sql       # total_runs counter
```

### Transaction Support

Enqueue jobs within database transactions:

```typescript
import { Pool } from 'pg';

const pool = new Pool({ /* config */ });
const client = new Client({ /* config */ });

const pgClient = await pool.connect();
try {
  await pgClient.query('BEGIN');
  
  // Database operations
  await pgClient.query('INSERT INTO orders ...');
  
  // Enqueue job in same transaction
  await client.enqueueInTx(pgClient, 'SendOrderEmail', [orderId]);
  
  await pgClient.query('COMMIT');
} catch (error) {
  await pgClient.query('ROLLBACK');
  throw error;
} finally {
  pgClient.release();
}
```

### Multiple Workers

Run specialized workers for different queues:

```typescript
// Critical queue worker (fast polling)
const criticalWorker = new Worker(dbConfig, {
  queue: 'critical',
  interval: 100
});

// Background queue worker (slow polling)
const backgroundWorker = new Worker(dbConfig, {
  queue: 'background',
  interval: 5000
});

criticalWorker.work();
backgroundWorker.work();
```

### SSL/TLS Support

Secure database connections with client certificates:

```typescript
import * as fs from 'fs';

const client = new Client({
  host: 'db.example.com',
  ssl: {
    rejectUnauthorized: true,
    cert: fs.readFileSync('./certs/client-cert.pem'),
    key: fs.readFileSync('./certs/client-key.pem'),
    ca: fs.readFileSync('./certs/ca-cert.pem')
  }
});
```

[**→ Complete SSL Documentation**](./SSL.md)

## API Reference

### Client

#### `new Client(config: ClientConfig)`

Creates a new client instance.

**Config Options:**
```typescript
{
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | SSLConfig;
  maxConnections?: number;
}
```

#### `client.enqueue(jobClass, args?, options?): Promise<Job>`

Enqueues a new job.

**Parameters:**
- `jobClass` - Job type identifier
- `args` - Job arguments (JSON array)
- `options` - Priority, queue, runAt

**Returns:** Job instance with ID and metadata

#### `client.enqueueInTx(pgClient, jobClass, args?, options?): Promise<Job>`

Enqueues a job within a transaction.

#### `client.lockJob(queue?): Promise<Job | null>`

Locks and returns the next available job.

#### `client.close(): Promise<void>`

Closes all database connections.

### Worker

#### `new Worker(config: ClientConfig, options?: WorkerOptions)`

Creates a new worker instance.

**Worker Options:**
```typescript
{
  queue?: string;        // Queue to process (default: '')
  interval?: number;     // Poll interval in ms (default: 60000)
  maxAttempts?: number;  // Max retry attempts (default: 5)
}
```

#### `worker.register(jobClass, handler): void`

Registers a job handler function.

#### `worker.work(): Promise<void>`

Starts continuous job processing.

#### `worker.workOne(): Promise<boolean>`

Processes a single job. Returns true if job was processed.

#### `worker.shutdown(): Promise<void>`

Gracefully shuts down the worker.

### Job

Job instances have these properties:

```typescript
{
  id: number;
  queue: string;
  priority: number;
  runAt: Date;
  jobClass: string;
  args: any[];
  errorCount: number;
  lastError?: string;
}
```

And these methods:

- `job.done()` - Mark as completed
- `job.error(message)` - Mark as failed
- `job.delete()` - Remove from queue

### Routines API

#### `client.createRoutine(input): Promise<Routine>`

Creates or updates (upserts) a routine. Named routines are idempotent.

```typescript
{
  name?: string;           // unique key for upsert; omit for anonymous routines
  jobClass: string;
  args?: JSONArray;
  priority?: number;       // default 100
  queue?: string;          // default ''
  timeZone: string;        // IANA zone, e.g. 'UTC', 'America/New_York'
  cronExpression: string;  // 5-field cron or Schedule helper
}
```

#### `client.runDueRoutines(limit?): Promise<RunDueRoutinesResult>`

Enqueues one job per due routine and advances each routine's `nextRunAt`. Call this on a regular interval (e.g. every minute). Concurrency-safe.

#### `client.listRoutines(filter?): Promise<Routine[]>`

Returns all routines, optionally filtered by `{ enabled: true | false }`.

#### `client.getRoutine(id): Promise<Routine | null>`

Returns a single routine by ID.

#### `client.updateRoutine(id, patch): Promise<Routine | null>`

Partially updates a routine. Recalculates `nextRunAt` only if `cronExpression` or `timeZone` changes.

#### `client.setRoutineEnabled(id, enabled): Promise<Routine | null>`

Pauses or resumes a routine. Resuming recalculates `nextRunAt` from now.

#### `client.deleteRoutine(id): Promise<boolean>`

Permanently removes a routine.

## Performance Tips

### Database Indexes

Add indexes for optimal performance:

```sql
CREATE INDEX idx_que_jobs_run_at ON que_jobs(run_at);
CREATE INDEX idx_que_jobs_error_count ON que_jobs(error_count);
CREATE INDEX idx_que_jobs_queue ON que_jobs(queue);
CREATE INDEX idx_que_jobs_job_class ON que_jobs(job_class);
```

### Connection Pooling

Configure appropriate pool sizes:

```typescript
const client = new Client({
  maxConnections: 20  // Adjust based on load
});
```

### Worker Tuning

Balance polling frequency with load:

```typescript
// High-frequency (for critical jobs)
new Worker(config, { interval: 100 });

// Low-frequency (for background jobs)
new Worker(config, { interval: 30000 });
```

## Cross-Language Compatibility

worker-que is fully compatible with:
- [**Que (Ruby)**](https://github.com/chanks/que) - Original implementation
- [**que-go**](https://github.com/bgentry/que-go) - Go implementation

Jobs can be enqueued in one language and processed in another.

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Environment Variables

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secret

# SSL
DB_SSL_ENABLED=true
DB_SSL_CERT=/path/to/client-cert.pem
DB_SSL_KEY=/path/to/client-key.pem
DB_SSL_CA=/path/to/ca-cert.pem

# Worker
WORKER_QUEUE=default
WORKER_INTERVAL=5000
WORKER_MAX_ATTEMPTS=5

# Dashboard
DASHBOARD_ENABLED=true
DASHBOARD_PORT=3000
DASHBOARD_AUTH_ENABLED=true
```

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await worker.shutdown();
  await client.close();
  process.exit(0);
});
```

## Documentation

- [**Dashboard Guide**](./DASHBOARD.md) - Web UI setup and usage
- [**SSL Configuration**](./SSL.md) - Secure connections
- [**Docker Setup**](./DOCKER.md) - Container deployment
- [**Contributing**](./CONTRIBUTING.md) - Development guide

## Examples

Complete examples are available in the [`examples/`](./examples) directory:

- `basic-usage.ts` - Simple job queue
- `ssl-connection.ts` - SSL configurations
- `dashboard-server.ts` - Complete server with dashboard

## Support

- 📖 [Documentation](https://github.com/your-username/worker-que#readme)
- 🐛 [Issue Tracker](https://github.com/your-username/worker-que/issues)
- 💬 [Discussions](https://github.com/your-username/worker-que/discussions)

## License

[MIT](./LICENSE) © 2026

## Acknowledgments

worker-que is inspired by and compatible with:
- [Que](https://github.com/chanks/que) by Chris Hanks
- [que-go](https://github.com/bgentry/que-go) by Blake Gentry

---

**Built with ❤️ using TypeScript and PostgreSQL**
