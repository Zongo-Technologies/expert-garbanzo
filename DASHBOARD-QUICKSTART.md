# Dashboard Quick Start Guide

Get your Que dashboard up and running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- PostgreSQL database with `que_jobs` table
- Express.js installed

## Step 1: Install Dependencies

```bash
npm install que-ts express
npm install --save-dev @types/express  # If using TypeScript
```

## Step 2: Create Dashboard Server

Create a file `dashboard.js` (or `dashboard.ts`):

```javascript
const express = require('express');
const { Pool } = require('pg');
const { createDashboard } = require('que-ts/dashboard');

const app = express();
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
});

// Mount dashboard
app.use('/queue', createDashboard(pool, {
  title: 'My Queue Dashboard',
  refreshInterval: 3000, // Refresh every 3 seconds
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}/queue`);
});
```

## Step 3: Run the Server

```bash
node dashboard.js
```

## Step 4: Open in Browser

Visit http://localhost:3000/queue

You should see:
- 📊 Real-time job statistics
- 📈 Charts showing distribution by queue and class
- 📋 Paginated job list with filters
- ⚠️ Recent failures section

## Step 5: Add Authentication (Production)

For production, always add authentication:

```javascript
app.use('/queue', createDashboard(pool, {
  title: 'Production Queue',
  auth: (req, res, next) => {
    // Check API key
    const apiKey = req.headers['x-api-key'];
    if (apiKey === process.env.DASHBOARD_API_KEY) {
      return true;
    }
    
    // Or check session
    if (req.session?.user?.isAdmin) {
      return true;
    }
    
    return false; // Deny access
  }
}));
```

## TypeScript Version

If using TypeScript:

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from 'que-ts/dashboard';

const app = express();
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
});

app.use('/queue', createDashboard(pool, {
  title: 'My Queue Dashboard',
  refreshInterval: 3000,
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard: http://localhost:${PORT}/queue`);
});
```

## Complete Example with Worker

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from 'que-ts/dashboard';
import { Client, Worker } from 'que-ts';

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
};

// Create Express app
const app = express();
const pool = new Pool(dbConfig);

// Add dashboard
app.use('/admin/queue', createDashboard(pool, {
  title: 'My App Queue',
  refreshInterval: 2000,
}));

// Create worker
const worker = new Worker(dbConfig, { interval: 1000 });

worker.register('SendEmail', async (job) => {
  const [emailData] = job.args;
  console.log(`Sending email to ${emailData.to}`);
  // Your email logic here
});

worker.register('ProcessPayment', async (job) => {
  const [paymentData] = job.args;
  console.log(`Processing payment: $${paymentData.amount}`);
  // Your payment logic here
});

// Start server and worker
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/admin/queue`);
  
  // Start worker
  worker.work().catch(console.error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await worker.shutdown();
  await pool.end();
  process.exit(0);
});
```

## Troubleshooting

### "Cannot find module 'que-ts/dashboard'"

Make sure you're importing from the compiled distribution:

```javascript
// CommonJS
const { createDashboard } = require('que-ts/dist/dashboard');

// ES6
import { createDashboard } from 'que-ts/dist/dashboard';
```

Or update your package.json exports (for library authors).

### Dashboard shows no data

1. Check that `que_jobs` table exists
2. Verify database connection is working
3. Check browser console for errors
4. Verify API routes are accessible (try `/queue/api/stats`)

### Authentication not working

1. Make sure auth function returns boolean (true/false)
2. For async auth, declare function as `async`
3. Check browser console for 403 errors

## Next Steps

- Read the full [DASHBOARD.md](DASHBOARD.md) documentation
- Explore API routes for programmatic access
- Add custom authentication
- Configure for production deployment

## Environment Variables

For production, use environment variables:

```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secret
DASHBOARD_PATH=/admin/queue
DASHBOARD_TITLE=Production Queue
DASHBOARD_REFRESH_MS=5000
DASHBOARD_API_KEY=your-secret-key
```

```javascript
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.use(process.env.DASHBOARD_PATH, createDashboard(pool, {
  title: process.env.DASHBOARD_TITLE,
  refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_MS),
  auth: (req) => req.headers['x-api-key'] === process.env.DASHBOARD_API_KEY
}));
```

## Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dashboard.js"]
```

```bash
docker build -t my-queue-dashboard .
docker run -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_NAME=myapp \
  -e DB_USER=postgres \
  -e DB_PASSWORD=secret \
  my-queue-dashboard
```

---

**Need Help?** Check the full documentation at [DASHBOARD.md](DASHBOARD.md)
