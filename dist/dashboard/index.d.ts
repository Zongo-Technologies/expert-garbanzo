import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { DashboardService, DashboardOptions } from './service';
export interface DashboardMiddlewareOptions extends DashboardOptions {
    /**
     * Optional custom authentication middleware
     * If provided, built-in auth is disabled
     */
    customAuth?: (req: Request, res: Response, next: NextFunction) => boolean | Promise<boolean>;
}
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
export declare function createDashboard(pool: Pool, options?: DashboardMiddlewareOptions): Router;
export { DashboardService, DashboardOptions };
//# sourceMappingURL=index.d.ts.map