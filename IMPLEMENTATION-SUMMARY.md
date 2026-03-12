# Que-TS Complete Implementation Summary

## Overview

This document provides a complete overview of the que-ts job queue library implementation, including all features, components, and usage patterns.

## Core Components

### 1. Client (`src/client.ts`)
The client is responsible for enqueueing jobs and locking jobs for processing.

**Key Features:**
- Enqueue jobs with priority, scheduling, and queue assignment
- Lock jobs for processing with PostgreSQL advisory locks
- Transaction support for enqueueing jobs within existing transactions
- Connection pooling for efficient database usage

**Methods:**
- `enqueue(jobClass, args, options)` - Add a job to the queue
- `enqueueInTx(client, jobClass, args, options)` - Add job within transaction
- `lockJob(queue)` - Lock and retrieve next available job
- `close()` - Close all database connections

### 2. Worker (`src/worker.ts`)
The worker polls for jobs and executes registered work functions.

**Key Features:**
- Register work functions for different job classes
- Automatic job polling with configurable intervals
- Queue-specific workers
- Graceful shutdown handling
- Exponential backoff for failed jobs

**Methods:**
- `register(jobClass, workFunc)` - Register a job handler
- `work()` - Start continuous job processing
- `workOne()` - Process a single job
- `shutdown()` - Stop processing and cleanup

### 3. Job (`src/job.ts`)
Job instances represent individual jobs in the queue.

**Properties:**
- `id` - Unique job identifier
- `jobClass` - Job type/class name
- `args` - Job arguments (JSON array)
- `queue` - Queue name
- `priority` - Job priority (lower = higher priority)
- `runAt` - Scheduled execution time
- `errorCount` - Number of failed attempts
- `lastError` - Last error message

**Methods:**
- `done()` - Mark job as completed (deletes from queue)
- `error(message)` - Mark job as failed (schedules retry)
- `delete()` - Remove job from queue

## Advanced Features

### SSL/TLS Support (`src/types.ts`)

Full SSL support with client certificates for secure PostgreSQL connections.

**Configuration Options:**
```typescript
interface SSLConfig {
  rejectUnauthorized?: boolean;
  cert?: string | Buffer;
  key?: string | Buffer;
  ca?: string | Buffer | Array<string | Buffer>;
  passphrase?: string;
}
```

**Supported Scenarios:**
- Basic SSL (encryption only)
- Client certificate authentication
- CA verification
- Multiple certificate authorities
- Encrypted private keys
- Cloud providers (AWS RDS, Google Cloud SQL, Azure, Heroku)

**Documentation:**
- `SSL.md` - Complete SSL configuration guide
- `SSL-QUICK-REFERENCE.md` - Quick reference card
- `examples/ssl-connection.ts` - Working examples

### Web Dashboard (`src/dashboard/`)

Real-time web dashboard for monitoring and managing the job queue.

**Components:**
- `dashboard/service.ts` - Core dashboard business logic
- `dashboard/index.ts` - Express middleware and API routes
- `dashboard/views.ts` - HTML dashboard UI

**Features:**
- Real-time statistics (total, ready, scheduled, failed jobs)
- Visual analytics (distribution by queue and class)
- Job browsing with filtering and pagination
- Job management (retry, delete)
- Recent failures tracking
- Auto-refresh with configurable intervals
- Built-in authentication support
- Responsive, modern UI

**API Endpoints:**
- `GET /api/stats` - Queue statistics
- `GET /api/jobs` - Paginated job list with filters
- `GET /api/jobs/:id` - Single job details
- `DELETE /api/jobs/:id` - Delete a job
- `POST /api/jobs/:id/retry` - Retry a failed job
- `GET /api/queues` - Available queues
- `GET /api/job-classes` - Available job classes

**Documentation:**
- `DASHBOARD.md` - Complete dashboard documentation
- `DASHBOARD-QUICKSTART.md` - Quick start guide
- `examples/dashboard-server.ts` - Full working example

## Database Schema

### Table: `que_jobs`

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

