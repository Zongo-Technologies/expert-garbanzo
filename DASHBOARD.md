# Dashboard Documentation

A beautiful, real-time web dashboard for monitoring and managing your Que job queue.

## Features

- 📊 **Real-time Statistics** - Monitor total, ready, scheduled, and failed jobs
- 📈 **Visual Analytics** - Charts showing job distribution by queue and class
- 🔍 **Advanced Filtering** - Filter jobs by status, queue, and job class
- 🔄 **Job Management** - Retry failed jobs or delete jobs directly from the UI
- 🎨 **Modern UI** - Beautiful, responsive design that works on all devices
- 🔐 **Authentication** - Built-in support for custom authentication
- ⚡ **Auto-refresh** - Configurable real-time updates

## Quick Start

### Installation

The dashboard requires Express.js:

```bash
npm install express
npm install --save-dev @types/express  # If using TypeScript
```

### Basic Setup

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from 'que-ts/dashboard';

const app = express();
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
});

// Mount dashboard at /admin/queue
app.use('/admin/queue', createDashboard(pool));

app.listen(3000, () => {
  console.log('Dashboard: http://localhost:3000/admin/queue');
});
```

That's it! Visit http://localhost:3000/admin/queue to see your dashboard.

## Configuration Options

### DashboardOptions

```typescript
interface DashboardOptions {
  // Dashboard title (shown in header)
  title?: string;                    // Default: 'Que Dashboard'
  
  // Base path for API routes
  basePath?: string;                 // Default: '/que'
  
  // Auto-refresh interval in milliseconds
  refreshInterval?: number;          // Default: 5000 (5 seconds)
  
  // Maximum number of recent failures to show
  maxRecentFailures?: number;        // Default: 50
  
  // Authentication function
  auth?: (req, res, next) => boolean | Promise<boolean>;
}
```

### Examples

#### Custom Title and Refresh Rate

```typescript
app.use('/queue', createDashboard(pool, {
  title: 'Production Job Queue',
  refreshInterval: 2000,  // Refresh every 2 seconds
}));
```

#### With Different Base Path

```typescript
app.use('/jobs', createDashboard(pool, {
  basePath: '/jobs',  // Important: must match mount path
}));
```

## Authentication

### Basic Authentication

```typescript
app.use('/admin/queue', createDashboard(pool, {
  auth: (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    return apiKey === 'your-secret-api-key';
  }
}));
```

### Session-based Authentication

```typescript
import session from 'express-session';

app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false,
}));

app.use('/admin/queue', createDashboard(pool, {
  auth: (req, res, next) => {
    // Only allow authenticated admins
    return req.session?.user?.role === 'admin';
  }
}));
```

### Async Authentication (Database Check)

```typescript
app.use('/admin/queue', createDashboard(pool, {
  auth: async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) return false;
    
    try {
      const user = await verifyToken(token);
      return user.hasPermission('view-queue');
    } catch {
      return false;
    }
  }
}));
```

### JWT Authentication

```typescript
import jwt from 'jsonwebtoken';

app.use('/admin/queue', createDashboard(pool, {
  auth: (req, res, next) => {
    try {
      const token = req.cookies.auth_token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.role === 'admin';
    } catch {
      return false;
    }
  }
}));
```

## API Routes

The dashboard exposes several API routes that you can use programmatically:

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

Get paginated list of jobs with optional filters.

**Query Parameters:**
- `status`: Filter by status (`all`, `ready`, `scheduled`, `failed`)
- `queue`: Filter by queue name
- `jobClass`: Filter by job class
- `limit`: Number of results per page (default: 50)
- `offset`: Pagination offset (default: 0)

**Example:**
```
GET /api/jobs?status=failed&queue=critical&limit=20&offset=0
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
      "args": [{ "amount": 100, "userId": 456 }],
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
["SendEmail", "ProcessPayment", "GenerateReport", "SendReminder"]
```

## Programmatic Usage

You can also use the dashboard service directly in your code:

```typescript
import { Pool } from 'pg';
import { DashboardService } from 'que-ts/dashboard';

const pool = new Pool({ /* config */ });
const dashboard = new DashboardService(pool);

// Get statistics
const stats = await dashboard.getStats();
console.log(`Total jobs: ${stats.total}`);
console.log(`Failed jobs: ${stats.failed}`);

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

## Integration Examples

### With Existing Express App

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from 'que-ts/dashboard';

const app = express();
const pool = new Pool({ /* config */ });

// Your existing routes
app.get('/', (req, res) => {
  res.send('Home page');
});

app.get('/api/users', (req, res) => {
  // Your API
});

// Add dashboard
app.use('/admin/queue', createDashboard(pool, {
  title: 'My App Queue',
  auth: (req) => req.session?.isAdmin,
}));

