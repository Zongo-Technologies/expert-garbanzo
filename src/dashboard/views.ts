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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem;
        }
        .login-container {
            background: white; border-radius: 8px;
            box-shadow: 0 2px 40px rgba(0,0,0,0.2); width: 100%; max-width: 440px; padding: 44px;
        }
        .logo-container { text-align: center; margin-bottom: 24px; }
        .logo {
            width: 60px; height: 60px; background: linear-gradient(135deg, #0078d4, #106ebe);
            border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .logo-icon { font-size: 32px; color: white; }
        h1 { font-size: 24px; font-weight: 600; color: #1f1f1f; margin-bottom: 8px; text-align: center; }
        .subtitle { font-size: 15px; color: #605e5c; text-align: center; margin-bottom: 32px; }
        .form-group { margin-bottom: 24px; }
        label { display: block; font-size: 14px; font-weight: 600; color: #323130; margin-bottom: 8px; }
        input[type="email"], input[type="password"] {
            width: 100%; padding: 10px 12px; font-size: 14px; border: 1px solid #8a8886;
            border-radius: 2px; transition: all 0.15s ease; font-family: 'Segoe UI', sans-serif;
        }
        input:focus { outline: none; border-color: #0078d4; box-shadow: 0 0 0 1px #0078d4; }
        input:hover { border-color: #323130; }
        .error-message {
            background: #fde7e9; border-left: 3px solid #a4262c; color: #a4262c;
            padding: 12px 16px; font-size: 13px; margin-bottom: 20px; border-radius: 2px;
            display: flex; align-items: center; gap: 8px;
        }
        .submit-btn {
            width: 100%; background: #0078d4; color: white; border: none;
            padding: 11px 24px; font-size: 14px; font-weight: 600; border-radius: 2px;
            cursor: pointer; transition: all 0.15s ease; font-family: 'Segoe UI', sans-serif;
        }
        .submit-btn:hover { background: #106ebe; }
        .remember-me { display: flex; align-items: center; margin-bottom: 24px; font-size: 13px; color: #323130; }
        .remember-me input[type="checkbox"] { margin-right: 8px; width: 16px; height: 16px; cursor: pointer; }
        .footer-text { margin-top: 24px; text-align: center; font-size: 12px; color: #605e5c; }
        .security-badge {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 12px; background: #f3f2f1; border-radius: 4px; font-size: 12px; color: #605e5c; margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo-container">
            <div class="logo"><span class="logo-icon">📊</span></div>
            <h1>${options.title}</h1>
            <p class="subtitle">Sign in to continue to dashboard</p>
        </div>
        ${error ? `<div class="error-message"><span>⚠</span><span>${error}</span></div>` : ''}
        <form method="POST" action="${options.basePath}/login">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required autocomplete="email" placeholder="Enter your email" autofocus>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Enter your password">
            </div>
            <div class="remember-me">
                <input type="checkbox" id="remember" name="remember" value="yes">
                <label for="remember" style="margin-bottom:0;font-weight:400;">Keep me signed in</label>
            </div>
            <button type="submit" class="submit-btn">Sign in</button>
            <div class="footer-text">
                <div class="security-badge"><span>🔒</span><span>Secure connection</span></div>
            </div>
        </form>
    </div>
</body>
</html>`.trim();
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background: #faf9f8; color: #201f1e; line-height: 1.6; }

        /* Header */
        .header { background: #fff; border-bottom: 1px solid #edebe9; box-shadow: 0 0.3px 0.9px rgba(0,0,0,.108), 0 1.6px 3.6px rgba(0,0,0,.132); position: sticky; top: 0; z-index: 100; }
        .header-content { max-width: 1600px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 48px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .logo { width: 32px; height: 32px; background: linear-gradient(135deg,#0078d4,#106ebe); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .header h1 { font-size: 16px; font-weight: 600; color: #201f1e; }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .user-info { display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 4px; background: #f3f2f1; border-radius: 4px; font-size: 13px; color: #323130; }
        .user-avatar { width: 24px; height: 24px; background: #0078d4; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }
        .logout-btn { background: transparent; border: 1px solid #8a8886; color: #323130; padding: 6px 12px; font-size: 13px; border-radius: 2px; cursor: pointer; transition: all 0.1s; font-family: inherit; font-weight: 600; }
        .logout-btn:hover { background: #f3f2f1; border-color: #323130; }

        /* Layout */
        .container { max-width: 1600px; margin: 0 auto; padding: 24px; }

        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #fff; border: 1px solid #edebe9; border-radius: 4px; padding: 20px; box-shadow: 0 0.3px 0.9px rgba(0,0,0,.108), 0 1.6px 3.6px rgba(0,0,0,.132); position: relative; overflow: hidden; transition: transform .2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 3.2px 7.2px rgba(0,0,0,.132); }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #8a8886; }
        .stat-card.success::before { background: #107c10; }
        .stat-card.warning::before { background: #faa900; }
        .stat-card.danger::before  { background: #d13438; }
        .stat-card.info::before    { background: #0078d4; }
        .stat-card.purple::before  { background: #6b69d6; }
        .stat-label { font-size: 12px; color: #605e5c; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; font-weight: 600; }
        .stat-value { font-size: 32px; font-weight: 600; color: #323130; line-height: 1.2; }
        .stat-card.success .stat-value { color: #107c10; }
        .stat-card.warning .stat-value { color: #f7630c; }
        .stat-card.danger  .stat-value { color: #d13438; }
        .stat-card.info    .stat-value { color: #0078d4; }
        .stat-card.purple  .stat-value { color: #6b69d6; }

        /* Tabs */
        .tabs { display: flex; gap: 0; border-bottom: 2px solid #edebe9; margin-bottom: 24px; }
        .tab-btn { background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; padding: 10px 20px; font-size: 14px; font-weight: 600; color: #605e5c; cursor: pointer; transition: all .15s; font-family: inherit; }
        .tab-btn:hover { color: #201f1e; background: #f3f2f1; }
        .tab-btn.active { color: #0078d4; border-bottom-color: #0078d4; }
        .tab-panel { display: none; }
        .tab-panel.active { display: block; }

        /* Sections */
        .section { background: #fff; border: 1px solid #edebe9; border-radius: 4px; padding: 24px; margin-bottom: 24px; box-shadow: 0 0.3px 0.9px rgba(0,0,0,.108), 0 1.6px 3.6px rgba(0,0,0,.132); }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #edebe9; }
        .section-title { font-size: 18px; font-weight: 600; color: #323130; }
        .refresh-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #107c10; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

        /* Filters + bulk bar */
        .filters { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
        .bulk-bar { display: none; align-items: center; gap: 10px; background: #deecf9; border: 1px solid #0078d4; border-radius: 4px; padding: 8px 16px; margin-bottom: 12px; font-size: 13px; color: #004e8c; font-weight: 600; }
        .bulk-bar.visible { display: flex; }
        .bulk-count { flex: 1; }

        /* Inputs */
        select, input[type="text"] { padding: 7px 8px; border: 1px solid #8a8886; border-radius: 2px; font-size: 14px; background: white; color: #323130; cursor: pointer; transition: all .15s; font-family: inherit; }
        select:hover, input[type="text"]:hover { border-color: #323130; }
        select:focus, input[type="text"]:focus { outline: none; border-color: #0078d4; box-shadow: 0 0 0 1px #0078d4; }

        /* Buttons */
        .btn { padding: 7px 16px; border: 1px solid #8a8886; border-radius: 2px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .1s; font-family: inherit; background: white; color: #323130; }
        .btn:hover { background: #f3f2f1; border-color: #323130; }
        .btn:active { background: #edebe9; }
        .btn:disabled { opacity: .4; cursor: not-allowed; }
        .btn-primary { background: #0078d4; border-color: #0078d4; color: white; }
        .btn-primary:hover { background: #106ebe; border-color: #106ebe; }
        .btn-danger  { background: #d13438; border-color: #d13438; color: white; }
        .btn-danger:hover  { background: #a4262c; border-color: #a4262c; }
        .btn-success { background: #107c10; border-color: #107c10; color: white; }
        .btn-success:hover { background: #0b6a0b; border-color: #0b6a0b; }
        .btn-small { padding: 4px 10px; font-size: 12px; }
        .btn-icon { padding: 4px 8px; font-size: 14px; background: none; border: 1px solid transparent; border-radius: 2px; cursor: pointer; color: #605e5c; transition: all .1s; }
        .btn-icon:hover { background: #f3f2f1; border-color: #edebe9; color: #201f1e; }

        /* Table */
        .table-container { overflow-x: auto; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f2f1; padding: 10px 12px; text-align: left; font-weight: 600; color: #323130; border-bottom: 1px solid #edebe9; font-size: 13px; white-space: nowrap; }
        td { padding: 10px 12px; border-bottom: 1px solid #edebe9; font-size: 13px; vertical-align: middle; }
        tr:hover td { background: #faf9f8; }
        tr:last-child td { border-bottom: none; }
        tr.selected td { background: #eff6fc; }

        /* Checkbox */
        input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #0078d4; }
        th.col-check, td.col-check { width: 36px; text-align: center; }

        /* Badges */
        .badge { display: inline-block; padding: 3px 8px; border-radius: 2px; font-size: 12px; font-weight: 600; }
        .badge-success { background: #dff6dd; color: #107c10; }
        .badge-warning { background: #fff4ce; color: #8a5500; }
        .badge-danger  { background: #fde7e9; color: #a4262c; }
        .badge-info    { background: #deecf9; color: #004e8c; }
        .badge-neutral { background: #f3f2f1; color: #605e5c; }

        /* Charts */
        .chart-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-top: 20px; }
        .chart { background: #faf9f8; padding: 20px; border-radius: 4px; border: 1px solid #edebe9; }
        .chart-title { font-weight: 600; margin-bottom: 16px; color: #323130; font-size: 14px; }
        .chart-bar { display: flex; align-items: center; margin-bottom: 12px; }
        .chart-label { min-width: 120px; font-size: 13px; color: #605e5c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chart-bar-bg { flex: 1; height: 28px; background: #edebe9; border-radius: 2px; overflow: hidden; }
        .chart-bar-fill { height: 100%; background: linear-gradient(90deg,#0078d4,#106ebe); transition: width .3s; }
        .chart-value { margin-left: 12px; font-weight: 600; font-size: 13px; min-width: 40px; color: #323130; }

        /* Clickable cells */
        .clickable-cell { cursor: pointer; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'Consolas','Monaco',monospace; font-size: 12px; padding: 4px 8px; border-radius: 2px; transition: background .1s; }
        .clickable-cell:hover { background: #deecf9; color: #004e8c; }
        .error-cell { cursor: pointer; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #a4262c; padding: 2px 6px; border-radius: 2px; transition: background .1s; }
        .error-cell:hover { background: #fde7e9; }

        /* Actions */
        .actions { display: flex; gap: 6px; }

        /* Loading / empty */
        .loading { text-align: center; padding: 48px; color: #605e5c; }
        .spinner { border: 3px solid #edebe9; border-top: 3px solid #0078d4; border-radius: 50%; width: 36px; height: 36px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-state { background: #fde7e9; color: #a4262c; padding: 16px; border-radius: 4px; border-left: 3px solid #d13438; }
        .empty-state { text-align: center; padding: 40px; color: #605e5c; }
        .empty-state-icon { font-size: 40px; margin-bottom: 12px; opacity: .5; }

        /* Pagination */
        .pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 20px; }
        .pagination span { color: #605e5c; font-size: 13px; }

        code { background: #f3f2f1; padding: 2px 6px; border-radius: 2px; font-family: 'Consolas','Monaco',monospace; font-size: 12px; color: #d13438; }

        /* Toggle switch */
        .toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: #8a8886; border-radius: 10px; cursor: pointer; transition: .2s; }
        .toggle-slider:before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .2s; }
        input:checked + .toggle-slider { background: #107c10; }
        input:checked + .toggle-slider:before { transform: translateX(16px); }

        /* Modals */
        .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 200; align-items: center; justify-content: center; }
        .modal-overlay.active { display: flex; }
        .modal { background: #fff; border-radius: 4px; box-shadow: 0 25.6px 57.6px rgba(0,0,0,.22); width: 90%; max-width: 680px; max-height: 85vh; display: flex; flex-direction: column; animation: modalIn .15s ease; }
        @keyframes modalIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #edebe9; }
        .modal-title { font-size: 17px; font-weight: 600; color: #323130; }
        .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: #605e5c; padding: 4px 8px; border-radius: 2px; }
        .modal-close:hover { background: #f3f2f1; color: #201f1e; }
        .modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 24px; border-top: 1px solid #edebe9; }
        .modal-tabs { display: flex; border-bottom: 1px solid #edebe9; margin-bottom: 16px; }
        .modal-tab { background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; padding: 8px 16px; font-size: 13px; font-weight: 600; color: #605e5c; cursor: pointer; font-family: inherit; }
        .modal-tab.active { color: #0078d4; border-bottom-color: #0078d4; }
        .modal-tab-panel { display: none; }
        .modal-tab-panel.active { display: block; }
        .code-viewer { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px; font-family: 'Consolas','Monaco',monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; line-height: 1.5; max-height: 340px; overflow-y: auto; }
        .args-editor { width: 100%; min-height: 180px; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px; border: 2px solid #0078d4; font-family: 'Consolas','Monaco',monospace; font-size: 13px; line-height: 1.5; resize: vertical; }
        .args-editor:focus { outline: none; border-color: #106ebe; }
        .form-error { color: #d13438; font-size: 12px; margin-top: 6px; }
        .copy-feedback { color: #107c10; font-size: 12px; margin-right: auto; opacity: 0; transition: opacity .2s; }
        .copy-feedback.show { opacity: 1; }
        .error-viewer-label { font-size: 12px; font-weight: 600; color: #605e5c; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }

        /* Routine cron pill */
        .cron-pill { font-family: 'Consolas','Monaco',monospace; font-size: 12px; background: #f3f2f1; color: #323130; padding: 2px 8px; border-radius: 10px; display: inline-block; }
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
                </div>` : ''}
                <form method="POST" action="${options.basePath}/logout" style="display:inline">
                    <button type="submit" class="logout-btn">Sign out</button>
                </form>
            </div>
        </div>
    </div>

    <div class="container">
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Jobs</div>
                <div class="stat-value" id="stat-total">-</div>
            </div>
            <div class="stat-card success">
                <div class="stat-label">Ready</div>
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
            <div class="stat-card purple">
                <div class="stat-label">Routine Runs</div>
                <div class="stat-value" id="stat-routine-runs">-</div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('jobs')">Jobs</button>
            <button class="tab-btn" onclick="switchTab('routines')">Routines</button>
        </div>

        <!-- JOBS TAB -->
        <div class="tab-panel active" id="tab-jobs">
            <!-- Analytics -->
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
                    <select id="filter-status" onchange="resetAndLoad()">
                        <option value="all">All Jobs</option>
                        <option value="ready">Ready</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select id="filter-queue" onchange="resetAndLoad()">
                        <option value="">All Queues</option>
                    </select>
                    <select id="filter-class" onchange="resetAndLoad()">
                        <option value="">All Classes</option>
                    </select>
                    <button class="btn btn-primary" onclick="resetAndLoad()">Refresh</button>
                </div>
                <div class="bulk-bar" id="bulk-bar">
                    <span class="bulk-count" id="bulk-count">0 selected</span>
                    <button class="btn btn-success btn-small" onclick="bulkAction('retry')">Retry Selected</button>
                    <button class="btn btn-danger btn-small" onclick="bulkAction('delete')">Delete Selected</button>
                    <button class="btn btn-small" onclick="clearSelection()">Clear</button>
                </div>
                <div id="jobs-container">
                    <div class="loading"><div class="spinner"></div><p>Loading jobs…</p></div>
                </div>
            </div>

            <!-- Recent Failures -->
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">Recent Failures</h2>
                </div>
                <div id="failures-container">
                    <div class="loading"><div class="spinner"></div><p>Loading…</p></div>
                </div>
            </div>
        </div>

        <!-- ROUTINES TAB -->
        <div class="tab-panel" id="tab-routines">
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">Routines</h2>
                    <button class="btn btn-primary btn-small" onclick="loadRoutines()">Refresh</button>
                </div>
                <div id="routines-container">
                    <div class="loading"><div class="spinner"></div><p>Loading routines…</p></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Job detail modal: payload + error tabs -->
    <div class="modal-overlay" id="job-modal">
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title" id="job-modal-title">Job Details</span>
                <button class="modal-close" onclick="closeJobModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-tabs">
                    <button class="modal-tab active" onclick="switchModalTab('payload')">Payload</button>
                    <button class="modal-tab" id="modal-error-tab" onclick="switchModalTab('error')">Error</button>
                </div>
                <div class="modal-tab-panel active" id="modal-payload-panel">
                    <div id="payload-view-mode">
                        <pre class="code-viewer" id="payload-content"></pre>
                    </div>
                    <div id="payload-edit-mode" style="display:none">
                        <textarea class="args-editor" id="args-editor"></textarea>
                        <div class="form-error" id="args-error"></div>
                    </div>
                </div>
                <div class="modal-tab-panel" id="modal-error-panel">
                    <div class="error-viewer-label">Last Error</div>
                    <pre class="code-viewer" id="error-content" style="color:#f48771"></pre>
                </div>
            </div>
            <div class="modal-footer">
                <span class="copy-feedback" id="copy-feedback">Copied!</span>
                <button class="btn" id="btn-copy" onclick="copyModalContent()">Copy</button>
                <button class="btn" id="btn-edit" onclick="enterEditMode()">Edit</button>
                <button class="btn btn-primary" id="btn-save" style="display:none" onclick="saveArgs()">Save</button>
                <button class="btn" id="btn-cancel-edit" style="display:none" onclick="cancelEdit()">Cancel</button>
            </div>
        </div>
    </div>

    <script>
        const BASE = '${options.basePath}';
        const REFRESH = ${options.refreshInterval};
        let currentPage = 0;
        const PAGE_SIZE = 50;

        // modal state
        let modalJobId = null;
        let modalArgs = null;
        let modalError = null;
        let modalActiveTab = 'payload';

        // selection state
        let selectedIds = new Set();

        // ── Init ──────────────────────────────────────────────
        loadStats();
        loadQueues();
        loadJobClasses();
        loadJobs();
        setInterval(() => { loadStats(); loadJobs(); }, REFRESH);

        // ── Tab switching ────────────────────────────────────
        function switchTab(name) {
            document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', ['jobs','routines'][i] === name));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
            if (name === 'routines') loadRoutines();
        }

        // ── Stats ─────────────────────────────────────────────
        async function loadStats() {
            try {
                const s = await apiFetch(BASE + '/api/stats');
                setText('stat-total',        s.total.toLocaleString());
                setText('stat-ready',        s.ready.toLocaleString());
                setText('stat-scheduled',    s.scheduled.toLocaleString());
                setText('stat-failed',       s.failed.toLocaleString());
                setText('stat-routine-runs', (s.totalRoutineRuns || 0).toLocaleString());
                renderChart('chart-queues',   s.totalByQueue,  'queue');
                renderChart('chart-classes',  s.totalByClass,  'jobClass');
                renderFailures(s.recentFailures);
            } catch(e) { console.error(e); }
        }

        // ── Queues / Classes dropdowns ────────────────────────
        async function loadQueues() {
            try {
                const qs = await apiFetch(BASE + '/api/queues');
                const sel = document.getElementById('filter-queue');
                qs.forEach(q => { const o = new Option(q, q); sel.appendChild(o); });
            } catch(e) {}
        }
        async function loadJobClasses() {
            try {
                const cs = await apiFetch(BASE + '/api/job-classes');
                const sel = document.getElementById('filter-class');
                cs.forEach(c => { const o = new Option(c, c); sel.appendChild(o); });
            } catch(e) {}
        }

        function resetAndLoad() { currentPage = 0; clearSelection(); loadJobs(); }

        // ── Jobs ─────────────────────────────────────────────
        async function loadJobs() {
            const status   = val('filter-status');
            const queue    = val('filter-queue');
            const jobClass = val('filter-class');
            const params   = new URLSearchParams({ status, limit: PAGE_SIZE, offset: currentPage * PAGE_SIZE });
            if (queue)    params.append('queue',    queue);
            if (jobClass) params.append('jobClass', jobClass);
            try {
                const data = await apiFetch(BASE + '/api/jobs?' + params);
                renderJobs(data.jobs, data.total);
            } catch(e) {
                document.getElementById('jobs-container').innerHTML = '<div class="error-state">Failed to load jobs</div>';
            }
        }

        function renderJobs(jobs, total) {
            const el = document.getElementById('jobs-container');
            if (!jobs || !jobs.length) {
                el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No jobs found</p></div>';
                return;
            }
            const now = new Date();
            const rows = jobs.map(job => {
                const runAt    = new Date(job.runAt);
                const isFailed = job.errorCount > 0;
                const status   = isFailed ? 'failed' : (runAt <= now ? 'ready' : 'scheduled');
                const badge    = isFailed ? 'danger' : (runAt <= now ? 'success' : 'info');
                const checked  = selectedIds.has(job.id) ? 'checked' : '';
                const errorBadge = job.errorCount > 0
                    ? \`<span class="error-cell" onclick="openJobModal(\${job.id}, \${escapeAttr(JSON.stringify(job.args))}, \${escapeAttr(JSON.stringify(job.lastError || ''))}, 'error')"
                            title="\${escapeAttr(job.lastError || '')}">\${job.errorCount} error\${job.errorCount > 1 ? 's' : ''} — click to view</span>\`
                    : '<span style="color:#8a8886">—</span>';
                return \`<tr class="\${selectedIds.has(job.id) ? 'selected' : ''}">
                    <td class="col-check"><input type="checkbox" \${checked} onchange="toggleSelect(\${job.id}, this.checked)"></td>
                    <td><code>\${job.id}</code></td>
                    <td>\${escHtml(job.jobClass)}</td>
                    <td>\${escHtml(job.queue || '(default)')}</td>
                    <td>\${job.priority}</td>
                    <td><span class="badge badge-\${badge}">\${status}</span></td>
                    <td>\${fmtDate(runAt)}</td>
                    <td>\${errorBadge}</td>
                    <td class="clickable-cell" onclick="openJobModal(\${job.id}, \${escapeAttr(JSON.stringify(job.args))}, \${escapeAttr(JSON.stringify(job.lastError || ''))}, 'payload')" title="Click to view/edit">\${escHtml(JSON.stringify(job.args))}</td>
                    <td>
                        <div class="actions">
                            \${job.errorCount > 0 ? \`<button class="btn btn-success btn-small" onclick="retryJob(\${job.id})">Retry</button>\` : ''}
                            <button class="btn btn-danger btn-small" onclick="deleteJob(\${job.id})">Delete</button>
                        </div>
                    </td>
                </tr>\`;
            }).join('');

            const allChecked = jobs.every(j => selectedIds.has(j.id));
            el.innerHTML = \`
                <div class="table-container"><table>
                    <thead><tr>
                        <th class="col-check"><input type="checkbox" \${allChecked ? 'checked' : ''} onchange="toggleSelectAll(this.checked, [\${jobs.map(j=>j.id).join(',')}])"></th>
                        <th>ID</th><th>Class</th><th>Queue</th><th>Priority</th>
                        <th>Status</th><th>Run At</th><th>Errors</th><th>Payload</th><th>Actions</th>
                    </tr></thead>
                    <tbody>\${rows}</tbody>
                </table></div>
                <div class="pagination">
                    <button class="btn" onclick="prevPage()" \${currentPage === 0 ? 'disabled' : ''}>Previous</button>
                    <span>Page \${currentPage + 1} of \${Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
                    <button class="btn" onclick="nextPage()" \${(currentPage + 1) * PAGE_SIZE >= total ? 'disabled' : ''}>Next</button>
                </div>\`;
        }

        // ── Failures ─────────────────────────────────────────
        function renderFailures(failures) {
            const el = document.getElementById('failures-container');
            if (!failures || !failures.length) {
                el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>No recent failures</p></div>';
                return;
            }
            const rows = failures.map(j => \`<tr>
                <td><code>\${j.id}</code></td>
                <td>\${escHtml(j.jobClass)}</td>
                <td>\${escHtml(j.queue)}</td>
                <td><span class="badge badge-danger">\${j.errorCount}</span></td>
                <td><span class="error-cell" onclick="openErrorOnly(\${j.id}, \${escapeAttr(JSON.stringify(j.lastError))})" title="\${escapeAttr(j.lastError)}">\${escHtml(j.lastError)}</span></td>
                <td>\${fmtDate(new Date(j.runAt))}</td>
                <td><div class="actions">
                    <button class="btn btn-success btn-small" onclick="retryJob(\${j.id})">Retry</button>
                    <button class="btn btn-danger btn-small" onclick="deleteJob(\${j.id})">Delete</button>
                </div></td>
            </tr>\`).join('');
            el.innerHTML = \`<div class="table-container"><table>
                <thead><tr><th>ID</th><th>Class</th><th>Queue</th><th>Errors</th><th>Last Error</th><th>Run At</th><th>Actions</th></tr></thead>
                <tbody>\${rows}</tbody>
            </table></div>\`;
        }

        // ── Selection ────────────────────────────────────────
        function toggleSelect(id, checked) {
            if (checked) selectedIds.add(id); else selectedIds.delete(id);
            updateBulkBar();
            const row = document.querySelector(\`input[type=checkbox][onchange*="toggleSelect(\${id}"]\`);
            if (row) row.closest('tr').classList.toggle('selected', checked);
        }

        function toggleSelectAll(checked, ids) {
            ids.forEach(id => checked ? selectedIds.add(id) : selectedIds.delete(id));
            loadJobs();
        }

        function clearSelection() { selectedIds.clear(); updateBulkBar(); }

        function updateBulkBar() {
            const bar = document.getElementById('bulk-bar');
            const n   = selectedIds.size;
            bar.classList.toggle('visible', n > 0);
            document.getElementById('bulk-count').textContent = n + ' selected';
        }

        async function bulkAction(action) {
            const ids = Array.from(selectedIds);
            if (!ids.length) return;
            if (action === 'delete' && !confirm(\`Delete \${ids.length} job(s)?\`)) return;
            try {
                await apiFetch(BASE + '/api/jobs/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, jobIds: ids }) });
                clearSelection();
                loadStats();
                loadJobs();
            } catch(e) { alert('Bulk action failed'); }
        }

        // ── Single job actions ───────────────────────────────
        async function deleteJob(id) {
            if (!confirm(\`Delete job #\${id}?\`)) return;
            try {
                await apiFetch(BASE + '/api/jobs/' + id, { method: 'DELETE' });
                loadStats(); loadJobs();
            } catch(e) { alert('Failed to delete job'); }
        }

        async function retryJob(id) {
            try {
                await apiFetch(BASE + '/api/jobs/' + id + '/retry', { method: 'POST' });
                loadStats(); loadJobs();
            } catch(e) { alert('Failed to retry job'); }
        }

        // ── Routines ─────────────────────────────────────────
        async function loadRoutines() {
            const el = document.getElementById('routines-container');
            try {
                const routines = await apiFetch(BASE + '/api/routines');
                renderRoutines(routines);
            } catch(e) {
                el.innerHTML = '<div class="error-state">Failed to load routines</div>';
            }
        }

        function renderRoutines(routines) {
            const el = document.getElementById('routines-container');
            if (!routines || !routines.length) {
                el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🕐</div><p>No routines configured</p></div>';
                return;
            }
            const rows = routines.map(r => {
                const nextRun = r.nextRunAt ? fmtDate(new Date(r.nextRunAt)) : '—';
                const label   = r.name || r.jobClass;
                return \`<tr>
                    <td>\${escHtml(label)}\${r.name && r.name !== r.jobClass ? \`<br><span style="color:#605e5c;font-size:11px">\${escHtml(r.jobClass)}</span>\` : ''}</td>
                    <td><span class="cron-pill">\${escHtml(r.cronExpression)}</span></td>
                    <td><span style="font-size:12px;color:#605e5c">\${escHtml(r.timeZone)}</span></td>
                    <td><span class="badge \${r.enabled ? 'badge-success' : 'badge-neutral'}">\${r.enabled ? 'Enabled' : 'Disabled'}</span></td>
                    <td>\${nextRun}</td>
                    <td><strong>\${r.totalRuns.toLocaleString()}</strong></td>
                    <td>
                        <div class="actions">
                            <label class="toggle" title="\${r.enabled ? 'Disable' : 'Enable'}">
                                <input type="checkbox" \${r.enabled ? 'checked' : ''} onchange="toggleRoutine(\${r.id}, this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                            <button class="btn btn-danger btn-small" onclick="deleteRoutine(\${r.id}, \${escapeAttr(JSON.stringify(r.name || r.jobClass))})">Delete</button>
                        </div>
                    </td>
                </tr>\`;
            }).join('');
            el.innerHTML = \`<div class="table-container"><table>
                <thead><tr><th>Name / Job Class</th><th>Schedule</th><th>Timezone</th><th>Status</th><th>Next Run</th><th>Total Runs</th><th>Actions</th></tr></thead>
                <tbody>\${rows}</tbody>
            </table></div>\`;
        }

        async function toggleRoutine(id, enabled) {
            try {
                await apiFetch(BASE + '/api/routines/' + id + '/enabled', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ enabled })
                });
                loadRoutines();
                loadStats();
            } catch(e) { alert('Failed to update routine'); loadRoutines(); }
        }

        async function deleteRoutine(id, name) {
            if (!confirm(\`Delete routine "\${name}"?\`)) return;
            try {
                await apiFetch(BASE + '/api/routines/' + id, { method: 'DELETE' });
                loadRoutines(); loadStats();
            } catch(e) { alert('Failed to delete routine'); }
        }

        // ── Job modal ────────────────────────────────────────
        function openJobModal(jobId, args, error, startTab) {
            modalJobId    = jobId;
            modalArgs     = args;
            modalError    = error;
            modalActiveTab = startTab || 'payload';

            document.getElementById('job-modal-title').textContent = 'Job #' + jobId;
            document.getElementById('payload-content').textContent  = JSON.stringify(args, null, 2);
            document.getElementById('error-content').textContent    = error || '(no error recorded)';

            // tab state
            document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', ['payload','error'][i] === modalActiveTab));
            document.querySelectorAll('.modal-tab-panel').forEach(p => p.classList.toggle('active', p.id === 'modal-' + modalActiveTab + '-panel'));

            // footer state
            setPayloadFooter();

            document.getElementById('job-modal').classList.add('active');
        }

        function openErrorOnly(jobId, error) {
            openJobModal(jobId, [], error, 'error');
            document.getElementById('btn-edit').style.display = 'none';
        }

        function closeJobModal() {
            document.getElementById('job-modal').classList.remove('active');
            cancelEdit();
            document.getElementById('btn-edit').style.display = '';
        }

        function switchModalTab(tab) {
            modalActiveTab = tab;
            document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', ['payload','error'][i] === tab));
            document.querySelectorAll('.modal-tab-panel').forEach(p => p.classList.toggle('active', p.id === 'modal-' + tab + '-panel'));
            setPayloadFooter();
        }

        function setPayloadFooter() {
            cancelEdit();
            const isPayload = modalActiveTab === 'payload';
            document.getElementById('btn-copy').style.display  = '';
            document.getElementById('btn-edit').style.display  = isPayload ? '' : 'none';
        }

        function copyModalContent() {
            const text = modalActiveTab === 'payload'
                ? JSON.stringify(modalArgs, null, 2)
                : (modalError || '');
            navigator.clipboard.writeText(text).then(() => {
                const fb = document.getElementById('copy-feedback');
                fb.classList.add('show');
                setTimeout(() => fb.classList.remove('show'), 1500);
            });
        }

        function enterEditMode() {
            document.getElementById('payload-view-mode').style.display = 'none';
            document.getElementById('payload-edit-mode').style.display = '';
            document.getElementById('args-editor').value = JSON.stringify(modalArgs, null, 2);
            document.getElementById('btn-copy').style.display        = 'none';
            document.getElementById('btn-edit').style.display        = 'none';
            document.getElementById('btn-save').style.display        = '';
            document.getElementById('btn-cancel-edit').style.display = '';
            document.getElementById('args-error').textContent = '';
            document.getElementById('args-editor').focus();
        }

        function cancelEdit() {
            document.getElementById('payload-view-mode').style.display = '';
            document.getElementById('payload-edit-mode').style.display = 'none';
            document.getElementById('btn-copy').style.display        = '';
            document.getElementById('btn-edit').style.display        = '';
            document.getElementById('btn-save').style.display        = 'none';
            document.getElementById('btn-cancel-edit').style.display = 'none';
            document.getElementById('args-error').textContent = '';
        }

        async function saveArgs() {
            let parsed;
            try { parsed = JSON.parse(document.getElementById('args-editor').value); }
            catch(e) { document.getElementById('args-error').textContent = 'Invalid JSON: ' + e.message; return; }
            if (!Array.isArray(parsed)) { document.getElementById('args-error').textContent = 'Arguments must be a JSON array.'; return; }
            try {
                await apiFetch(BASE + '/api/jobs/' + modalJobId + '/args', {
                    method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ args: parsed })
                });
                modalArgs = parsed;
                document.getElementById('payload-content').textContent = JSON.stringify(parsed, null, 2);
                cancelEdit();
                loadJobs(); loadStats();
            } catch(e) { document.getElementById('args-error').textContent = 'Failed to update arguments.'; }
        }

        // ── Charts ───────────────────────────────────────────
        function renderChart(id, data, key) {
            const el = document.getElementById(id);
            if (!data || !data.length) { el.innerHTML = '<div class="empty-state">No data</div>'; return; }
            const max = Math.max(...data.map(d => d.count));
            el.innerHTML = data.slice(0, 10).map(item => \`
                <div class="chart-bar">
                    <div class="chart-label">\${escHtml(item[key] || '(default)')}</div>
                    <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:\${(item.count/max)*100}%"></div></div>
                    <div class="chart-value">\${item.count}</div>
                </div>\`).join('');
        }

        // ── Pagination ───────────────────────────────────────
        function nextPage() { currentPage++; loadJobs(); }
        function prevPage() { if (currentPage > 0) { currentPage--; loadJobs(); } }

        // ── Helpers ──────────────────────────────────────────
        function val(id) { return document.getElementById(id).value; }
        function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

        function fmtDate(d) {
            const diff = Date.now() - d;
            const s = Math.floor(diff / 1000), m = Math.floor(s/60), h = Math.floor(m/60), days = Math.floor(h/24);
            if (diff < 0) {
                const fs = Math.floor(-diff/1000), fm = Math.floor(fs/60), fh = Math.floor(fm/60), fd = Math.floor(fh/24);
                if (fd > 0) return 'in ' + fd + 'd';
                if (fh > 0) return 'in ' + fh + 'h';
                if (fm > 0) return 'in ' + fm + 'm';
                return 'in ' + fs + 's';
            }
            if (days > 0) return days + 'd ago';
            if (h > 0)    return h + 'h ago';
            if (m > 0)    return m + 'm ago';
            if (s > 0)    return s + 's ago';
            return 'just now';
        }

        function escHtml(t) {
            const d = document.createElement('div');
            d.textContent = String(t ?? '');
            return d.innerHTML;
        }

        function escapeAttr(t) {
            return String(t ?? '').replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        async function apiFetch(url, opts) {
            const r = await fetch(url, opts);
            if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || r.statusText); }
            return r.json();
        }

        // ── Close modal on backdrop / Escape ─────────────────
        document.getElementById('job-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeJobModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeJobModal(); });
    </script>
</body>
</html>`.trim();
}