**Key Characteristics:**
- Composite primary key ensures job ordering
- Advisory locks prevent duplicate processing
- JSON args for flexible job data
- Error tracking for retry logic
- Queue support for job organization

## Configuration

### ClientConfig

```typescript
interface ClientConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | SSLConfig;
  maxConnections?: number;
}
```

### WorkerOptions

```typescript
interface WorkerOptions {
  queue?: string;        // Queue to process (default: '')
  interval?: number;     // Poll interval in ms (default: 60000)
  maxAttempts?: number;  // Max retry attempts (default: 5)
}
```

### EnqueueOptions

```typescript
interface EnqueueOptions {
  priority?: number;  // Job priority (default: 100)
  runAt?: Date;       // Schedule time (default: now)
  queue?: string;     // Queue name (default: '')
}
```

### DashboardOptions

```typescript
interface DashboardOptions {
  title?: string;                    // Dashboard title
  basePath?: string;                 // API base path
  refreshInterval?: number;          // Refresh interval (ms)
  maxRecentFailures?: number;        // Max failures to show
  auth?: (req, res, next) => boolean | Promise<boolean>;
}
```

## Usage Patterns

### Basic Job Queue

```typescript
import { Client, Worker } from 'que-ts';

const config = {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
};

// Enqueue jobs
const client = new Client(config);
await client.enqueue('SendEmail', ['user@example.com']);

// Process jobs
const worker = new Worker(config);
worker.register('SendEmail', async (job) => {
  const [email] = job.args;
  await sendEmail(email);
});
await worker.work();
```

### Priority Queues

```typescript
// High priority
await client.enqueue('UrgentTask', [data], { priority: 1 });

// Low priority
await client.enqueue('BackgroundTask', [data], { priority: 500 });

// Critical queue
await client.enqueue('Payment', [data], {
  priority: 1,
  queue: 'critical',
});
```

### Scheduled Jobs

```typescript
// Run in 1 hour
const runAt = new Date(Date.now() + 3600000);
await client.enqueue('SendReminder', [data], { runAt });

// Daily job
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0);
await client.enqueue('DailyReport', [data], { runAt: tomorrow });
```

### Transaction Support

```typescript
import { Pool } from 'pg';

const pool = new Pool(config);
const client = new Client(config);

const pgClient = await pool.connect();
try {
  await pgClient.query('BEGIN');
  
  // Database operations
  await pgClient.query('INSERT INTO users ...');
  
  // Enqueue job in same transaction
  await client.enqueueInTx(pgClient, 'WelcomeEmail', [userId]);
  
  await pgClient.query('COMMIT');
} catch (error) {
  await pgClient.query('ROLLBACK');
  throw error;
} finally {
  pgClient.release();
}
```

### Error Handling

```typescript
worker.register('ProcessPayment', async (job) => {
  try {
    const [paymentData] = job.args;
    await processPayment(paymentData);
    // Job automatically marked as done
  } catch (error) {
    // Job will be retried with exponential backoff
    throw error;
  }
});
```

### Multiple Workers

```typescript
// Critical queue worker
const criticalWorker = new Worker(config, {
  queue: 'critical',
  interval: 100, // Check every 100ms
});

// Background queue worker
const backgroundWorker = new Worker(config, {
  queue: 'background',
  interval: 5000, // Check every 5 seconds
});

criticalWorker.work();
backgroundWorker.work();
```

### SSL Connection

```typescript
import * as fs from 'fs';

const client = new Client({
  host: 'db.example.com',
  port: 5432,
  database: 'mydb',
  user: 'myuser',
  password: 'mypass',
  ssl: {
    rejectUnauthorized: true,
    cert: fs.readFileSync('./certs/client-cert.pem'),
    key: fs.readFileSync('./certs/client-key.pem'),
    ca: fs.readFileSync('./certs/ca-cert.pem'),
  }
});
```

### Dashboard Integration

```typescript
import express from 'express';
import { createDashboard } from 'que-ts/dashboard';

const app = express();
const pool = new Pool(config);

app.use('/admin/queue', createDashboard(pool, {
  title: 'Production Queue',
  refreshInterval: 3000,
  auth: (req) => req.session?.user?.isAdmin,
}));

app.listen(3000);
```

