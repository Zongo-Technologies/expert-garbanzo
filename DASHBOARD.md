# Dashboard Guide

Complete guide for the worker-que web dashboard - a real-time monitoring and management interface for your job queue.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## Quick Start

### Installation

```bash
npm install worker-que express pg
```

### Basic Setup

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from 'worker-que/dist/dashboard';

const app = express();
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
});

// Mount dashboard
app.use('/admin/queue', createDashboard(pool));

app.listen(3000, () => {
  console.log('Dashboard: http://localhost:3000/admin/queue');
});
```

That's it! Visit `http://localhost:3000/admin/queue` to see your dashboard.

## Features

### Real-time Statistics

- **Total Jobs** - All jobs in the queue
- **Ready** - Jobs ready to process
- **Scheduled** - Jobs scheduled for future
- **Failed** - Jobs that have errored

### Visual Analytics

- **Jobs by Queue** - Bar chart showing distribution across queues
- **Jobs by Class** - Bar chart showing distribution by job type

### Job Management

- **Filter** - By status, queue, and job class
- **Search** - Find specific jobs
- **Pagination** - Browse through large job lists
- **Retry** - Restart failed jobs
- **Delete** - Remove jobs from queue

### Recent Failures

View the most recent failed jobs with:
- Error messages
- Error counts
- Quick retry/delete actions

## Configuration

### Dashboard Options

```typescript
interface DashboardOptions {
  title?: string;                              // Dashboard title (default: 'Que Dashboard')
  basePath?: string;                           // Base path for API routes (default: '/que')
  refreshInterval?: number;                    // Auto-refresh interval in ms (default: 5000)
  maxRecentFailures?: number;                  // Max failures to show (default: 50)
  
  // Built-in authentication (email/password)
  auth?: {
    email: string;                             // Login email
    password: string;                          // Login password
  };
  
  // Custom authentication middleware
  customAuth?: (req, res, next) => boolean | Promise<boolean>;
}
```

### Examples

#### Custom Title and Refresh

```typescript
app.use('/queue', createDashboard(pool, {
  title: 'Production Job Queue',
  basePath: '/queue',
  refreshInterval: 2000,  // Refresh every 2 seconds
}));
```

#### Different Mount Path

```typescript
app.use('/jobs', createDashboard(pool, {
  basePath: '/jobs',  // Must match mount path
}));
// Visit http://localhost:3000/jobs
```

## Authentication

The dashboard provides **built-in email/password authentication** and supports custom authentication middleware.

### Built-in Email/Password Authentication (Recommended)

The easiest way to secure your dashboard is with the built-in authentication:

```typescript
app.use('/admin/queue', createDashboard(pool, {
  title: 'My Queue Dashboard',
  basePath: '/admin/queue',
  auth: {
    email: 'admin@example.com',
    password: 'your-secure-password'
  }
}));
```

**Features:**
- Secure login page with Microsoft Fluent Design
- Session management with cookies
- "Remember me" functionality (extends session to 30 days)
- Automatic logout
- User email displayed in dashboard header

**Security Notes:**
- Store credentials in environment variables (never commit passwords)
- Use HTTPS in production
- Use strong, unique passwords
- Consider using bcrypt for password hashing in production

**Environment Variables Example:**

```typescript
app.use('/admin/queue', createDashboard(pool, {
  auth: {
    email: process.env.DASHBOARD_EMAIL!,
    password: process.env.DASHBOARD_PASSWORD!
  }
}));
```

`.env`:
```bash
DASHBOARD_EMAIL=admin@example.com
DASHBOARD_PASSWORD=SecurePassword123!
```

### Custom Authentication

For integration with existing auth systems, use `customAuth`:

#### API Key Authentication

```typescript
app.use('/admin/queue', createDashboard(pool, {
  customAuth: (req) => {
    return req.headers['x-api-key'] === process.env.DASHBOARD_API_KEY;
  }
}));
```

**Usage:**
```bash
curl -H "X-API-Key: your-secret-key" http://localhost:3000/admin/queue/api/stats
```

