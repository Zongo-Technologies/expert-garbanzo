"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
exports.createDashboard = createDashboard;
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const service_1 = require("./service");
Object.defineProperty(exports, "DashboardService", { enumerable: true, get: function () { return service_1.DashboardService; } });
const views_1 = require("./views");
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
function createDashboard(pool, options = {}) {
    const router = (0, express_1.Router)();
    const service = new service_1.DashboardService(pool, options);
    const dashboardOptions = service.getOptions();
    const useBuiltInAuth = !!options.auth?.email && !!options.auth?.password;
    const customAuthMiddleware = options.customAuth;
    // Setup session middleware if using built-in auth
    if (useBuiltInAuth) {
        router.use((0, express_session_1.default)({
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
        router.use(express_2.default.urlencoded({ extended: true }));
    }
    // Authentication middleware
    const requireAuth = async (req, res, next) => {
        // Custom auth takes precedence
        if (customAuthMiddleware) {
            try {
                const allowed = await customAuthMiddleware(req, res, next);
                if (!allowed) {
                    res.status(403).json({ error: 'Access denied' });
                    return;
                }
            }
            catch (error) {
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
                const loginHtml = (0, views_1.getLoginHTML)(dashboardOptions);
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
        router.get('/login', (req, res) => {
            if (req.session?.user?.authenticated) {
                res.redirect(dashboardOptions.basePath || '/');
                return;
            }
            const loginHtml = (0, views_1.getLoginHTML)(dashboardOptions);
            res.type('html').send(loginHtml);
        });
        // Login handler
        router.post('/login', (req, res) => {
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
            }
            else {
                const loginHtml = (0, views_1.getLoginHTML)(dashboardOptions, 'Invalid email or password');
                res.type('html').send(loginHtml);
            }
        });
        // Logout handler
        router.post('/logout', (req, res) => {
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
    router.get('/', async (req, res) => {
        try {
            const userEmail = req.session?.user?.email;
            const html = (0, views_1.getDashboardHTML)(dashboardOptions, userEmail);
            res.type('html').send(html);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to load dashboard' });
        }
    });
    // API: Get queue statistics
    router.get('/api/stats', async (req, res) => {
        try {
            const stats = await service.getStats();
            res.json(stats);
        }
        catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    });
    // API: Get jobs list
    router.get('/api/jobs', async (req, res) => {
        try {
            const { queue, jobClass, status, limit, offset, } = req.query;
            const result = await service.getJobs({
                queue: queue,
                jobClass: jobClass,
                status: status,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            res.json(result);
        }
        catch (error) {
            console.error('Error fetching jobs:', error);
            res.status(500).json({ error: 'Failed to fetch jobs' });
        }
    });
    // API: Get single job details
    router.get('/api/jobs/:id', async (req, res) => {
        try {
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const jobId = parseInt(idParam);
            const job = await service.getJob(jobId);
            if (!job) {
                res.status(404).json({ error: 'Job not found' });
                return;
            }
            res.json(job);
        }
        catch (error) {
            console.error('Error fetching job:', error);
            res.status(500).json({ error: 'Failed to fetch job' });
        }
    });
    // API: Update job arguments
    router.put('/api/jobs/:id/args', express_2.default.json(), async (req, res) => {
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
        }
        catch (error) {
            console.error('Error updating job args:', error);
            res.status(500).json({ error: 'Failed to update job arguments' });
        }
    });
    // API: Delete a job
    router.delete('/api/jobs/:id', async (req, res) => {
        try {
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const jobId = parseInt(idParam);
            const deleted = await service.deleteJob(jobId);
            if (!deleted) {
                res.status(404).json({ error: 'Job not found' });
                return;
            }
            res.json({ success: true, message: 'Job deleted' });
        }
        catch (error) {
            console.error('Error deleting job:', error);
            res.status(500).json({ error: 'Failed to delete job' });
        }
    });
    // API: Retry a failed job
    router.post('/api/jobs/:id/retry', async (req, res) => {
        try {
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const jobId = parseInt(idParam);
            const retried = await service.retryJob(jobId);
            if (!retried) {
                res.status(404).json({ error: 'Job not found' });
                return;
            }
            res.json({ success: true, message: 'Job queued for retry' });
        }
        catch (error) {
            console.error('Error retrying job:', error);
            res.status(500).json({ error: 'Failed to retry job' });
        }
    });
    // API: Get available queues
    router.get('/api/queues', async (req, res) => {
        try {
            const queues = await service.getQueues();
            res.json(queues);
        }
        catch (error) {
            console.error('Error fetching queues:', error);
            res.status(500).json({ error: 'Failed to fetch queues' });
        }
    });
    // API: Get available job classes
    router.get('/api/job-classes', async (req, res) => {
        try {
            const jobClasses = await service.getJobClasses();
            res.json(jobClasses);
        }
        catch (error) {
            console.error('Error fetching job classes:', error);
            res.status(500).json({ error: 'Failed to fetch job classes' });
        }
    });
    return router;
}
//# sourceMappingURL=index.js.map