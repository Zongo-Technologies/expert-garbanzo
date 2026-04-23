import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { Pool } from 'pg';
import session from 'express-session';
import { DashboardService, DashboardOptions } from './service';
import { getDashboardHTML, getLoginHTML } from './views';

export interface DashboardMiddlewareOptions extends DashboardOptions {
  /**
   * Optional custom authentication middleware
   * If provided, built-in auth is disabled
   */
  customAuth?: (req: Request, res: Response, next: NextFunction) => boolean | Promise<boolean>;
}

// Extend Express session
declare module 'express-session' {
  interface SessionData {
    user?: {
      email: string;
      authenticated: boolean;
    };
  }
}

/**
 * Creates an Express router with the Que dashboard
 * 
 * @example
 * Basic setup with built-in auth:
 * ```typescript
 * import express from 'express';
 * import { Pool } from 'pg';
 * import { createDashboard } from 'worker-que/dist/dashboard';
 * 
 * const app = express();
 * const pool = new Pool({ ... });
 * 
 * app.use('/admin/queue', createDashboard(pool, {
 *   title: 'My App Queue',
 *   auth: {
 *     email: 'admin@example.com',
 *     password: 'your-secure-password'
 *   }
 * }));
 * ```
 * 
 * @example
 * Custom auth:
 * ```typescript
 * app.use('/admin/queue', createDashboard(pool, {
 *   customAuth: (req) => req.isAuthenticated()
 * }));
 * ```
 */
export function createDashboard(
  pool: Pool,
  options: DashboardMiddlewareOptions = {}
): Router {
  const router = Router();
  const service = new DashboardService(pool, options);
  const dashboardOptions = service.getOptions();
  const useBuiltInAuth = !!options.auth?.email && !!options.auth?.password;
  const customAuthMiddleware = options.customAuth;

  // Setup session middleware if using built-in auth
  if (useBuiltInAuth) {
    router.use(session({
      secret: options.auth?.password + '-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      }
    }));

    // Parse form data for login
    router.use(express.urlencoded({ extended: true }));
  }

  // Authentication middleware
  const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Custom auth takes precedence
    if (customAuthMiddleware) {
      try {
        const allowed = await customAuthMiddleware(req, res, next);
        if (!allowed) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      } catch (error) {
        res.status(500).json({ error: 'Authentication error' });
        return;
      }
      next();
      return;
    }

    // Built-in auth
    if (useBuiltInAuth) {
      if (req.session?.user?.authenticated) {
        next();
        return;
      }

      // Redirect to login page
      if (req.accepts('html')) {
        const loginHtml = getLoginHTML(dashboardOptions);
        res.type('html').send(loginHtml);
        return;
      }

      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // No auth configured
    next();
  };

  // Login page (only for built-in auth)
  if (useBuiltInAuth) {
    router.get('/login', (req: Request, res: Response) => {
      if (req.session?.user?.authenticated) {
        res.redirect(dashboardOptions.basePath || '/');
        return;
      }
      const loginHtml = getLoginHTML(dashboardOptions);
      res.type('html').send(loginHtml);
    });

    // Login handler
    router.post('/login', (req: Request, res: Response) => {
      const { email, password, remember } = req.body;

      if (email === options.auth?.email && password === options.auth?.password) {
        req.session.user = {
          email,
          authenticated: true,
        };

        // Extend session if remember me is checked
        if (remember === 'yes' && req.session.cookie) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        res.redirect(dashboardOptions.basePath || '/');
      } else {
        const loginHtml = getLoginHTML(dashboardOptions, 'Invalid email or password');
        res.type('html').send(loginHtml);
      }
    });

    // Logout handler
    router.post('/logout', (req: Request, res: Response) => {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
        res.redirect(dashboardOptions.basePath + '/login');
      });
    });
  }

  // Apply auth to all API routes and dashboard
  router.use(requireAuth);

  // Main dashboard page
  router.get('/', async (req: Request, res: Response) => {
    try {
      const userEmail = req.session?.user?.email;
      const html = getDashboardHTML(dashboardOptions, userEmail);
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
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const jobId = parseInt(idParam);
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

  // API: Update job arguments
  router.put('/api/jobs/:id/args', express.json(), async (req: Request, res: Response): Promise<void> => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const jobId = parseInt(idParam);
      const { args } = req.body;

      if (!Array.isArray(args)) {
        res.status(400).json({ error: 'args must be an array' });
        return;
      }

      const updated = await service.updateJobArgs(jobId, args);

      if (!updated) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      res.json({ success: true, message: 'Job arguments updated' });
    } catch (error) {
      console.error('Error updating job args:', error);
      res.status(500).json({ error: 'Failed to update job arguments' });
    }
  });

  // API: Delete a job
  router.delete('/api/jobs/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const jobId = parseInt(idParam);
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
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const jobId = parseInt(idParam);
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

  // API: Bulk job actions
  router.post('/api/jobs/bulk', express.json(), async (req: Request, res: Response): Promise<void> => {
    try {
      const { action, jobIds } = req.body;
      if (!Array.isArray(jobIds) || !jobIds.every(id => typeof id === 'number')) {
        res.status(400).json({ error: 'jobIds must be an array of numbers' });
        return;
      }
      if (action === 'delete') {
        const count = await service.bulkDeleteJobs(jobIds);
        res.json({ success: true, affected: count });
      } else if (action === 'retry') {
        const count = await service.bulkRetryJobs(jobIds);
        res.json({ success: true, affected: count });
      } else {
        res.status(400).json({ error: 'action must be "delete" or "retry"' });
      }
    } catch (error) {
      console.error('Error bulk action:', error);
      res.status(500).json({ error: 'Bulk action failed' });
    }
  });

  // API: List routines
  router.get('/api/routines', async (req: Request, res: Response) => {
    try {
      const routines = await service.getRoutines();
      res.json(routines);
    } catch (error) {
      console.error('Error fetching routines:', error);
      res.status(500).json({ error: 'Failed to fetch routines' });
    }
  });

  // API: Enable/disable a routine
  router.post('/api/routines/:id/enabled', express.json(), async (req: Request, res: Response): Promise<void> => {
    try {
      const routineId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        res.status(400).json({ error: 'enabled must be a boolean' });
        return;
      }
      const ok = await service.setRoutineEnabled(routineId, enabled);
      if (!ok) { res.status(404).json({ error: 'Routine not found' }); return; }
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating routine:', error);
      res.status(500).json({ error: 'Failed to update routine' });
    }
  });

  // API: Delete a routine
  router.delete('/api/routines/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const routineId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const ok = await service.deleteRoutine(routineId);
      if (!ok) { res.status(404).json({ error: 'Routine not found' }); return; }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting routine:', error);
      res.status(500).json({ error: 'Failed to delete routine' });
    }
  });

  return router;
}

export { DashboardService, DashboardOptions };