#### Session-Based Authentication

```typescript
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use('/admin/queue', createDashboard(pool, {
  customAuth: (req) => {
    return req.session?.user?.isAdmin === true;
  }
}));
```

#### JWT Authentication

```typescript
import jwt from 'jsonwebtoken';

app.use('/admin/queue', createDashboard(pool, {
  customAuth: (req) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return false;
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.role === 'admin';
    } catch {
      return false;
    }
  }
}));
```

#### Async Database Authentication

```typescript
app.use('/admin/queue', createDashboard(pool, {
  customAuth: async (req) => {
    const token = req.headers.authorization;
    const user = await verifyUserToken(token);
    return user?.hasPermission('view-queue');
  }
}));
```

### No Authentication (Development Only)

For local development only, you can omit authentication:

```typescript
// ⚠️ WARNING: NOT SECURE - Development only
app.use('/admin/queue', createDashboard(pool, {
  title: 'Dev Queue'
}));
```

## API Reference

The dashboard exposes REST API endpoints for programmatic access.

### GET /api/stats

Get queue statistics.

**Response:**
```json
{
  "total": 156,
  "scheduled": 23,
  "ready": 120,
  "failed": 13,
  "errorRate": 8.33,
  "avgErrorCount": 2.5,
  "oldestJob": "2024-01-15T10:30:00Z",
  "newestJob": "2024-01-15T15:45:00Z",
  "totalByQueue": [
    { "queue": "default", "count": 100 },
    { "queue": "critical", "count": 56 }
  ],
  "totalByClass": [
    { "jobClass": "SendEmail", "count": 80 },
    { "jobClass": "ProcessPayment", "count": 76 }
  ],
  "recentFailures": [...]
}
```

### GET /api/jobs

Get paginated list of jobs with filters.

**Query Parameters:**
- `status` - Filter by status (`all`, `ready`, `scheduled`, `failed`)
- `queue` - Filter by queue name
- `jobClass` - Filter by job class
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Example:**
```
GET /api/jobs?status=failed&queue=critical&limit=20
```

**Response:**
```json
{
  "jobs": [
    {
      "id": 123,
      "queue": "critical",
      "priority": 10,
      "runAt": "2024-01-15T14:30:00Z",
      "jobClass": "ProcessPayment",
      "args": [{ "amount": 100 }],
      "errorCount": 3,
      "lastError": "Payment gateway timeout"
    }
  ],
  "total": 156
}
```

### GET /api/jobs/:id

Get details of a specific job.

**Response:**
```json
{
  "id": 123,
  "queue": "default",
  "priority": 100,
  "runAt": "2024-01-15T14:30:00Z",
  "jobClass": "SendEmail",
  "args": [{ "to": "user@example.com" }],
  "errorCount": 0
}
```

### DELETE /api/jobs/:id

Delete a job from the queue.

**Response:**
```json
{
  "success": true,
  "message": "Job deleted"
}
```

### POST /api/jobs/:id/retry

Retry a failed job (resets error count and schedules immediately).

**Response:**
```json
{
  "success": true,
  "message": "Job queued for retry"
}
```

### GET /api/queues

Get list of all queue names.

**Response:**
```json
["(default)", "critical", "background", "email"]
```

### GET /api/job-classes

Get list of all job class names.

**Response:**
```json
["SendEmail", "ProcessPayment", "GenerateReport"]
```

## Programmatic Usage

You can use the dashboard service directly in your code:

```typescript
import { Pool } from 'pg';
import { DashboardService } from 'worker-que/dist/dashboard';

const pool = new Pool({ /* config */ });
const dashboard = new DashboardService(pool);

// Get statistics
const stats = await dashboard.getStats();
console.log(`Total jobs: ${stats.total}`);

// Get jobs with filters
const { jobs, total } = await dashboard.getJobs({
  status: 'failed',
  queue: 'critical',
  limit: 10,
});

// Retry a failed job
await dashboard.retryJob(123);

// Delete a job
await dashboard.deleteJob(456);

// Get available queues
const queues = await dashboard.getQueues();

// Get job classes
const jobClasses = await dashboard.getJobClasses();
```

