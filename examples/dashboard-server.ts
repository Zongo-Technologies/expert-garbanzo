import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from '../src/dashboard';
import { Client, Worker } from '../src';

// Create Express app
const app = express();
const port = 3000;

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'que_test',
  user: 'que_user',
  password: 'que_password',
};

// Create a database pool for the dashboard
const pool = new Pool(dbConfig);

// Create a client for enqueueing jobs
const client = new Client(dbConfig);

// Mount the dashboard at /admin/queue
// With authentication example
app.use('/admin/queue', createDashboard(pool, {
  title: 'My Application Queue Dashboard',
  basePath: '/admin/queue',
  refreshInterval: 3000, // Refresh every 3 seconds
  // Optional: Add authentication
  auth: async (req, res, next) => {
    // Example: Check for API key in header
    const apiKey = req.headers['x-api-key'];
    if (apiKey === 'your-secret-key') {
      return true;
    }
    
    // Example: Check for session authentication
    // if (req.session?.user?.isAdmin) {
    //   return true;
    // }
    
    // For demo purposes, allow all (REMOVE IN PRODUCTION!)
    return true;
  }
}));

// Example API endpoint to enqueue jobs
app.post('/api/enqueue', express.json(), async (req, res) => {
  try {
    const { jobClass, args, priority, queue } = req.body;
    
    const job = await client.enqueue(jobClass, args || [], {
      priority: priority || 100,
      queue: queue || '',
    });
    
    res.json({ success: true, jobId: job.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enqueue job' });
  }
});

// Example: Enqueue some demo jobs
async function enqueueDemoJobs() {
  try {
    // Create various types of jobs for demo
    await client.enqueue('SendEmail', [
      { to: 'user@example.com', subject: 'Welcome!' }
    ], { priority: 10 });

    await client.enqueue('ProcessPayment', [
      { amount: 100, currency: 'USD', userId: 123 }
    ], { priority: 5, queue: 'critical' });

    await client.enqueue('GenerateReport', [
      { reportType: 'monthly', userId: 456 }
    ], { priority: 100, queue: 'background' });

    // Scheduled job (1 hour from now)
    await client.enqueue('SendReminder', [
      { userId: 789, message: 'Your appointment is tomorrow' }
    ], {
      priority: 50,
      runAt: new Date(Date.now() + 3600000),
    });

    console.log('✓ Demo jobs enqueued');
  } catch (error) {
    console.error('Failed to enqueue demo jobs:', error);
  }
}

// Setup worker to process jobs
const worker = new Worker(dbConfig, {
  interval: 1000, // Poll every second
});

// Register job handlers
worker.register('SendEmail', async (job) => {
  const [emailData] = job.args;
  console.log(`Sending email to ${emailData.to}: ${emailData.subject}`);
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate occasional failures for demo
  if (Math.random() < 0.1) {
    throw new Error('SMTP connection failed');
  }
});

worker.register('ProcessPayment', async (job) => {
  const [paymentData] = job.args;
  console.log(`Processing payment: $${paymentData.amount} ${paymentData.currency}`);
  
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate occasional failures for demo
  if (Math.random() < 0.05) {
    throw new Error('Payment gateway timeout');
  }
});

worker.register('GenerateReport', async (job) => {
  const [reportData] = job.args;
  console.log(`Generating ${reportData.reportType} report for user ${reportData.userId}`);
  
  // Simulate report generation
  await new Promise(resolve => setTimeout(resolve, 3000));
});

worker.register('SendReminder', async (job) => {
  const [reminderData] = job.args;
  console.log(`Sending reminder to user ${reminderData.userId}: ${reminderData.message}`);
  
  // Simulate reminder sending
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Start the server
app.listen(port, async () => {
  console.log(`\n🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Dashboard available at http://localhost:${port}/admin/queue\n`);
  
  // Enqueue some demo jobs
  await enqueueDemoJobs();
  
  // Start the worker
  console.log('🔄 Starting worker...\n');
  worker.work().catch(console.error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await worker.shutdown();
  await client.close();
  await pool.end();
  process.exit(0);
});

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
