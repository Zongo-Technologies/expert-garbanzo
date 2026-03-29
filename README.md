# worker-que

> A production-ready TypeScript job queue library for PostgreSQL with real-time monitoring dashboard

[![npm version](https://badge.fury.io/js/worker-que.svg)](https://www.npmjs.com/package/worker-que)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)

## Features

- ⚡ **High Performance** - PostgreSQL-backed with advisory locks for reliable job processing
- 📊 **Real-time Dashboard** - Beautiful web UI for monitoring and managing jobs
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

Create the required table:

```sql
CREATE TABLE que_jobs (
    priority    smallint    NOT NULL DEFAULT 100,
    run_at      timestamptz NOT NULL DEFAULT now(),
    job_id      bigserial   NOT NULL,
    job_class   text        NOT NULL,
    args        json        NOT NULL DEFAULT '[]'::json,
    error_count integer     NOT NULL DEFAULT 0,
    last_error  text,
    queue       text        NOT NULL DEFAULT '',
    PRIMARY KEY (queue, priority, run_at, job_id)
);
```

Or use the included migration:

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
- 📈 Visual analytics by queue and class
- 🔍 Filter and search jobs
- 🔄 Retry failed jobs
- 🗑️ Delete jobs
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