## Testing

### Test Configuration

Tests use Jest with a dedicated PostgreSQL container.

**Configuration:**
- Database: `que_test` on port 5433
- User: `que_user` / `que_password`
- Docker Compose for database setup
- Isolated test execution with `maxWorkers: 1`

**Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
npm run test:docker   # Full cycle with Docker
```

**Test Files:**
- `tests/client.test.ts` - Client functionality
- `tests/worker.test.ts` - Worker functionality
- `tests/utils.test.ts` - Utility functions
- `tests/impl/test_client.test.ts` - Integration test

## Performance Considerations

### Database Indexes

For optimal performance, add these indexes:

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
  ...config,
  maxConnections: 20, // Adjust based on load
});
```

### Worker Tuning

```typescript
// High-frequency processing
const worker = new Worker(config, {
  interval: 100, // Poll every 100ms
});

// Low-frequency background
const worker = new Worker(config, {
  interval: 30000, // Poll every 30 seconds
});
```

## Cross-Language Compatibility

que-ts is fully compatible with:
- **Ruby Que** - Original implementation
- **que-go** - Go implementation

Jobs can be enqueued in one language and processed in another.

## Deployment

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secret

# SSL
DB_SSL_CERT=/path/to/client-cert.pem
DB_SSL_KEY=/path/to/client-key.pem
DB_SSL_CA=/path/to/ca-cert.pem

# Dashboard
DASHBOARD_PATH=/admin/queue
DASHBOARD_TITLE=Production Queue
DASHBOARD_REFRESH_MS=5000
DASHBOARD_API_KEY=secret-key
```

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

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: que-worker
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: worker
        image: myapp/que-worker:latest
        env:
        - name: DB_HOST
          value: postgres
        - name: DB_NAME
          value: myapp
```

## Security Best Practices

1. **Always use SSL in production**
2. **Enable authentication on dashboard**
3. **Use environment variables for credentials**
4. **Restrict network access to dashboard**
5. **Rotate database credentials regularly**
6. **Monitor failed jobs for suspicious activity**
7. **Set appropriate connection pool limits**
8. **Use read-only database users for dashboard**

## Monitoring

### Metrics to Track

- Total jobs in queue
- Ready vs scheduled jobs
- Failed job count and rate
- Average error count
- Job processing time
- Worker idle time
- Database connection pool usage

### Logging

```typescript
worker.register('MyJob', async (job) => {
  console.log(`Processing job ${job.id}: ${job.jobClass}`);
  try {
    await processJob(job);
    console.log(`Completed job ${job.id}`);
  } catch (error) {
    console.error(`Failed job ${job.id}:`, error);
    throw error;
  }
});
```

## Troubleshooting

### Common Issues

**Jobs not processing:**
1. Check worker is running
2. Verify queue names match
3. Check job `run_at` is in the past
4. Verify database connectivity

**High error rate:**
1. Check error messages in dashboard
2. Verify external service availability
3. Review job arguments for validity
4. Check for database deadlocks

**Dashboard slow:**
1. Add database indexes
2. Increase refresh interval
3. Reduce `maxRecentFailures`
4. Use connection pooling

## Documentation Files

- `README.md` - Main project documentation
- `DASHBOARD.md` - Complete dashboard guide
- `DASHBOARD-QUICKSTART.md` - Quick start for dashboard
- `SSL.md` - SSL/TLS configuration guide
- `SSL-QUICK-REFERENCE.md` - SSL quick reference
- `DOCKER.md` - Docker setup guide
- `CONTEXT.md` - Project context and architecture

## Example Files

- `examples/basic-usage.ts` - Basic usage example
- `examples/ssl-connection.ts` - SSL configuration examples
- `examples/dashboard-server.ts` - Complete dashboard server

## Support and Contributing

- GitHub Issues: Report bugs and request features
- GitHub Discussions: Ask questions and share ideas
- Pull Requests: Contribute improvements

## License

MIT License - See LICENSE file for details

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-12  
**Compatibility:** Node.js 16+, PostgreSQL 10+
