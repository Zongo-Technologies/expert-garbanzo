"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardHTML = getDashboardHTML;
function getDashboardHTML(options) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f7fa;
            color: #2c3e50;
            line-height: 1.6;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .header p {
            opacity: 0.9;
            font-size: 0.95rem;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .stat-label {
            font-size: 0.875rem;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }

        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2c3e50;
        }

        .stat-card.success .stat-value { color: #27ae60; }
        .stat-card.warning .stat-value { color: #f39c12; }
        .stat-card.danger .stat-value { color: #e74c3c; }
        .stat-card.info .stat-value { color: #3498db; }

        .section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #ecf0f1;
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3e50;
        }

        .filters {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1.5rem;
        }

        select, input {
            padding: 0.5rem 1rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 0.95rem;
            background: white;
            cursor: pointer;
            transition: border-color 0.2s;
        }

        select:hover, select:focus, input:hover, input:focus {
            border-color: #667eea;
            outline: none;
        }

        .btn {
            padding: 0.5rem 1.25rem;
            border: none;
            border-radius: 6px;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5568d3;
        }

        .btn-danger {
            background: #e74c3c;
            color: white;
        }

        .btn-danger:hover {
            background: #c0392b;
        }

        .btn-success {
            background: #27ae60;
            color: white;
        }

        .btn-success:hover {
            background: #229954;
        }

        .btn-small {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
        }

        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: #f8f9fa;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid #ecf0f1;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #d1ecf1; color: #0c5460; }

        .chart-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 1.5rem;
        }

        .chart {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
        }

        .chart-title {
            font-weight: 600;
            margin-bottom: 1rem;
            color: #495057;
        }

        .chart-bar {
            display: flex;
            align-items: center;
            margin-bottom: 0.75rem;
        }

        .chart-label {
            min-width: 120px;
            font-size: 0.875rem;
            color: #6c757d;
        }

        .chart-bar-bg {
            flex: 1;
            height: 24px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }

        .chart-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }

        .chart-value {
            margin-left: 0.75rem;
            font-weight: 600;
            font-size: 0.875rem;
            min-width: 40px;
        }

        .loading {
            text-align: center;
            padding: 3rem;
            color: #7f8c8d;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
        }

        .empty-state {
            text-align: center;
            padding: 3rem;
            color: #7f8c8d;
        }

        .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.3;
        }

        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-top: 1.5rem;
        }

        .pagination button {
            padding: 0.5rem 1rem;
        }

        .pagination span {
            color: #6c757d;
            font-size: 0.95rem;
        }

        code {
            background: #f8f9fa;
            padding: 0.125rem 0.375rem;
            border-radius: 3px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.875rem;
            color: #e83e8c;
        }

        .job-args {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.875rem;
        }

        .error-message {
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #e74c3c;
            font-size: 0.875rem;
        }

        .refresh-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #27ae60;
            margin-left: 0.5rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        .actions {
            display: flex;
            gap: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${options.title}</h1>
        <p>Real-time job queue monitoring and management <span class="refresh-indicator"></span></p>
    </div>

    <div class="container">
        <!-- Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Jobs</div>
                <div class="stat-value" id="stat-total">-</div>
            </div>
            <div class="stat-card success">
                <div class="stat-label">Ready to Process</div>
                <div class="stat-value" id="stat-ready">-</div>
            </div>
            <div class="stat-card info">
                <div class="stat-label">Scheduled</div>
                <div class="stat-value" id="stat-scheduled">-</div>
            </div>
            <div class="stat-card danger">
                <div class="stat-label">Failed</div>
                <div class="stat-value" id="stat-failed">-</div>
            </div>
        </div>

        <!-- Charts -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">Analytics</h2>
            </div>
            <div class="chart-container">
                <div class="chart">
                    <div class="chart-title">Jobs by Queue</div>
                    <div id="chart-queues"></div>
                </div>
                <div class="chart">
                    <div class="chart-title">Jobs by Class</div>
                    <div id="chart-classes"></div>
                </div>
            </div>
        </div>

        <!-- Jobs Table -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">Jobs</h2>
            </div>
            
            <div class="filters">
                <select id="filter-status" onchange="loadJobs()">
                    <option value="all">All Jobs</option>
                    <option value="ready">Ready</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="failed">Failed</option>
                </select>
                <select id="filter-queue" onchange="loadJobs()">
                    <option value="">All Queues</option>
                </select>
                <select id="filter-class" onchange="loadJobs()">
                    <option value="">All Classes</option>
                </select>
                <button class="btn btn-primary" onclick="loadJobs()">Refresh</button>
            </div>

            <div id="jobs-container">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading jobs...</p>
                </div>
            </div>
        </div>

        <!-- Recent Failures -->
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">Recent Failures</h2>
            </div>
            <div id="failures-container">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading failures...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        const REFRESH_INTERVAL = ${options.refreshInterval};
        let currentPage = 0;
        const pageSize = 50;

        // Load initial data
        loadStats();
        loadQueues();
        loadJobClasses();
        loadJobs();

        // Set up auto-refresh
        setInterval(() => {
            loadStats();
            loadJobs();
        }, REFRESH_INTERVAL);

        async function loadStats() {
            try {
                const response = await fetch('${options.basePath}/api/stats');
                const stats = await response.json();

                document.getElementById('stat-total').textContent = stats.total.toLocaleString();
                document.getElementById('stat-ready').textContent = stats.ready.toLocaleString();
                document.getElementById('stat-scheduled').textContent = stats.scheduled.toLocaleString();
                document.getElementById('stat-failed').textContent = stats.failed.toLocaleString();

                renderChart('chart-queues', stats.totalByQueue, 'queue');
                renderChart('chart-classes', stats.totalByClass, 'jobClass');
                renderFailures(stats.recentFailures);
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        async function loadQueues() {
            try {
                const response = await fetch('${options.basePath}/api/queues');
                const queues = await response.json();
                const select = document.getElementById('filter-queue');
                queues.forEach(queue => {
                    const option = document.createElement('option');
                    option.value = queue;
                    option.textContent = queue;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading queues:', error);
            }
        }

        async function loadJobClasses() {
            try {
                const response = await fetch('${options.basePath}/api/job-classes');
                const classes = await response.json();
                const select = document.getElementById('filter-class');
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls;
                    option.textContent = cls;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading job classes:', error);
            }
        }

        async function loadJobs() {
            const status = document.getElementById('filter-status').value;
            const queue = document.getElementById('filter-queue').value;
            const jobClass = document.getElementById('filter-class').value;
            
            const params = new URLSearchParams({
                status,
                limit: pageSize.toString(),
                offset: (currentPage * pageSize).toString(),
            });

            if (queue) params.append('queue', queue);
            if (jobClass) params.append('jobClass', jobClass);

            try {
                const response = await fetch(\`${options.basePath}/api/jobs?\${params}\`);
                const data = await response.json();
                renderJobs(data.jobs, data.total);
            } catch (error) {
                console.error('Error loading jobs:', error);
                document.getElementById('jobs-container').innerHTML = 
                    '<div class="error">Failed to load jobs</div>';
            }
        }

        function renderChart(containerId, data, labelKey) {
            const container = document.getElementById(containerId);
            if (!data || data.length === 0) {
                container.innerHTML = '<div class="empty-state">No data</div>';
                return;
            }

            const maxValue = Math.max(...data.map(d => d.count));
            const html = data.slice(0, 10).map(item => {
                const percentage = (item.count / maxValue) * 100;
                const label = item[labelKey] || '(default)';
                return \`
                    <div class="chart-bar">
                        <div class="chart-label">\${escapeHtml(label)}</div>
                        <div class="chart-bar-bg">
                            <div class="chart-bar-fill" style="width: \${percentage}%"></div>
                        </div>
                        <div class="chart-value">\${item.count}</div>
                    </div>
                \`;
            }).join('');

            container.innerHTML = html || '<div class="empty-state">No data</div>';
        }

        function renderJobs(jobs, total) {
            const container = document.getElementById('jobs-container');
            
            if (!jobs || jobs.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>No jobs found</p>
                    </div>
                \`;
                return;
            }

            const now = new Date();
            const html = \`
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Class</th>
                                <th>Queue</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Run At</th>
                                <th>Errors</th>
                                <th>Arguments</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${jobs.map(job => {
                                const runAt = new Date(job.runAt);
                                const isReady = runAt <= now;
                                const isFailed = job.errorCount > 0;
                                const status = isFailed ? 'failed' : (isReady ? 'ready' : 'scheduled');
                                const statusBadge = isFailed ? 'danger' : (isReady ? 'success' : 'info');
                                
                                return \`
                                    <tr>
                                        <td><code>\${job.id}</code></td>
                                        <td>\${escapeHtml(job.jobClass)}</td>
                                        <td>\${escapeHtml(job.queue || '(default)')}</td>
                                        <td>\${job.priority}</td>
                                        <td><span class="badge badge-\${statusBadge}">\${status}</span></td>
                                        <td>\${formatDate(runAt)}</td>
                                        <td>\${job.errorCount > 0 ? '<span class="badge badge-danger">' + job.errorCount + '</span>' : '-'}</td>
                                        <td class="job-args">\${escapeHtml(JSON.stringify(job.args))}</td>
                                        <td>
                                            <div class="actions">
                                                \${job.errorCount > 0 ? 
                                                    \`<button class="btn btn-success btn-small" onclick="retryJob(\${job.id})">Retry</button>\` : 
                                                    ''}
                                                <button class="btn btn-danger btn-small" onclick="deleteJob(\${job.id})">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                \`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="pagination">
                    <button class="btn btn-primary" onclick="previousPage()" \${currentPage === 0 ? 'disabled' : ''}>Previous</button>
                    <span>Page \${currentPage + 1} of \${Math.ceil(total / pageSize)}</span>
                    <button class="btn btn-primary" onclick="nextPage()" \${(currentPage + 1) * pageSize >= total ? 'disabled' : ''}>Next</button>
                </div>
            \`;

            container.innerHTML = html;
        }

        function renderFailures(failures) {
            const container = document.getElementById('failures-container');
            
            if (!failures || failures.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">✅</div>
                        <p>No recent failures</p>
                    </div>
                \`;
                return;
            }

            const html = \`
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Class</th>
                                <th>Queue</th>
                                <th>Errors</th>
                                <th>Last Error</th>
                                <th>Run At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${failures.map(job => \`
                                <tr>
                                    <td><code>\${job.id}</code></td>
                                    <td>\${escapeHtml(job.jobClass)}</td>
                                    <td>\${escapeHtml(job.queue)}</td>
                                    <td><span class="badge badge-danger">\${job.errorCount}</span></td>
                                    <td class="error-message" title="\${escapeHtml(job.lastError)}">\${escapeHtml(job.lastError)}</td>
                                    <td>\${formatDate(new Date(job.runAt))}</td>
                                    <td>
                                        <div class="actions">
                                            <button class="btn btn-success btn-small" onclick="retryJob(\${job.id})">Retry</button>
                                            <button class="btn btn-danger btn-small" onclick="deleteJob(\${job.id})">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                </div>
            \`;

            container.innerHTML = html;
        }

        async function deleteJob(jobId) {
            if (!confirm(\`Are you sure you want to delete job #\${jobId}?\`)) {
                return;
            }

            try {
                const response = await fetch(\`${options.basePath}/api/jobs/\${jobId}\`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    await loadStats();
                    await loadJobs();
                } else {
                    alert('Failed to delete job');
                }
            } catch (error) {
                console.error('Error deleting job:', error);
                alert('Failed to delete job');
            }
        }

        async function retryJob(jobId) {
            try {
                const response = await fetch(\`${options.basePath}/api/jobs/\${jobId}/retry\`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    await loadStats();
                    await loadJobs();
                } else {
                    alert('Failed to retry job');
                }
            } catch (error) {
                console.error('Error retrying job:', error);
                alert('Failed to retry job');
            }
        }

        function nextPage() {
            currentPage++;
            loadJobs();
        }

        function previousPage() {
            if (currentPage > 0) {
                currentPage--;
                loadJobs();
            }
        }

        function formatDate(date) {
            const now = new Date();
            const diff = now - date;
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return \`\${days}d ago\`;
            if (hours > 0) return \`\${hours}h ago\`;
            if (minutes > 0) return \`\${minutes}m ago\`;
            if (seconds > 0) return \`\${seconds}s ago\`;
            return 'just now';
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
  `.trim();
}
//# sourceMappingURL=views.js.map