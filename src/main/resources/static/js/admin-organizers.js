const ADMIN_API_URL = 'http://localhost:8080';
function adminToken() {
    return localStorage.getItem('jwt_token');
}
function adminHeaders(extra = {}) {
    return {
        Authorization: `Bearer ${adminToken()}`,
        ...extra
    };
}
document.addEventListener('DOMContentLoaded', () => {
    initAdminOrganizerPage();
});
async function initAdminOrganizerPage() {
    const container = document.getElementById('admin-organizers-container');
    if (!container) return;
    if (!adminToken()) {
        window.location.href = '/login';
        return;
    }
    try {
        const meResponse = await fetch('/api/auth/me', { headers: adminHeaders() });
        if (!meResponse.ok) {
            throw new Error('Could not load user profile');
        }
        const me = await meResponse.json();
        if (me.role !== 'ADMIN') {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Admin access required</h3>
                    <p>Only administrators can manage organizer accounts.</p>
                </div>
            `;
            return;
        }
        renderAdminOrganizerShell();
        attachAdminOrganizerHandlers();
        await refreshAdminOrganizerData();
    } catch (error) {
        console.error('Admin organizer page init error:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load admin panel</h3>
                <p>Please try again after refreshing the page.</p>
            </div>
        `;
    }
}
function renderAdminOrganizerShell() {
    const container = document.getElementById('admin-organizers-container');
    container.innerHTML = `
        <div class="dashboard-grid">
            <section class="dashboard-card">
                <h3>Create Organizer Account</h3>
                <p class="dashboard-muted">You can add new organizers beyond the default OSUT, BEST, GDG, SOLIS, and ARTTU accounts.</p>
                <form id="create-organizer-form" class="dashboard-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="organizer-first-name">First Name</label>
                            <input id="organizer-first-name" type="text" required />
                        </div>
                        <div class="form-group">
                            <label for="organizer-last-name">Last Name</label>
                            <input id="organizer-last-name" type="text" required />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="organizer-email">Email</label>
                        <input id="organizer-email" type="email" required placeholder="team@utcn.ro" />
                    </div>
                    <div class="form-group">
                        <label for="organizer-password">Temporary Password</label>
                        <input id="organizer-password" type="password" required placeholder="Use a strong password" />
                    </div>
                    <div id="admin-organizer-error" class="error" style="display:none;"></div>
                    <div id="admin-organizer-success" class="success" style="display:none;"></div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Create Organizer</button>
                    </div>
                </form>
            </section>
            <section class="dashboard-card">
                <h3>Account Overview</h3>
                <div id="admin-summary" class="dashboard-list loading">Loading user summary.</div>
                <h3 style="margin-top: 1rem;">Organizers</h3>
                <div id="organizers-table-container" class="dashboard-list loading">Loading organizers.</div>
            </section>
        </div>
    `;
}
function attachAdminOrganizerHandlers() {
    const form = document.getElementById('create-organizer-form');
    form?.addEventListener('submit', handleCreateOrganizer);
    injectAdminOrganizerUX();
}
function injectAdminOrganizerUX() {
    const emailInput = document.getElementById('organizer-email');
    if (emailInput) {
        const hint = document.createElement('span');
        hint.className = 'input-hint';
        hint.textContent = 'Use the organizer team email, e.g. team@utcn.ro';
        emailInput.parentNode.appendChild(hint);
    }
    adminWrapToggle('organizer-password');
    const pwInput = document.getElementById('organizer-password');
    if (pwInput) {
        const rules = [
            { key: 'length',  label: 'At least 8 characters',                  test: p => p.length >= 8 },
            { key: 'upper',   label: 'Uppercase letter (A–Z)',                  test: p => /[A-Z]/.test(p) },
            { key: 'lower',   label: 'Lowercase letter (a–z)',                  test: p => /[a-z]/.test(p) },
            { key: 'special', label: 'Digit or special character',              test: p => /[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
        ];
        const box = document.createElement('div');
        box.className = 'pw-requirements';
        box.innerHTML = `<p class="pw-req-title">Password requirements</p><ul>${rules.map(r => `<li class="pw-req-item" id="aorg-rule-${r.key}">${r.label}</li>`).join('')}</ul>`;
        pwInput.closest('.form-group').appendChild(box);
        pwInput.addEventListener('input', () => {
            rules.forEach(r => {
                const el = document.getElementById(`aorg-rule-${r.key}`);
                if (el) el.classList.toggle('met', r.test(pwInput.value));
            });
        });
    }
}
function adminWrapToggle(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const wrap = document.createElement('div');
    wrap.className = 'pw-input-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-toggle';
    btn.textContent = 'Show';
    btn.addEventListener('click', () => {
        const isText = input.type === 'text';
        input.type = isText ? 'password' : 'text';
        btn.textContent = isText ? 'Show' : 'Hide';
    });
    wrap.appendChild(btn);
}
async function handleCreateOrganizer(event) {
    event.preventDefault();
    const errorDiv = document.getElementById('admin-organizer-error');
    const successDiv = document.getElementById('admin-organizer-success');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    const payload = {
        firstName: document.getElementById('organizer-first-name').value.trim(),
        lastName: document.getElementById('organizer-last-name').value.trim(),
        email: document.getElementById('organizer-email').value.trim(),
        password: document.getElementById('organizer-password').value
    };
    try {
        const response = await fetch(`${ADMIN_API_URL}/api/users/organizers`, {
            method: 'POST',
            headers: adminHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to create organizer account');
        }
        successDiv.textContent = 'Organizer account created successfully.';
        successDiv.style.display = 'block';
        document.getElementById('create-organizer-form').reset();
        await refreshAdminOrganizerData();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}
async function refreshAdminOrganizerData() {
    const [allUsersResponse, organizersResponse] = await Promise.all([
        fetch(`${ADMIN_API_URL}/api/users`, { headers: adminHeaders() }),
        fetch(`${ADMIN_API_URL}/api/users/ORGANIZER`, { headers: adminHeaders() })
    ]);
    const allUsers = allUsersResponse.ok ? await allUsersResponse.json() : { students: [], organizers: [], admins: [] };
    const organizers = organizersResponse.ok ? await organizersResponse.json() : [];
    renderAdminSummary(allUsers);
    renderOrganizersTable(organizers);
}
function renderAdminSummary(allUsers) {
    const summary = document.getElementById('admin-summary');
    summary.className = 'dashboard-list';
    summary.innerHTML = `
        <div class="manage-summary-grid">
            <div class="manage-summary-card"><strong>${allUsers.students?.length || 0}</strong><span>Students</span></div>
            <div class="manage-summary-card"><strong>${allUsers.organizers?.length || 0}</strong><span>Organizers</span></div>
            <div class="manage-summary-card"><strong>${allUsers.admins?.length || 0}</strong><span>Admins</span></div>
            <div class="manage-summary-card"><strong>${(allUsers.students?.length || 0) + (allUsers.organizers?.length || 0) + (allUsers.admins?.length || 0)}</strong><span>Total Users</span></div>
        </div>
    `;
}
function renderOrganizersTable(organizers) {
    const container = document.getElementById('organizers-table-container');
    container.className = 'dashboard-list';
    if (!organizers.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No organizers found</h3>
                <p>Create an organizer account to get started.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = `
        <div class="table-wrap">
            <table class="dashboard-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    ${organizers.map(organizer => `
                        <tr>
                            <td>${organizer.id}</td>
                            <td>${escapeHtml(`${organizer.firstName} ${organizer.lastName}`)}</td>
                            <td>${escapeHtml(organizer.email)}</td>
                            <td><span class="badge badge-organizer">${escapeHtml(organizer.role)}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
