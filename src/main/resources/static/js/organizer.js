const ORGANIZER_API = 'http://localhost:8080';

let organizerCurrentUser = null;
let organizerEvents = [];
let organizerCategories = [];
let organizerDepartments = [];
let selectedEventId = null;

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
            <p class="dashboard-muted">Update participant statuses (REGISTERED, ATTENDED, NO_SHOW, CANCELLED).</p>
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

    section.style.display = 'block';
    title.textContent = `Participants for Event #${eventId}`;
    container.innerHTML = '<div class="loading">Loading participants.</div>';

    try {
        const response = await fetch(`${ORGANIZER_API}/api/registrations/event/${eventId}`, {
            headers: organizerAuthHeaders()
        });

        if (!response.ok) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to load participants');
        }

        const participants = await response.json();
        renderParticipants(participants);
    } catch (error) {
        container.innerHTML = `
            <div class="error">
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

function renderParticipants(participants) {
    const container = document.getElementById('participants-list');

    if (!participants.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No participants</h3>
                <p>No registrations yet for this event.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-wrap">
            <table class="dashboard-table">
                <thead>
                    <tr>
                        <th>Registration ID</th>
                        <th>Student ID</th>
                        <th>Status</th>
                        <th>Registered At</th>
                        <th>Update</th>
                    </tr>
                </thead>
                <tbody>
                    ${participants.map(participant => `
                        <tr>
                            <td>#${participant.id}</td>
                            <td>${participant.studentId}</td>
                            <td>
                                <select id="status-${participant.id}">
                                    ${['REGISTERED', 'ATTENDED', 'NO_SHOW', 'CANCELLED']
                                        .map(status => `<option value="${status}" ${participant.status === status ? 'selected' : ''}>${status}</option>`)
                                        .join('')}
                                </select>
                            </td>
                            <td>${participant.registeredAt ? new Date(participant.registeredAt).toLocaleString('en-US') : '-'}</td>
                            <td>
                                <button class="btn-secondary" onclick="updateParticipantStatus(${participant.id})">Save</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
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

        alert('Participant status updated.');
        if (selectedEventId) {
            await showParticipants(selectedEventId);
        }
    } catch (error) {
        alert(error.message);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