## Troubleshooting

### Error: "Cannot GET /que/api/jobs"

**Problem:** Dashboard routes not mounted.

**Solution:** Make sure you mount the dashboard with `app.use()`:

```typescript
import { createDashboard } from 'worker-que/dist/dashboard';

app.use('/que', createDashboard(pool, {
  basePath: '/que',  // Must match mount path
}));
```

### Dashboard Shows No Data

**Problem:** Database table doesn't exist or is empty.

**Solution:** 
1. Create the `que_jobs` table using the schema
2. Check database connection
3. Verify table has jobs: `SELECT COUNT(*) FROM que_jobs;`

### Authentication Not Working

**Problem:** Auth function not returning correct value.

**Solution:**
- Make sure auth function returns `true` or `false`
- For async auth, declare function as `async`
- Check browser console for 403 errors

### Slow Dashboard Performance

**Solutions:**

1. Add database indexes:
```sql
CREATE INDEX idx_que_jobs_run_at ON que_jobs(run_at);
CREATE INDEX idx_que_jobs_error_count ON que_jobs(error_count);
CREATE INDEX idx_que_jobs_queue ON que_jobs(queue);
CREATE INDEX idx_que_jobs_job_class ON que_jobs(job_class);
```

2. Increase refresh interval:
```typescript
createDashboard(pool, { refreshInterval: 10000 })
```

3. Reduce max failures shown:
```typescript
createDashboard(pool, { maxRecentFailures: 25 })
```

## Production Deployment

### Environment Variables

```bash
# Dashboard
DASHBOARD_PATH=/admin/queue
DASHBOARD_TITLE=Production Queue
DASHBOARD_REFRESH_MS=5000
DASHBOARD_API_KEY=your-secret-key

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secret
```

### Secure Configuration

```typescript
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production',
});

app.use(process.env.DASHBOARD_PATH, createDashboard(pool, {
  title: process.env.DASHBOARD_TITLE,
  basePath: process.env.DASHBOARD_PATH,
  refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_MS),
  auth: (req) => {
    return req.headers['x-api-key'] === process.env.DASHBOARD_API_KEY;
  },
}));
```

### Behind a Reverse Proxy

If running behind nginx or similar:

```nginx
# nginx.conf
location /admin/queue {
    proxy_pass http://localhost:3000/admin/queue;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```bash
docker build -t queue-dashboard .
docker run -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_NAME=myapp \
  -e DASHBOARD_API_KEY=secret \
  queue-dashboard
```

### Security Checklist

- [ ] Enable authentication
- [ ] Use HTTPS in production
- [ ] Restrict network access
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Use read-only database user for dashboard
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Complete Example

```typescript
import express from 'express';
import session from 'express-session';
import { Pool } from 'pg';
import { createDashboard } from 'worker-que/dist/dashboard';
import { Client, Worker } from 'worker-que';

const app = express();
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const pool = new Pool(dbConfig);
const client = new Client(dbConfig);
const worker = new Worker(dbConfig);

// Setup session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Register job handlers
worker.register('SendEmail', async (job) => {
  // Email logic
});

// Mount dashboard with auth
app.use('/admin/queue', createDashboard(pool, {
  title: 'Production Queue',
  basePath: '/admin/queue',
  refreshInterval: 3000,
  auth: (req) => req.session?.user?.isAdmin === true,
}));

// Start worker
worker.work();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard: http://localhost:${PORT}/admin/queue`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.shutdown();
  await client.close();
  await pool.end();
  process.exit(0);
});
```

## Support

- 📖 [Main Documentation](./README.md)
- 🔐 [SSL Configuration](./SSL.md)
- 🐛 [Issue Tracker](https://github.com/your-username/worker-que/issues)

---

**Need help?** Open an issue or check the examples directory for more code samples.
