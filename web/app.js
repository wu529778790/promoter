/**
 * Promoter - Frontend Logic
 */

// ============================================================
// State
// ============================================================

let setupStatus = { github_token: false, smtp: false, product: false };
let isAuthorized = false;

// ============================================================
// Navigation
// ============================================================

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage(item.dataset.page);
  });
});

function switchPage(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');

  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'config': loadConfigPage(); break;
    case 'logs': loadLogs(); break;
    case 'send': loadSendStatus(); break;
  }
}

// ============================================================
// Toast
// ============================================================

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ============================================================
// Status
// ============================================================

function showStatus(elementId, msg, type = 'info') {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = msg;
    el.className = `status-msg show ${type}`;
  }
}

// ============================================================
// API
// ============================================================

async function api(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    // Handle auth errors globally
    if (res.status === 401 || res.status === 403) {
      if (res.status === 401) {
        showLoginScreen();
      } else {
        showToast('无权访问本系统', 'error');
      }
      return { ok: false, error: data.error || '未授权' };
    }
    return data;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// ============================================================
// Auth
// ============================================================

function showLoginScreen() {
  isAuthorized = false;
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}

function githubLogin() {
  const w = 500, h = 600;
  const left = (screen.width - w) / 2;
  const top = (screen.height - h) / 2;
  window.open('/auth/github', 'github-oauth', `width=${w},height=${h},left=${left},top=${top}`);
}

window.addEventListener('message', (e) => {
  if (e.data?.type === 'github-login-ok') {
    checkAuth();
  }
});

async function checkAuth() {
  const result = await api('/api/auth/github/status');
  if (!result.ok) return;
  const d = result.data;

  isAuthorized = d.loggedIn && d.authorized;

  if (isAuthorized) {
    showApp();
    loadDashboard();
    renderUser(d);
  } else if (d.loggedIn && !d.authorized) {
    // Logged in but not authorized - show message on login screen
    const content = document.getElementById('login-content');
    content.innerHTML = `
      <div style="margin-bottom:16px;">
        <img src="${d.avatar}" style="width:48px;height:48px;border-radius:50%;border:2px solid var(--border);margin-bottom:12px;">
        <div style="color:var(--text-0);font-weight:500;margin-bottom:4px;">${d.login}</div>
        <div style="color:var(--danger);font-size:13px;">无权访问本系统</div>
      </div>
      <button class="btn btn-ghost" onclick="githubLogout()">退出</button>
    `;
  } else {
    showLoginScreen();
  }
}

function renderUser(d) {
  const area = document.getElementById('user-area');
  if (!area) return;
  area.innerHTML = `
    <div class="user-info">
      <img src="${d.avatar}" class="user-avatar" alt="${d.login}">
      <span class="user-name">${d.login}</span>
      <button class="btn btn-ghost btn-sm" onclick="githubLogout()" title="退出">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
      </button>
    </div>
  `;
}

async function githubLogout() {
  await api('/api/auth/github/logout', { method: 'POST' });
  isAuthorized = false;
  showLoginScreen();
}

// ============================================================
// Dashboard
// ============================================================

async function loadDashboard() {
  const result = await api('/api/status');
  if (!result.ok) return;
  const d = result.data;

  document.getElementById('email-count').textContent = d.emailCount?.toLocaleString() ?? '-';
  document.getElementById('sender-count').textContent = d.senders.length;
  document.getElementById('combo-count').textContent = d.combinationCount?.toLocaleString() ?? '-';
  document.getElementById('product-name').textContent = d.product?.product_name || '-';

  // Source stats
  const sourceEl = document.getElementById('source-stats');
  const stats = d.productStats || {};
  if (Object.keys(stats).length === 0) {
    sourceEl.innerHTML = '<span class="text-muted" style="font-size:13px;">暂无数据</span>';
  } else {
    const icons = {
      stargazer: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'issue-author': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
      'issue-commenter': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      'pr-author': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/></svg>',
      'pr-reviewer': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
      forker: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>',
    };
    sourceEl.innerHTML = Object.entries(stats).map(([type, count]) =>
      `<div class="source-item">${icons[type] || ''} <span>${type}</span> <span class="source-count">${count}</span></div>`
    ).join('');
  }

  // Sender list
  const senderEl = document.getElementById('sender-list');
  if (d.senders.length === 0) {
    senderEl.innerHTML = '<span class="text-muted" style="font-size:13px;">暂无发件人</span>';
  } else {
    senderEl.innerHTML = d.senders.map(s =>
      `<div class="sender-item">
        <div class="sender-info">
          <span style="font-weight:500;">${s.name || s.email}</span>
          <span class="sender-email">${s.email}</span>
        </div>
        <span class="sender-status ${s.status}">${s.status === 'active' ? '活跃' : '禁用'}</span>
      </div>`
    ).join('');
  }
}

// ============================================================
// Quick Actions
// ============================================================

async function quickCollect() {
  if (!isAuthorized) { showToast('请先登录', 'error'); return; }
  if (!confirm('确认开始采集邮箱？')) return;
  showToast('采集已启动...');
  const result = await api('/api/collect', { method: 'POST', body: '{}' });
  showToast(result.ok ? '采集完成' : `采集失败: ${result.error}`, result.ok ? 'success' : 'error');
}

async function quickSend() {
  if (!isAuthorized) { showToast('请先登录', 'error'); return; }
  if (!confirm('确认开始发送邮件？')) return;
  showToast('发送已启动...');
  const result = await api('/api/send', {
    method: 'POST',
    body: JSON.stringify({ dryRun: false }),
  });
  showToast(result.ok ? result.message : `发送失败: ${result.error}`, result.ok ? 'success' : 'error');
}

async function testSmtp() {
  if (!isAuthorized) { showToast('请先登录', 'error'); return; }
  showToast('正在测试连接...');
  const result = await api('/api/test-smtp', { method: 'POST' });
  if (result.ok) {
    const allOk = result.data.every(r => r.success);
    showToast(allOk ? '所有连接成功' : '部分连接失败', allOk ? 'success' : 'error');
    const msgs = result.data.map(r => `${r.name}: ${r.success ? 'OK' : 'FAIL - ' + r.message}`).join('\n');
    alert(msgs);
  } else {
    showToast(`测试失败: ${result.error}`, 'error');
  }
}

// ============================================================
// Collect
// ============================================================

async function startCollect() {
  if (!isAuthorized) { showToast('请先登录', 'error'); return; }
  const repo = document.getElementById('collect-repo').value.trim();
  if (!repo) {
    showStatus('collect-status', '请输入仓库链接', 'error');
    return;
  }
  showStatus('collect-status', '采集中...', 'info');
  const result = await api('/api/collect', {
    method: 'POST',
    body: JSON.stringify({ repo }),
  });
  showStatus('collect-status', result.ok ? '采集完成' : result.error, result.ok ? 'success' : 'error');
}

async function startCollectConfig() {
  if (!isAuthorized) { showToast('请先登录', 'error'); return; }
  showStatus('collect-status', '采集中...', 'info');
  const result = await api('/api/collect', { method: 'POST', body: '{}' });
  showStatus('collect-status', result.ok ? '采集完成' : result.error, result.ok ? 'success' : 'error');
}

// ============================================================
// Send
// ============================================================

async function startSend() {
  if (!isAuthorized) { showToast('请先登录', 'error'); return; }
  const limit = parseInt(document.getElementById('send-limit').value) || 0;
  const dryRun = document.getElementById('send-dryrun').checked;

  if (!dryRun && !confirm('确认开始发送邮件？')) return;

  showStatus('send-status', dryRun ? '模拟发送中...' : '发送中...', 'info');
  const result = await api('/api/send', {
    method: 'POST',
    body: JSON.stringify({ dryRun, limit: limit || undefined }),
  });
  showStatus('send-status', result.ok ? result.message : result.error, result.ok ? 'success' : 'error');
}

async function loadSendStatus() {
  const result = await api('/api/send-status');
  if (!result.ok) return;
  const d = result.data;

  document.getElementById('send-progress').innerHTML = `
    <div>采集邮箱: <strong>${d.emailCount}</strong></div>
    <div>采集中: <strong style="color:${d.isCollecting ? 'var(--warning)' : 'var(--text-3)'}">${d.isCollecting ? '是' : '否'}</strong></div>
    <div>发送中: <strong style="color:${d.isSending ? 'var(--warning)' : 'var(--text-3)'}">${d.isSending ? '是' : '否'}</strong></div>
  `;
}

// ============================================================
// Config
// ============================================================

async function loadConfigPage() {
  const result = await api('/api/env');
  const editor = document.getElementById('config-editor');
  if (result.ok && result.data) {
    editor.value = result.data;
  } else if (result.ok) {
    editor.value = '# .env 文件不存在\n# 点击保存将创建默认配置\n';
  } else {
    editor.value = `# 错误: ${result.error}`;
  }
}

async function saveConfig() {
  const content = document.getElementById('config-editor').value;
  const result = await api('/api/env', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  showStatus('config-status', result.ok ? '配置已保存' : result.error, result.ok ? 'success' : 'error');
}

// ============================================================
// Logs
// ============================================================

let logTimer = null;

async function loadLogs() {
  const result = await api('/api/logs');
  const el = document.getElementById('log-content');
  if (!result.ok) { el.textContent = `错误: ${result.error}`; return; }

  if (result.data.length === 0) {
    el.innerHTML = '<span style="color:var(--text-3)">暂无日志</span>';
    return;
  }

  el.innerHTML = result.data.map(line => {
    let cls = '';
    if (line.includes('ERROR')) cls = 'error';
    else if (line.includes('WARN')) cls = 'warn';
    return `<div class="log-line ${cls}">${escapeHtml(line)}</div>`;
  }).join('');

  el.scrollTop = el.scrollHeight;
}

function toggleLogAutoRefresh() {
  if (document.getElementById('log-autorefresh').checked) {
    logTimer = setInterval(loadLogs, 5000);
  } else {
    clearInterval(logTimer);
    logTimer = null;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// Init
// ============================================================

checkAuth();
