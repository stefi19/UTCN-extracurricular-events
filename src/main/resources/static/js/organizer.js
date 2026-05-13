const ORGANIZER_API = 'http://localhost:8080';
let organizerCurrentUser = null;
let organizerEvents = [];
let organizerCategories = [];
let organizerDepartments = [];
let selectedEventId = null;
let eventParticipants = [];
let participantSearchTerm = '';
let participantStatusFilter = 'ALL';
let participantSortOrder = 'NEWEST';
function organizerToken() {
    return localStorage.getItem('jwt_token');
}
function organizerAuthHeaders(extra = {}) {
    return {
        Authorization: `Bearer ${organizerToken()}`,
        ...extra
    };
}
document.addEventListener('DOMContentLoaded', () => {
    initOrganizerPanel();
});
async function initOrganizerPanel() {
    const container = document.getElementById('organizer-panel-container');
    if (!container) return;
    if (!organizerToken()) {
        window.location.href = '/login';
        return;
    }
    try {
        const meResponse = await fetch('/api/auth/me', {
            headers: organizerAuthHeaders()
        });
        if (!meResponse.ok) {
            throw new Error('Could not verify organizer session');
        }
        organizerCurrentUser = await meResponse.json();
        if (!['ORGANIZER', 'ADMIN'].includes(organizerCurrentUser.role)) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Access restricted</h3>
                    <p>This page is available only for organizer and admin accounts.</p>
                </div>
            `;
            return;
        }
        renderOrganizerShell();
        await Promise.all([
            fetchOrganizerLookups(),
            fetchOrganizerEvents()
        ]);
        attachOrganizerHandlers();
        renderOrganizerData();
    } catch (error) {
        console.error('Organizer panel init failed:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Could not load organizer panel</h3>
                <p>Please refresh the page or sign in again.</p>
            </div>
        `;
    }
}
function renderOrganizerShell() {
    const container = document.getElementById('organizer-panel-container');
    container.innerHTML = `
        <div class="dashboard-grid">
            <section class="dashboard-card">
                <h3 id="organizer-form-title">Create Event</h3>
                <p class="dashboard-muted">Fill in event details and publish directly to the events catalog.</p>
                <form id="organizer-event-form" class="dashboard-form">
                    <input type="hidden" id="event-id" />
                    <div class="form-group">
                        <label for="event-title">Title</label>
                        <input id="event-title" type="text" required maxlength="255" />
                    </div>
                    <div class="form-group">
                        <label for="event-description">Description</label>
                        <textarea id="event-description" rows="4" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="event-date">Date</label>
                            <input id="event-date" type="text" placeholder="2026-06-15 14:00" required />
                        </div>
                        <div class="form-group">
                            <label for="event-max-participants">Max participants</label>
                            <input id="event-max-participants" type="number" min="1" placeholder="Optional" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="event-category">Category</label>
                            <select id="event-category" required></select>
                        </div>
                        <div class="form-group">
                            <label for="event-department">Department</label>
                            <select id="event-department" required></select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="event-location">Location</label>
                        <input id="event-location" type="text" maxlength="255" placeholder="Optional" />
                    </div>
                    <div id="organizer-form-error" class="error" style="display:none;"></div>
                    <div id="organizer-form-success" class="success" style="display:none;"></div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Save Event</button>
                        <button type="button" id="organizer-form-reset" class="btn-secondary">Clear</button>
                    </div>
                </form>
            </section>
            <section class="dashboard-card">
                <h3>Event Management</h3>
                <p class="dashboard-muted">Review your events, edit details, and manage participant statuses.</p>
                <div id="organizer-events-list" class="dashboard-list loading">Loading events.</div>
            </section>
        </div>
        <section id="participants-section" class="dashboard-card" style="margin-top: 1rem; display: none;">
            <h3 id="participants-title">Participants</h3>
            <p class="dashboard-muted">Search by name or email, review attendance history, and update statuses quickly.</p>
            <div id="participants-list" class="dashboard-list"></div>
        </section>
    `;
}
async function fetchOrganizerLookups() {
    const [categoriesResponse, departmentsResponse] = await Promise.all([
        fetch(`${ORGANIZER_API}/api/categories`, { headers: organizerAuthHeaders() }),
        fetch(`${ORGANIZER_API}/api/departments`, { headers: organizerAuthHeaders() })
    ]);
    organizerCategories = categoriesResponse.ok ? await categoriesResponse.json() : [];
    organizerDepartments = departmentsResponse.ok ? await departmentsResponse.json() : [];
    if (organizerCategories.length === 0) {
        organizerCategories = [{ id: null, name: 'Workshop' }, { id: null, name: 'Seminar' }, { id: null, name: 'Conference' }];
    }
    if (organizerDepartments.length === 0) {
        organizerDepartments = [{ id: null, name: 'Computer Science' }, { id: null, name: 'Automation' }];
    }
}
async function fetchOrganizerEvents() {
    const response = await fetch(`${ORGANIZER_API}/api/events`, { headers: organizerAuthHeaders() });
    if (!response.ok) {
        throw new Error('Failed to load events');
    }
    const allEvents = await response.json();
    if (organizerCurrentUser.role === 'ADMIN') {
        organizerEvents = allEvents;
        return;
    }
    organizerEvents = allEvents.filter(event => event.organizerId === organizerCurrentUser.id);
}
function attachOrganizerHandlers() {
    const form = document.getElementById('organizer-event-form');
    const resetBtn = document.getElementById('organizer-form-reset');
    form?.addEventListener('submit', handleOrganizerEventSubmit);
    resetBtn?.addEventListener('click', resetOrganizerForm);
    injectOrganizerFormUX();
}
function injectOrganizerFormUX() {
    const dateInput = document.getElementById('event-date');
    if (dateInput) {
        const hint = document.createElement('span');
        hint.className = 'input-hint';
        hint.textContent = 'Format: YYYY-MM-DD HH:MM — e.g. 2026-06-15 14:00';
        dateInput.parentNode.appendChild(hint);
    }
    const maxPart = document.getElementById('event-max-participants');
    if (maxPart) {
        const hint = document.createElement('span');
        hint.className = 'input-hint';
        hint.textContent = 'Leave empty for unlimited registrations.';
        maxPart.parentNode.appendChild(hint);
    }
    attachCharCounter('event-title', 255);
    attachCharCounter('event-description', 2000);
    attachCharCounter('event-location', 255);
}
function attachCharCounter(inputId, maxLen) {
    const el = document.getElementById(inputId);
    if (!el) return;
    const counter = document.createElement('span');
    counter.className = 'char-counter';
    const update = () => {
        const remaining = maxLen - el.value.length;
        counter.textContent = `${el.value.length} / ${maxLen}`;
        counter.className = 'char-counter' + (remaining < 20 ? ' warn' : '') + (remaining < 0 ? ' over' : '');
    };
    el.addEventListener('input', update);
    el.parentNode.appendChild(counter);
    update();
}
function renderOrganizerData() {
    renderOrganizerSelects();
    renderOrganizerEventCards();
}
function renderOrganizerSelects() {
    const categorySelect = document.getElementById('event-category');
    const departmentSelect = document.getElementById('event-department');
    categorySelect.innerHTML = organizerCategories
        .map(category => `<option value="${escapeHtml(String(category.name))}">${escapeHtml(category.name)}</option>`)
        .join('');
    departmentSelect.innerHTML = organizerDepartments
        .map(department => `<option value="${escapeHtml(String(department.name))}">${escapeHtml(department.name)}</option>`)
        .join('');
}
function renderOrganizerEventCards() {
    const container = document.getElementById('organizer-events-list');
    if (!organizerEvents.length) {
        container.className = 'dashboard-list';
        container.innerHTML = `
            <div class="empty-state">
                <h3>No organizer events yet</h3>
                <p>Create your first event using the form on the left.</p>
            </div>
        `;
        return;
    }
    container.className = 'dashboard-list';
    container.innerHTML = organizerEvents
        .map(event => `
            <article class="dashboard-item">
                <div class="dashboard-item-header">
                    <h4>${escapeHtml(event.title)}</h4>
                    <span class="badge badge-organizer">${escapeHtml(event.category || 'Event')}</span>
                </div>
                <p>${escapeHtml(event.description || '')}</p>
                <div class="meta">
                    <span>Date: ${escapeHtml(event.date || 'TBA')}</span>
                    <span>Department: ${escapeHtml(event.department || 'N/A')}</span>
                    ${event.location ? `<span>Location: ${escapeHtml(event.location)}</span>` : ''}
                </div>
                <div class="dashboard-actions">
                    <button class="btn-secondary" onclick="editOrganizerEvent(${event.id})">Edit</button>
                    <button class="btn-secondary" onclick="showParticipants(${event.id})">Participants</button>
                    <button class="btn-manage-cancel" onclick="deleteOrganizerEvent(${event.id})">Delete</button>
                </div>
            </article>
        `)
        .join('');
}
async function handleOrganizerEventSubmit(event) {
    event.preventDefault();
    const errorDiv = document.getElementById('organizer-form-error');
    const successDiv = document.getElementById('organizer-form-success');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    const eventId = document.getElementById('event-id').value;
    const payload = {
        title: document.getElementById('event-title').value.trim(),
        description: document.getElementById('event-description').value.trim(),
        date: document.getElementById('event-date').value.trim(),
        category: document.getElementById('event-category').value,
        department: document.getElementById('event-department').value,
        organizerId: organizerCurrentUser.role === 'ORGANIZER' ? organizerCurrentUser.id : organizerCurrentUser.id,
        location: document.getElementById('event-location').value.trim() || null,
        maxParticipants: document.getElementById('event-max-participants').value
            ? Number(document.getElementById('event-max-participants').value)
            : null
    };
    try {
        const isEdit = Boolean(eventId);
        const endpoint = isEdit
            ? `${ORGANIZER_API}/api/events/${eventId}`
            : `${ORGANIZER_API}/api/events`;
        const response = await fetch(endpoint, {
            method: isEdit ? 'PUT' : 'POST',
            headers: organizerAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to save event');
        }
        successDiv.textContent = isEdit
            ? 'Event updated successfully.'
            : 'Event created successfully.';
        successDiv.style.display = 'block';
        resetOrganizerForm();
        await fetchOrganizerEvents();
        renderOrganizerEventCards();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}
function editOrganizerEvent(eventId) {
    const event = organizerEvents.find(item => item.id === eventId);
    if (!event) return;
    document.getElementById('event-id').value = event.id;
    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-description').value = event.description || '';
    document.getElementById('event-date').value = event.date || '';
    document.getElementById('event-category').value = event.category || '';
    document.getElementById('event-department').value = event.department || '';
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-max-participants').value = event.maxParticipants || '';
    document.getElementById('organizer-form-title').textContent = `Edit Event #${event.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function resetOrganizerForm() {
    const form = document.getElementById('organizer-event-form');
    form?.reset();
    document.getElementById('event-id').value = '';
    document.getElementById('organizer-form-title').textContent = 'Create Event';
    document.getElementById('organizer-form-error').style.display = 'none';
}
async function deleteOrganizerEvent(eventId) {
    if (!confirm('Delete this event? This operation cannot be undone.')) {
        return;
    }
    try {
        const response = await fetch(`${ORGANIZER_API}/api/events/${eventId}`, {
            method: 'DELETE',
            headers: organizerAuthHeaders()
        });
        if (!response.ok && response.status !== 204) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to delete event');
        }
        if (selectedEventId === eventId) {
            selectedEventId = null;
            document.getElementById('participants-section').style.display = 'none';
        }
        await fetchOrganizerEvents();
        renderOrganizerEventCards();
    } catch (error) {
        alert(error.message);
    }
}
async function showParticipants(eventId) {
    selectedEventId = eventId;
    const section = document.getElementById('participants-section');
    const title = document.getElementById('participants-title');
    const container = document.getElementById('participants-list');
    const selectedEvent = organizerEvents.find(event => event.id === eventId);
    section.style.display = 'block';
    title.textContent = selectedEvent?.title
        ? `Participants · ${selectedEvent.title}`
        : `Participants for Event #${eventId}`;
    container.innerHTML = '<div class="loading">Loading participants.</div>';
    try {
        const response = await fetch(`${ORGANIZER_API}/api/registrations/event/${eventId}/details`, {
            headers: organizerAuthHeaders()
        });
        if (!response.ok) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to load participants');
        }
        eventParticipants = await response.json();
        participantSearchTerm = '';
        participantStatusFilter = 'ALL';
        participantSortOrder = 'NEWEST';
        renderParticipantsPanel();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        container.innerHTML = `
            <div class="error">
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}
function renderParticipantsPanel() {
    const container = document.getElementById('participants-list');
    const filteredParticipants = applyParticipantFilters();
    const summary = summarizeParticipants(eventParticipants);
    if (!eventParticipants.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No participants</h3>
                <p>No registrations yet for this event.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = `
        <div class="participants-toolbar">
            <div class="manage-summary-grid">
                <div class="manage-summary-card"><strong>${summary.total}</strong><span>Total</span></div>
                <div class="manage-summary-card"><strong>${summary.registered}</strong><span>Registered</span></div>
                <div class="manage-summary-card"><strong>${summary.attended}</strong><span>Attended</span></div>
                <div class="manage-summary-card"><strong>${summary.noShow}</strong><span>No Show</span></div>
                <div class="manage-summary-card"><strong>${summary.cancelled}</strong><span>Cancelled</span></div>
            </div>
            <div class="participants-controls">
                <div class="manage-control-group">
                    <label for="participant-search">Search participant</label>
                    <input id="participant-search" type="text" placeholder="Name or email" value="${escapeHtml(participantSearchTerm)}" />
                </div>
                <div class="manage-control-group">
                    <label for="participant-status-filter">Status</label>
                    <select id="participant-status-filter">
                        ${['ALL', 'REGISTERED', 'ATTENDED', 'NO_SHOW', 'CANCELLED']
                            .map(status => `<option value="${status}" ${status === participantStatusFilter ? 'selected' : ''}>${status === 'ALL' ? 'All statuses' : status.replace('_', ' ')}</option>`)
                            .join('')}
                    </select>
                </div>
                <div class="manage-control-group">
                    <label for="participant-sort">Sort</label>
                    <select id="participant-sort">
                        <option value="NEWEST" ${participantSortOrder === 'NEWEST' ? 'selected' : ''}>Newest registration</option>
                        <option value="OLDEST" ${participantSortOrder === 'OLDEST' ? 'selected' : ''}>Oldest registration</option>
                        <option value="NAME_ASC" ${participantSortOrder === 'NAME_ASC' ? 'selected' : ''}>Name A–Z</option>
                        <option value="NAME_DESC" ${participantSortOrder === 'NAME_DESC' ? 'selected' : ''}>Name Z–A</option>
                    </select>
                </div>
            </div>
        </div>
        ${renderParticipantsTable(filteredParticipants)}
    `;
    attachParticipantControlListeners();
}
function renderParticipantsTable(participants) {
    if (!participants.length) {
        return `
            <div class="empty-state">
                <h3>No participants match this filter</h3>
                <p>Try adjusting search text or status filter.</p>
            </div>
        `;
    }
    return `
        <div class="table-wrap">
            <table class="dashboard-table participants-table">
                <thead>
                    <tr>
                        <th>Participant</th>
                        <th>Student ID</th>
                        <th>Status</th>
                        <th>Registered</th>
                        <th>Cancelled</th>
                        <th>Update</th>
                    </tr>
                </thead>
                <tbody>
                    ${participants.map(participant => {
                        const fullName = `${participant.studentFirstName} ${participant.studentLastName}`.trim();
                        return `
                        <tr>
                            <td>
                                <div class="participant-identity">
                                    <strong>${escapeHtml(fullName)}</strong>
                                    <span>${escapeHtml(participant.studentEmail)}</span>
                                </div>
                            </td>
                            <td>${participant.studentId}</td>
                            <td>
                                <div class="participant-status-cell">
                                    <span class="badge ${statusBadgeClass(participant.status)}">${participant.status.replace('_', ' ')}</span>
                                    <select id="status-${participant.id}">
                                        ${['REGISTERED', 'ATTENDED', 'NO_SHOW', 'CANCELLED']
                                            .map(status => `<option value="${status}" ${participant.status === status ? 'selected' : ''}>${status.replace('_', ' ')}</option>`)
                                            .join('')}
                                    </select>
                                </div>
                            </td>
                            <td>${formatDateTime(participant.registeredAt)}</td>
                            <td>${formatDateTime(participant.cancelledAt)}</td>
                            <td>
                                <button class="btn-secondary" onclick="updateParticipantStatus(${participant.id})">Save</button>
                            </td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}
function attachParticipantControlListeners() {
    const searchInput = document.getElementById('participant-search');
    const statusSelect = document.getElementById('participant-status-filter');
    const sortSelect = document.getElementById('participant-sort');
    searchInput?.addEventListener('input', (event) => {
        participantSearchTerm = event.target.value;
        renderParticipantsPanel();
    });
    statusSelect?.addEventListener('change', (event) => {
        participantStatusFilter = event.target.value;
        renderParticipantsPanel();
    });
    sortSelect?.addEventListener('change', (event) => {
        participantSortOrder = event.target.value;
        renderParticipantsPanel();
    });
}
function applyParticipantFilters() {
    const searchLower = participantSearchTerm.trim().toLowerCase();
    const filtered = eventParticipants.filter(participant => {
        const fullName = `${participant.studentFirstName} ${participant.studentLastName}`.toLowerCase();
        const email = (participant.studentEmail || '').toLowerCase();
        const statusMatch = participantStatusFilter === 'ALL' || participant.status === participantStatusFilter;
        const searchMatch = !searchLower || fullName.includes(searchLower) || email.includes(searchLower);
        return statusMatch && searchMatch;
    });
    const byRegisteredAt = (left, right) => {
        const leftTime = left.registeredAt ? new Date(left.registeredAt).getTime() : 0;
        const rightTime = right.registeredAt ? new Date(right.registeredAt).getTime() : 0;
        return leftTime - rightTime;
    };
    const byName = (left, right) => {
        const leftName = `${left.studentFirstName} ${left.studentLastName}`.trim().toLowerCase();
        const rightName = `${right.studentFirstName} ${right.studentLastName}`.trim().toLowerCase();
        return leftName.localeCompare(rightName);
    };
    if (participantSortOrder === 'NEWEST') {
        return filtered.sort((left, right) => byRegisteredAt(right, left));
    }
    if (participantSortOrder === 'OLDEST') {
        return filtered.sort(byRegisteredAt);
    }
    if (participantSortOrder === 'NAME_ASC') {
        return filtered.sort(byName);
    }
    return filtered.sort((left, right) => byName(right, left));
}
function summarizeParticipants(participants) {
    return {
        total: participants.length,
        registered: participants.filter(item => item.status === 'REGISTERED').length,
        attended: participants.filter(item => item.status === 'ATTENDED').length,
        noShow: participants.filter(item => item.status === 'NO_SHOW').length,
        cancelled: participants.filter(item => item.status === 'CANCELLED').length
    };
}
function statusBadgeClass(status) {
    const map = {
        REGISTERED: 'badge-registered',
        ATTENDED: 'badge-attended',
        NO_SHOW: 'badge-no-show',
        CANCELLED: 'badge-cancelled'
    };
    return map[status] || 'badge';
}
function formatDateTime(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-US');
}
async function updateParticipantStatus(registrationId) {
    const statusElement = document.getElementById(`status-${registrationId}`);
    const status = statusElement?.value;
    try {
        const response = await fetch(`${ORGANIZER_API}/api/registrations/${registrationId}/status`, {
            method: 'PUT',
            headers: organizerAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Could not update status');
        }
        const participant = eventParticipants.find(item => item.id === registrationId);
        if (participant) {
            participant.status = status;
            if (status === 'CANCELLED' && !participant.cancelledAt) {
                participant.cancelledAt = new Date().toISOString();
            }
        }
        renderParticipantsPanel();
        alert('Participant status updated.');
    } catch (error) {
        alert(error.message);
    }
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
