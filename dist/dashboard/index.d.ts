import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { DashboardService, DashboardOptions } from './service';
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
export declare function createDashboard(pool: Pool, options?: DashboardMiddlewareOptions): Router;
export { DashboardService, DashboardOptions };
//# sourceMappingURL=index.d.ts.map