app.listen(3000);
```

### With Multiple Workers

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from 'que-ts/dashboard';
import { Worker } from 'que-ts';

const app = express();
const pool = new Pool({ /* config */ });

// Create dashboard
app.use('/queue', createDashboard(pool));

// Start multiple workers
const criticalWorker = new Worker(
  { /* db config */ },
  { queue: 'critical', interval: 100 }
);

const backgroundWorker = new Worker(
  { /* db config */ },
  { queue: 'background', interval: 5000 }
);

// Register handlers and start workers
criticalWorker.register('ProcessPayment', handlePayment);
backgroundWorker.register('GenerateReport', handleReport);

criticalWorker.work();
backgroundWorker.work();

app.listen(3000);
```

### Behind a Proxy (nginx, etc.)

If running behind a proxy, make sure to set the correct `basePath`:

```typescript
// nginx config:
// location /app/queue {
//   proxy_pass http://localhost:3000/queue;
// }

app.use('/queue', createDashboard(pool, {
  basePath: '/queue',  // Not /app/queue - that's handled by nginx
}));
```

## Deployment Considerations

### Production Checklist

- [ ] **Enable Authentication** - Never deploy without auth in production
- [ ] **Use HTTPS** - Protect sensitive job data
- [ ] **Restrict Access** - Use firewall rules or network policies
- [ ] **Monitor Performance** - Dashboard queries can impact database
- [ ] **Set Reasonable Refresh Interval** - Don't overwhelm your database
- [ ] **Use Connection Pooling** - Reuse database connections
- [ ] **Enable Logging** - Track dashboard access and actions

### Environment Variables

```typescript
import { createDashboard } from 'que-ts/dashboard';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
});

app.use(process.env.DASHBOARD_PATH || '/admin/queue', 
  createDashboard(pool, {
    title: process.env.APP_NAME || 'Queue Dashboard',
    refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_MS || '5000'),
    auth: (req) => {
      const apiKey = req.headers['x-api-key'];
      return apiKey === process.env.DASHBOARD_API_KEY;
    },
  })
);
```

### Docker Example

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV DASHBOARD_PATH=/queue
ENV DASHBOARD_REFRESH_MS=5000

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

## Troubleshooting

### Dashboard shows "Failed to load jobs"

**Check:**
1. Database connection is working
2. `que_jobs` table exists
3. User has SELECT permissions on `que_jobs`

### Authentication not working

**Check:**
1. Auth function returns `true` or `false` (not undefined)
2. For async auth, ensure function is declared `async`
3. Check browser console for 403 errors

### Slow dashboard performance

**Solutions:**
1. Increase `refreshInterval` to reduce polling frequency
2. Add database indexes:
   ```sql
   CREATE INDEX idx_que_jobs_run_at ON que_jobs(run_at);
   CREATE INDEX idx_que_jobs_error_count ON que_jobs(error_count);
   CREATE INDEX idx_que_jobs_queue ON que_jobs(queue);
   CREATE INDEX idx_que_jobs_job_class ON que_jobs(job_class);
   ```
3. Reduce `maxRecentFailures` option
4. Use database connection pooling

### Dashboard not refreshing

**Check:**
1. JavaScript is enabled in browser
2. No console errors in browser dev tools
3. API endpoints are accessible (check network tab)
4. CORS is configured if dashboard is on different domain

## Screenshots

### Main Dashboard
![Dashboard Overview](docs/images/dashboard-overview.png)

Shows:
- Real-time job statistics
- Ready, scheduled, and failed job counts
- Visual charts for queue and class distribution

### Jobs List
![Jobs List](docs/images/jobs-list.png)

Features:
- Filter by status, queue, and job class
- Pagination for large job lists
- Quick actions to retry or delete jobs

### Recent Failures
![Recent Failures](docs/images/failures.png)

Displays:
- Jobs that have failed
- Error messages
- Retry and delete actions

## Customization

### Custom Styles

The dashboard uses inline styles for portability. To customize:

1. Create your own view template:
   ```typescript
   import { getDashboardHTML } from 'que-ts/dashboard/views';
   
   // Extend or modify the HTML
   const customHTML = getDashboardHTML(options)
     .replace('background: #667eea', 'background: #your-color');
   ```

2. Or mount your own routes:
   ```typescript
   import { DashboardService } from 'que-ts/dashboard';
   
   const service = new DashboardService(pool);
   
   app.get('/custom-dashboard', (req, res) => {
     // Your custom HTML using service.getStats()
   });
   ```

## Support

- 📖 Full API documentation: [API.md](../API.md)
- 🐛 Report issues: [GitHub Issues](https://github.com/Duke-Engineering/que-ts/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Duke-Engineering/que-ts/discussions)

## License

MIT
