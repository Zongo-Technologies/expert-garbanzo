import { DashboardInternalOptions } from './service';

export function getLoginHTML(options: DashboardInternalOptions, error?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in - ${options.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .login-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 40px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 440px;
            padding: 44px;
        }

        .logo-container {
            text-align: center;
            margin-bottom: 24px;
        }

        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #0078d4, #106ebe);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }

        .logo-icon {
            font-size: 32px;
            color: white;
        }

        h1 {
            font-size: 24px;
            font-weight: 600;
            color: #1f1f1f;
            margin-bottom: 8px;
            text-align: center;
        }

        .subtitle {
            font-size: 15px;
            color: #605e5c;
            text-align: center;
            margin-bottom: 32px;
        }

        .form-group {
            margin-bottom: 24px;
        }

        label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #323130;
            margin-bottom: 8px;
        }

        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #8a8886;
            border-radius: 2px;
            transition: all 0.15s ease;
            font-family: 'Segoe UI', sans-serif;
        }

        input:focus {
            outline: none;
            border-color: #0078d4;
            box-shadow: 0 0 0 1px #0078d4;
        }

        input:hover {
            border-color: #323130;
        }

        .error-message {
            background: #fde7e9;
            border-left: 3px solid #a4262c;
            color: #a4262c;
            padding: 12px 16px;
            font-size: 13px;
            margin-bottom: 20px;
            border-radius: 2px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .error-icon {
            font-weight: bold;
        }

        .submit-btn {
            width: 100%;
            background: #0078d4;
            color: white;
            border: none;
            padding: 11px 24px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.15s ease;
            font-family: 'Segoe UI', sans-serif;
        }

        .submit-btn:hover {
            background: #106ebe;
        }

        .submit-btn:active {
            background: #005a9e;
        }

        .submit-btn:disabled {
            background: #f3f2f1;
            color: #a19f9d;
            cursor: not-allowed;
        }

        .remember-me {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            font-size: 13px;
            color: #323130;
        }

        .remember-me input[type="checkbox"] {
            margin-right: 8px;
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .footer-text {
            margin-top: 24px;
            text-align: center;
            font-size: 12px;
            color: #605e5c;
        }

        .security-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: #f3f2f1;
            border-radius: 4px;
            font-size: 12px;
            color: #605e5c;
            margin-top: 16px;
        }

        .lock-icon {
            color: #107c10;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo-container">
            <div class="logo">
                <span class="logo-icon">📊</span>
            </div>
            <h1>${options.title}</h1>
            <p class="subtitle">Sign in to continue to dashboard</p>
        </div>

        ${error ? `
        <div class="error-message">
            <span class="error-icon">⚠</span>
            <span>${error}</span>
        </div>
        ` : ''}

        <form method="POST" action="${options.basePath}/login">
            <div class="form-group">
                <label for="email">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    autocomplete="email"
                    placeholder="Enter your email"
                    autofocus
                >
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required 
                    autocomplete="current-password"
                    placeholder="Enter your password"
                >
            </div>

            <div class="remember-me">
                <input type="checkbox" id="remember" name="remember" value="yes">
                <label for="remember" style="margin-bottom: 0; font-weight: 400;">Keep me signed in</label>
            </div>

            <button type="submit" class="submit-btn">Sign in</button>

            <div class="footer-text">
                <div class="security-badge">
                    <span class="lock-icon">🔒</span>
                    <span>Secure connection</span>
                </div>
            </div>
        </form>
    </div>
</body>
</html>
  `.trim();
}

export function getDashboardHTML(options: DashboardInternalOptions, userEmail?: string): string {
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
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
            background: #faf9f8;
            color: #201f1e;
            line-height: 1.6;
        }

        /* Microsoft Fluent Design Header */
        .header {
            background: #ffffff;
            border-bottom: 1px solid #edebe9;
            box-shadow: 0 0.3px 0.9px rgba(0,0,0,0.108), 0 1.6px 3.6px rgba(0,0,0,0.132);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-content {
            max-width: 1600px;
            margin: 0 auto;
            padding: 0 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 48px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .logo {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #0078d4, #106ebe);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .header h1 {
            font-size: 16px;
            font-weight: 600;
            color: #201f1e;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 12px 4px 4px;
            background: #f3f2f1;
            border-radius: 4px;
            font-size: 13px;
            color: #323130;
        }

        .user-avatar {
            width: 24px;
            height: 24px;
            background: #0078d4;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
        }

        .logout-btn {
            background: transparent;
            border: 1px solid #8a8886;
            color: #323130;
            padding: 6px 12px;
            font-size: 13px;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.1s ease;
            font-family: 'Segoe UI', sans-serif;
            font-weight: 600;
        }

        .logout-btn:hover {
            background: #f3f2f1;
            border-color: #323130;
        }

        .logout-btn:active {
            background: #edebe9;
        }

        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 24px;
        }

        /* Fluent Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .stat-card {
            background: #ffffff;
            border: 1px solid #edebe9;
            border-radius: 4px;
            padding: 20px;
            box-shadow: 0 0.3px 0.9px rgba(0,0,0,0.108), 0 1.6px 3.6px rgba(0,0,0,0.132);
            transition: all 0.2s cubic-bezier(0.4, 0.0, 0.23, 1);
            position: relative;
            overflow: hidden;
        }

        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 3.2px 7.2px rgba(0,0,0,0.132), 0 0.6px 1.8px rgba(0,0,0,0.108);
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: #8a8886;
        }

        .stat-card.success::before { background: #107c10; }
        .stat-card.warning::before { background: #faa900; }
        .stat-card.danger::before { background: #d13438; }
        .stat-card.info::before { background: #0078d4; }

        .stat-label {
            font-size: 12px;
            color: #605e5c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 600;
            color: #323130;
            line-height: 1.2;
        }

        .stat-card.success .stat-value { color: #107c10; }
        .stat-card.warning .stat-value { color: #f7630c; }
        .stat-card.danger .stat-value { color: #d13438; }
        .stat-card.info .stat-value { color: #0078d4; }

        .section {
            background: #ffffff;
            border: 1px solid #edebe9;
            border-radius: 4px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 0.3px 0.9px rgba(0,0,0,0.108), 0 1.6px 3.6px rgba(0,0,0,0.132);
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #edebe9;
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #323130;
        }

        /* Fluent Inputs */
        .filters {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }

        select, input {
            padding: 7px 8px;
            border: 1px solid #8a8886;
            border-radius: 2px;
            font-size: 14px;
            background: white;
            color: #323130;
            cursor: pointer;
            transition: all 0.15s ease;
            font-family: 'Segoe UI', sans-serif;
        }

        select:hover, input:hover {
            border-color: #323130;
        }

        select:focus, input:focus {
            outline: none;
            border-color: #0078d4;
            box-shadow: 0 0 0 1px #0078d4;
        }

        /* Fluent Buttons */
        .btn {
            padding: 7px 16px;
            border: 1px solid #8a8886;
            border-radius: 2px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.1s ease;
            font-family: 'Segoe UI', sans-serif;
            background: white;
            color: #323130;
        }

        .btn:hover {
            background: #f3f2f1;
            border-color: #323130;
        }

        .btn:active {
            background: #edebe9;
        }

        .btn-primary {
            background: #0078d4;
            border-color: #0078d4;
            color: white;
        }

        .btn-primary:hover {
            background: #106ebe;
            border-color: #106ebe;
        }

        .btn-primary:active {
            background: #005a9e;
        }

        .btn-danger {
            background: #d13438;
            border-color: #d13438;
            color: white;
        }

        .btn-danger:hover {
            background: #a4262c;
            border-color: #a4262c;
        }

        .btn-success {
            background: #107c10;
            border-color: #107c10;
            color: white;
        }

        .btn-success:hover {
            background: #0b6a0b;
            border-color: #0b6a0b;
        }

        .btn-small {
            padding: 5px 12px;
            font-size: 13px;
        }

        /* Modern Table */
        .table-container {
            overflow-x: auto;
            border-radius: 4px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: #f3f2f1;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            color: #323130;
            border-bottom: 1px solid #edebe9;
            font-size: 13px;
            text-transform: none;
            letter-spacing: 0;
        }

        td {
            padding: 12px 16px;
            border-bottom: 1px solid #edebe9;
            font-size: 13px;
        }

        tr:hover {
            background: #faf9f8;
        }

        tr:last-child td {
            border-bottom: none;
        }

        /* Fluent Badges */
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 2px;
            font-size: 12px;
            font-weight: 600;
            text-transform: capitalize;
        }

        .badge-success { background: #dff6dd; color: #107c10; }
        .badge-warning { background: #fff4ce; color: #8a5500; }
        .badge-danger { background: #fde7e9; color: #a4262c; }
        .badge-info { background: #deecf9; color: #004e8c; }

        /* Charts */
        .chart-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 24px;
            margin-top: 20px;
        }

        .chart {
            background: #faf9f8;
            padding: 20px;
            border-radius: 4px;
            border: 1px solid #edebe9;
        }

        .chart-title {
            font-weight: 600;
            margin-bottom: 16px;
            color: #323130;
            font-size: 14px;
        }

        .chart-bar {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }

        .chart-label {
            min-width: 120px;
            font-size: 13px;
            color: #605e5c;
        }

        .chart-bar-bg {
            flex: 1;
            height: 28px;
            background: #edebe9;
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }

        .chart-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #0078d4, #106ebe);
            transition: width 0.3s ease;
        }

        .chart-value {
            margin-left: 12px;
            font-weight: 600;
            font-size: 13px;
            min-width: 40px;
            color: #323130;
        }

        .loading {
            text-align: center;
            padding: 48px;
            color: #605e5c;
        }

        .spinner {
            border: 3px solid #edebe9;
            border-top: 3px solid #0078d4;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error {
            background: #fde7e9;
            color: #a4262c;
            padding: 16px;
            border-radius: 4px;
            border-left: 3px solid #d13438;
        }

        .empty-state {
            text-align: center;
            padding: 48px;
            color: #605e5c;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            margin-top: 24px;
        }

        .pagination button {
            padding: 7px 16px;
        }

        .pagination span {
            color: #605e5c;
            font-size: 13px;
        }

        code {
            background: #f3f2f1;
            padding: 2px 6px;
            border-radius: 2px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            color: #d13438;
        }

        .job-args {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 2px;
            transition: background 0.1s ease;
        }

        .job-args:hover {
            background: #deecf9;
            color: #004e8c;
        }

        /* Args Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 200;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal {
            background: #ffffff;
            border-radius: 4px;
            box-shadow: 0 25.6px 57.6px rgba(0,0,0,0.22), 0 4.8px 14.4px rgba(0,0,0,0.18);
            width: 90%;
            max-width: 640px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            animation: modalIn 0.15s ease;
        }

        @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            border-bottom: 1px solid #edebe9;
        }

        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #323130;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #605e5c;
            padding: 4px 8px;
            border-radius: 2px;
        }

        .modal-close:hover {
            background: #f3f2f1;
            color: #201f1e;
        }

        .modal-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 16px 24px;
            border-top: 1px solid #edebe9;
        }

        .args-viewer {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 16px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.5;
            max-height: 300px;
            overflow-y: auto;
        }

        .args-editor {
            width: 100%;
            min-height: 200px;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 16px;
            border-radius: 4px;
            border: 2px solid #0078d4;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.5;
            resize: vertical;
        }

        .args-editor:focus {
            outline: none;
            border-color: #106ebe;
        }

        .args-error {
            color: #d13438;
            font-size: 12px;
            margin-top: 8px;
        }

        .copy-feedback {
            color: #107c10;
            font-size: 12px;
            margin-left: 8px;
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .copy-feedback.show {
            opacity: 1;
        }

        .error-message {
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #d13438;
            font-size: 12px;
        }

        .refresh-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #107c10;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        .actions {
            display: flex;
            gap: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="header-left">
                <div class="logo">📊</div>
                <h1>${options.title}</h1>
            </div>
            <div class="header-right">
                ${userEmail ? `
                <div class="user-info">
                    <div class="user-avatar">${userEmail.charAt(0).toUpperCase()}</div>
                    <span>${userEmail}</span>
                </div>
                ` : ''}
                <form method="POST" action="${options.basePath}/logout" style="display: inline;">
                    <button type="submit" class="logout-btn">Sign out</button>
                </form>
            </div>
        </div>
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
                <span class="refresh-indicator"></span>
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

    <!-- Args Modal -->
    <div class="modal-overlay" id="args-modal">
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title" id="args-modal-title">Job Arguments</span>
                <button class="modal-close" onclick="closeArgsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div id="args-view-mode">
                    <pre class="args-viewer" id="args-content"></pre>
                </div>
                <div id="args-edit-mode" style="display:none">
                    <textarea class="args-editor" id="args-editor"></textarea>
                    <div class="args-error" id="args-error"></div>
                </div>
            </div>
            <div class="modal-footer">
                <span class="copy-feedback" id="copy-feedback">Copied!</span>
                <button class="btn" id="btn-copy" onclick="copyArgs()">Copy</button>
                <button class="btn" id="btn-edit" onclick="enterEditMode()">Edit</button>
                <button class="btn btn-primary" id="btn-save" style="display:none" onclick="saveArgs()">Save</button>
                <button class="btn" id="btn-cancel-edit" style="display:none" onclick="cancelEdit()">Cancel</button>
            </div>
        </div>
    </div>

    <script>
        const REFRESH_INTERVAL = ${options.refreshInterval};
        let currentPage = 0;
        const pageSize = 50;
        let currentModalJobId = null;
        let currentModalArgs = null;

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
                                        <td class="job-args" data-job-id="\${job.id}" data-args="\${escapeAttr(JSON.stringify(job.args))}" onclick="openArgsFromEl(this)" title="Click to view/edit">\${escapeHtml(JSON.stringify(job.args))}</td>
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
                    <button class="btn" onclick="previousPage()" \${currentPage === 0 ? 'disabled' : ''}>Previous</button>
                    <span>Page \${currentPage + 1} of \${Math.ceil(total / pageSize)}</span>
                    <button class="btn" onclick="nextPage()" \${(currentPage + 1) * pageSize >= total ? 'disabled' : ''}>Next</button>
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

        function escapeAttr(text) {
            return text.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function openArgsFromEl(el) {
            var jobId = parseInt(el.getAttribute('data-job-id'));
            var args = JSON.parse(el.getAttribute('data-args'));
            openArgsModal(jobId, args);
        }

        function openArgsModal(jobId, args) {
            currentModalJobId = jobId;
            currentModalArgs = args;
            document.getElementById('args-modal-title').textContent = 'Job #' + jobId + ' Arguments';
            document.getElementById('args-content').textContent = JSON.stringify(args, null, 2);
            document.getElementById('args-view-mode').style.display = '';
            document.getElementById('args-edit-mode').style.display = 'none';
            document.getElementById('btn-copy').style.display = '';
            document.getElementById('btn-edit').style.display = '';
            document.getElementById('btn-save').style.display = 'none';
            document.getElementById('btn-cancel-edit').style.display = 'none';
            document.getElementById('args-error').textContent = '';
            document.getElementById('args-modal').classList.add('active');
        }

        function closeArgsModal() {
            document.getElementById('args-modal').classList.remove('active');
            currentModalJobId = null;
            currentModalArgs = null;
        }

        function copyArgs() {
            const text = JSON.stringify(currentModalArgs, null, 2);
            navigator.clipboard.writeText(text).then(function() {
                var fb = document.getElementById('copy-feedback');
                fb.classList.add('show');
                setTimeout(function() { fb.classList.remove('show'); }, 1500);
            });
        }

        function enterEditMode() {
            document.getElementById('args-view-mode').style.display = 'none';
            document.getElementById('args-edit-mode').style.display = '';
            document.getElementById('args-editor').value = JSON.stringify(currentModalArgs, null, 2);
            document.getElementById('btn-copy').style.display = 'none';
            document.getElementById('btn-edit').style.display = 'none';
            document.getElementById('btn-save').style.display = '';
            document.getElementById('btn-cancel-edit').style.display = '';
            document.getElementById('args-error').textContent = '';
            document.getElementById('args-editor').focus();
        }

        function cancelEdit() {
            document.getElementById('args-view-mode').style.display = '';
            document.getElementById('args-edit-mode').style.display = 'none';
            document.getElementById('btn-copy').style.display = '';
            document.getElementById('btn-edit').style.display = '';
            document.getElementById('btn-save').style.display = 'none';
            document.getElementById('btn-cancel-edit').style.display = 'none';
            document.getElementById('args-error').textContent = '';
        }

        async function saveArgs() {
            var raw = document.getElementById('args-editor').value;
            var parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                document.getElementById('args-error').textContent = 'Invalid JSON: ' + e.message;
                return;
            }

            if (!Array.isArray(parsed)) {
                document.getElementById('args-error').textContent = 'Arguments must be a JSON array.';
                return;
            }

            try {
                var response = await fetch(\`${options.basePath}/api/jobs/\${currentModalJobId}/args\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ args: parsed })
                });

                if (response.ok) {
                    currentModalArgs = parsed;
                    document.getElementById('args-content').textContent = JSON.stringify(parsed, null, 2);
                    cancelEdit();
                    loadJobs();
                    loadStats();
                } else {
                    var data = await response.json();
                    document.getElementById('args-error').textContent = data.error || 'Failed to update arguments.';
                }
            } catch (error) {
                document.getElementById('args-error').textContent = 'Network error. Please try again.';
            }
        }

        // Close modal on overlay click
        document.getElementById('args-modal').addEventListener('click', function(e) {
            if (e.target === this) closeArgsModal();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeArgsModal();
        });
    </script>
</body>
</html>
  `.trim();
}
