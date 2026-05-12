/* ──────────────────────────────────────────────
   Admin Dashboard  –  admin-dashboard.js
   ────────────────────────────────────────────── */

const DASH_API = 'http://localhost:8080';

function dashToken() { return localStorage.getItem('jwt_token'); }
function dashHeaders() { return { Authorization: `Bearer ${dashToken()}` }; }

document.addEventListener('DOMContentLoaded', () => { initDashboard(); });

/* ─── Bootstrap ─────────────────────────────── */
async function initDashboard() {
    const root = document.getElementById('admin-dashboard-container');
    if (!root) return;

    if (!dashToken()) { window.location.href = '/login'; return; }

    try {
        const me = await apiFetch('/api/auth/me');
        if (me.role !== 'ADMIN') {
            root.innerHTML = errorState('Acces interzis', 'Numai administratorii pot accesa dashboard-ul.');
            return;
        }
        root.innerHTML = skeletonHTML();
        await loadAll(me);
    } catch (e) {
        root.innerHTML = errorState('Eroare la încărcare', e.message || 'Încearcă să reîncarci pagina.');
    }
}

async function loadAll(me) {
    const [stats, events, users] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/events'),
        apiFetch('/api/users'),
    ]);

    renderGreeting(me);
    renderStatCards(stats);
    renderCharts(stats, events);
    renderQuickActions();
    renderRecentEvents(events);
    renderUsersTable(users);
}

/* ─── API helper ─────────────────────────────── */
async function apiFetch(path) {
    const res = await fetch(`${DASH_API}${path}`, { headers: dashHeaders() });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return res.json();
}

/* ─── Skeleton while loading ─────────────────── */
function skeletonHTML() {
    return `
      <div id="dash-greeting"></div>
      <div id="dash-stat-cards" class="dash-stat-grid">
        ${[1,2,3,4].map(() => `<div class="dash-stat-card skeleton"></div>`).join('')}
      </div>
      <div id="dash-charts-row" class="dash-charts-row"></div>
      <div id="dash-quick-actions"></div>
      <div id="dash-tables-row" class="dash-tables-row"></div>
    `;
}

/* ─── Greeting ───────────────────────────────── */
function renderGreeting(me) {
    const el = document.getElementById('dash-greeting');
    if (!el) return;
    const hour = new Date().getHours();
    const salut = hour < 12 ? 'Bună dimineața' : hour < 18 ? 'Bună ziua' : 'Bună seara';
    el.innerHTML = `
      <div class="dash-greeting">
        <div>
          <h2 class="dash-greeting-title">${salut}, ${me.firstName}! 👋</h2>
          <p class="dash-greeting-sub">Iată un rezumat al activității platformei UTCN Events.</p>
        </div>
        <span class="badge badge-admin">Administrator</span>
      </div>`;
}

/* ─── Stat Cards ─────────────────────────────── */
function renderStatCards(stats) {
    const el = document.getElementById('dash-stat-cards');
    if (!el) return;

    const cards = [
        {
            icon: '👥', label: 'Utilizatori totali', value: stats.users.total,
            sub: `${stats.users.students} studenți · ${stats.users.organizers} organizatori`,
            color: 'blue'
        },
        {
            icon: '📅', label: 'Evenimente', value: stats.events.total,
            sub: `${stats.events.upcoming} viitoare`,
            color: 'green'
        },
        {
            icon: '✅', label: 'Înscrieri totale', value: stats.registrations.total,
            sub: `${stats.registrations.registered} active · ${stats.registrations.attended} participated`,
            color: 'purple'
        },
        {
            icon: '🗂️', label: 'Taxonomie', value: stats.taxonomy.categories + stats.taxonomy.departments,
            sub: `${stats.taxonomy.categories} categorii · ${stats.taxonomy.departments} departamente`,
            color: 'orange'
        },
    ];

    el.innerHTML = cards.map(c => `
      <div class="dash-stat-card dash-stat-${c.color}">
        <div class="dash-stat-icon">${c.icon}</div>
        <div class="dash-stat-body">
          <div class="dash-stat-value">${c.value}</div>
          <div class="dash-stat-label">${c.label}</div>
          <div class="dash-stat-sub">${c.sub}</div>
        </div>
      </div>`).join('');
}

/* ─── Charts ─────────────────────────────────── */
function renderCharts(stats, events) {
    const el = document.getElementById('dash-charts-row');
    if (!el) return;

    el.innerHTML = `
      <div class="dash-chart-card">
        <h3 class="dash-chart-title">📊 Utilizatori după rol</h3>
        ${barChart([
            { label: 'Studenți',      value: stats.users.students,   color: '#3b82f6' },
            { label: 'Organizatori',  value: stats.users.organizers, color: '#8b5cf6' },
            { label: 'Admini',        value: stats.users.admins,     color: '#f59e0b' },
        ], Math.max(stats.users.total, 1))}
      </div>
      <div class="dash-chart-card">
        <h3 class="dash-chart-title">📋 Înscrieri după status</h3>
        ${barChart([
            { label: 'Înscris',   value: stats.registrations.registered, color: '#10b981' },
            { label: 'Participat',value: stats.registrations.attended,   color: '#3b82f6' },
            { label: 'Anulat',    value: stats.registrations.cancelled,  color: '#ef4444' },
            { label: 'Absent',    value: stats.registrations.noShow,     color: '#6b7280' },
        ], Math.max(stats.registrations.total, 1))}
      </div>
      <div class="dash-chart-card">
        <h3 class="dash-chart-title">🏷️ Evenimente după categorie</h3>
        ${categoryChart(stats.events.byCategory)}
      </div>`;
}

