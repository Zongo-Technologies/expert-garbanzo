import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { DashboardService, DashboardOptions } from './service';
import { getDashboardHTML } from './views';

export interface DashboardMiddlewareOptions extends DashboardOptions {
  /**
   * Optional authentication middleware
   * Return true to allow access, false to deny
   */
  auth?: (req: Request, res: Response, next: NextFunction) => boolean | Promise<boolean>;
}

/**
 * Creates an Express router with the Que dashboard
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { Pool } from 'pg';
 * import { createDashboard } from 'que-ts/dashboard';
 * 
 * const app = express();
 * const pool = new Pool({ ... });
 * 
 * app.use('/admin/queue', createDashboard(pool, {
 *   title: 'My App Queue',
 *   auth: (req, res, next) => {
 *     // Add your authentication logic
 *     return req.isAuthenticated();
 *   }
 * }));
 * ```
 */
export function createDashboard(
  pool: Pool,
  options: DashboardMiddlewareOptions = {}
): Router {
  const router = Router();
  const service = new DashboardService(pool, options);
  const authMiddleware = options.auth;

  // Authentication middleware wrapper
  const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (authMiddleware) {
      try {
        const allowed = await authMiddleware(req, res, next);
        if (!allowed) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      } catch (error) {
        res.status(500).json({ error: 'Authentication error' });
        return;
      }
    }
    next();
  };

  // Apply auth to all routes
  router.use(requireAuth);

  // Main dashboard page
  router.get('/', async (req: Request, res: Response) => {
    try {
      const html = getDashboardHTML(service.getOptions());
      res.type('html').send(html);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  });

  // API: Get queue statistics
  router.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const stats = await service.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // API: Get jobs list
  router.get('/api/jobs', async (req: Request, res: Response) => {
    try {
      const {
        queue,
        jobClass,
        status,
        limit,
        offset,
      } = req.query;

      const result = await service.getJobs({
        queue: queue as string | undefined,
        jobClass: jobClass as string | undefined,
        status: status as 'ready' | 'scheduled' | 'failed' | 'all' | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // API: Get single job details
  router.get('/api/jobs/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await service.getJob(jobId);

      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  // API: Delete a job
  router.delete('/api/jobs/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = parseInt(req.params.id);
      const deleted = await service.deleteJob(jobId);

      if (!deleted) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: 'Failed to delete job' });
    }
  });

  // API: Retry a failed job
  router.post('/api/jobs/:id/retry', async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = parseInt(req.params.id);
      const retried = await service.retryJob(jobId);

      if (!retried) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      res.json({ success: true, message: 'Job queued for retry' });
    } catch (error) {
      console.error('Error retrying job:', error);
      res.status(500).json({ error: 'Failed to retry job' });
    }
  });

  // API: Get available queues
  router.get('/api/queues', async (req: Request, res: Response) => {
    try {
      const queues = await service.getQueues();
      res.json(queues);
    } catch (error) {
      console.error('Error fetching queues:', error);
      res.status(500).json({ error: 'Failed to fetch queues' });
    }
  });

  // API: Get available job classes
  router.get('/api/job-classes', async (req: Request, res: Response) => {
    try {
      const jobClasses = await service.getJobClasses();
      res.json(jobClasses);
    } catch (error) {
      console.error('Error fetching job classes:', error);
      res.status(500).json({ error: 'Failed to fetch job classes' });
    }
  });

  return router;
}

export { DashboardService, DashboardOptions };