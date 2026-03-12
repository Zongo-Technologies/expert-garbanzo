"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
exports.createDashboard = createDashboard;
const express_1 = require("express");
const service_1 = require("./service");
Object.defineProperty(exports, "DashboardService", { enumerable: true, get: function () { return service_1.DashboardService; } });
const views_1 = require("./views");
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
function createDashboard(pool, options = {}) {
    const router = (0, express_1.Router)();
    const service = new service_1.DashboardService(pool, options);
    const authMiddleware = options.auth;
    // Authentication middleware wrapper
    const requireAuth = async (req, res, next) => {
        if (authMiddleware) {
            try {
                const allowed = await authMiddleware(req, res, next);
                if (!allowed) {
                    res.status(403).json({ error: 'Access denied' });
                    return;
                }
            }
            catch (error) {
                res.status(500).json({ error: 'Authentication error' });
                return;
            }
        }
        next();
    };
    // Apply auth to all routes
    router.use(requireAuth);
    // Main dashboard page
    router.get('/', async (req, res) => {
        try {
            const html = (0, views_1.getDashboardHTML)(service.getOptions());
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
            const jobId = parseInt(req.params.id);
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
    // API: Delete a job
    router.delete('/api/jobs/:id', async (req, res) => {
        try {
            const jobId = parseInt(req.params.id);
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
            const jobId = parseInt(req.params.id);
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