function barChart(rows, total) {
    if (rows.every(r => r.value === 0)) {
        return `<p class="dash-chart-empty">Nicio dată disponibilă.</p>`;
    }
    return `<div class="dash-bar-list">` +
        rows.map(r => {
            const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
            return `
              <div class="dash-bar-row">
                <span class="dash-bar-label">${r.label}</span>
                <div class="dash-bar-track">
                  <div class="dash-bar-fill" style="width:${pct}%;background:${r.color}"></div>
                </div>
                <span class="dash-bar-count">${r.value}</span>
              </div>`;
        }).join('') + `</div>`;
}

function categoryChart(byCategory) {
    const entries = Object.entries(byCategory || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!entries.length) return `<p class="dash-chart-empty">Nicio dată disponibilă.</p>`;

    const maxVal = entries[0][1] || 1;
    const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];
    return `<div class="dash-bar-list">` +
        entries.map(([cat, count], i) => {
            const pct = Math.round((count / maxVal) * 100);
            return `
              <div class="dash-bar-row">
                <span class="dash-bar-label">${cat}</span>
                <div class="dash-bar-track">
                  <div class="dash-bar-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
                </div>
                <span class="dash-bar-count">${count}</span>
              </div>`;
        }).join('') + `</div>`;
}

/* ─── Quick Actions ──────────────────────────── */
function renderQuickActions() {
    const el = document.getElementById('dash-quick-actions');
    if (!el) return;

    const actions = [
        { icon: '➕', label: 'Adaugă Organizator',  href: '/admin-organizers' },
        { icon: '🗂️', label: 'Gestionează Taxonomie', href: '/admin-taxonomy' },
        { icon: '📅', label: 'Vezi Evenimente',       href: '/events' },
        { icon: '👤', label: 'Profil Admin',           href: '/profile' },
    ];

    el.innerHTML = `
      <h3 class="dash-section-title">⚡ Acțiuni rapide</h3>
      <div class="dash-quick-grid">
        ${actions.map(a => `
          <a href="${a.href}" class="dash-quick-btn">
            <span class="dash-quick-icon">${a.icon}</span>
            <span>${a.label}</span>
          </a>`).join('')}
      </div>`;
}

/* ─── Tables ─────────────────────────────────── */
function renderRecentEvents(events) {
    const el = document.getElementById('dash-tables-row');
    if (!el) return;

    const recent = [...(events || [])]
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 8);

    const tableHTML = recent.length
        ? `<table class="dash-table">
             <thead><tr><th>Titlu</th><th>Dată</th><th>Categorie</th><th>Departament</th><th>Organizator</th></tr></thead>
             <tbody>${recent.map(e => `
               <tr>
                 <td><strong>${escHtml(e.title)}</strong></td>
                 <td>${escHtml(e.date || '-')}</td>
                 <td><span class="badge">${escHtml(e.category || '-')}</span></td>
                 <td>${escHtml(e.department || '-')}</td>
                 <td>${escHtml(e.organizerName || '-')}</td>
               </tr>`).join('')}</tbody>
           </table>`
        : `<p class="dash-chart-empty">Nu există evenimente.</p>`;

    el.innerHTML = `
      <div class="dash-table-card">
        <div class="dash-table-header">
          <h3 class="dash-chart-title">📅 Evenimente recente</h3>
          <a href="/events" class="dash-link">Vezi toate →</a>
        </div>
        ${tableHTML}
      </div>
      <div id="dash-users-card" class="dash-table-card"></div>`;
}

function renderUsersTable(users) {
    const el = document.getElementById('dash-users-card');
    if (!el) return;

    const allUsers = [
        ...(users.organizers || []),
        ...(users.students || []),
        ...(users.admins || []),
    ].slice(0, 8);

    const roleColor = { STUDENT: 'badge-student', ORGANIZER: 'badge-organizer', ADMIN: 'badge-admin' };

    const tableHTML = allUsers.length
        ? `<table class="dash-table">
             <thead><tr><th>Nume</th><th>Email</th><th>Rol</th></tr></thead>
             <tbody>${allUsers.map(u => `
               <tr>
                 <td><strong>${escHtml(u.firstName)} ${escHtml(u.lastName)}</strong></td>
                 <td>${escHtml(u.email)}</td>
                 <td><span class="badge ${roleColor[u.role] || ''}">${u.role}</span></td>
               </tr>`).join('')}</tbody>
           </table>`
        : `<p class="dash-chart-empty">Nu există utilizatori.</p>`;

    el.innerHTML = `
      <div class="dash-table-header">
        <h3 class="dash-chart-title">👥 Utilizatori recenți</h3>
        <a href="/admin-organizers" class="dash-link">Gestionează →</a>
      </div>
      ${tableHTML}`;
}

/* ─── Helpers ────────────────────────────────── */
function escHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function errorState(title, msg) {
    return `<div class="empty-state"><h3>${escHtml(title)}</h3><p>${escHtml(msg)}</p></div>`;
}
