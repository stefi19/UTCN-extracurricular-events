// Simple API helper
const API_URL = 'http://localhost:8080';
let allEvents = [];
let myRegisteredEventIds = new Set(); // event IDs the current student has registered for
const EVENT_FILTERS_STORAGE_KEY = 'events_filters_v2';
const ORGANIZER_LABEL_ASSIGNED = 'Organizator desemnat';
const ORGANIZER_LABEL_UNSPECIFIED = 'Fără organizator specificat';

const eventFilters = {
    organizers: [],
    types: [],
    topic: '',
    sortBy: 'date-asc'
};

function getToken() {
    return localStorage.getItem('jwt_token');
}

function getCurrentRole() {
    return localStorage.getItem('user_role');
}

function getCurrentUserId() {
    const raw = localStorage.getItem('user_id');
    return raw ? Number(raw) : null;
}

function persistUserSession(user) {
    if (!user) return;
    localStorage.setItem('user_email', user.email || '');
    localStorage.setItem('user_role', user.role || '');
    localStorage.setItem('user_id', String(user.id || ''));
    localStorage.setItem('user_name', `${user.firstName || ''} ${user.lastName || ''}`.trim());
}

async function ensureUserContext() {
    const token = getToken();
    if (!token) return null;

    if (getCurrentRole() && getCurrentUserId()) {
        return {
            role: getCurrentRole(),
            id: getCurrentUserId(),
            email: localStorage.getItem('user_email') || ''
        };
    }

    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                clearSession();
            }
            return null;
        }

        const me = await response.json();
        persistUserSession(me);
        return me;
    } catch (error) {
        console.error('Failed to load session user:', error);
        return null;
    }
}

async function fetchMyRegistrations() {
    const token = getToken();
    if (!token || getCurrentRole() !== 'STUDENT') {
        myRegisteredEventIds = new Set();
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/registrations`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { myRegisteredEventIds = new Set(); return; }
        const regs = await res.json();
        myRegisteredEventIds = new Set(regs.filter(r => r.status !== 'CANCELLED').map(r => r.eventId));
    } catch {
        myRegisteredEventIds = new Set();
    }
}

async function fetchEvents() {
    const container = document.getElementById('events-container');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading">Loading events...</div>';
        
        const [eventsRes] = await Promise.all([
            fetch(`${API_URL}/api/events`),
            fetchMyRegistrations()
        ]);

        if (!eventsRes.ok) throw new Error('Failed to fetch events');
        
        allEvents = await eventsRes.json();

        if (allEvents.length === 0) {
            renderEventFilterControls([]);
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Events Available</h3>
                    <p>There are no events at the moment. Please check back soon.</p>
                </div>
            `;
            return;
        }

        renderEventFilterControls(allEvents);
        applyEventFiltersAndRender();
    } catch (error) {
        console.error('Error fetching events:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load Events</h3>
                <p>We could not load events right now. Please try again in a moment.</p>
            </div>
        `;
    }
}

function renderEventFilterControls(events) {
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer || !eventsContainer.parentElement) return;

    let filterContainer = document.getElementById('events-filter-container');
    if (!filterContainer) {
        filterContainer = document.createElement('section');
        filterContainer.id = 'events-filter-container';
        filterContainer.className = 'events-filter-panel';
        eventsContainer.parentElement.insertBefore(filterContainer, eventsContainer);
    }

    const organizers = [...new Set(events.map(getOrganizerLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const types = [...new Set(events.map(getEventType).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    filterContainer.innerHTML = `
        <div class="events-filter-header">
            <h3>Find events faster</h3>
            <button type="button" class="btn btn-secondary" id="events-clear-filters">Clear filters</button>
        </div>
        <div class="events-filter-grid">
            <label class="events-filter-field">
                <span>Organizer (multi-select)</span>
                <select id="event-filter-organizer" multiple size="4">
                    ${organizers.map(name => `<option value="${escapeHtml(name)}" ${isOptionSelected(eventFilters.organizers, name)}>${escapeHtml(name)}</option>`).join('')}
                </select>
                <small class="events-filter-hint">Choose none to include all organizers.</small>
            </label>
            <label class="events-filter-field">
                <span>Type of event (multi-select)</span>
                <select id="event-filter-type" multiple size="4">
                    ${types.map(type => `<option value="${escapeHtml(type)}" ${isOptionSelected(eventFilters.types, type)}>${escapeHtml(type)}</option>`).join('')}
                </select>
                <small class="events-filter-hint">Choose none to include all event types.</small>
            </label>
            <label class="events-filter-field">
                <span>Topic</span>
                <input id="event-filter-topic" type="text" placeholder="Search by title, description, department..." />
            </label>
            <label class="events-filter-field">
                <span>Sort by</span>
                <select id="event-filter-sort">
                    <option value="date-asc" ${eventFilters.sortBy === 'date-asc' ? 'selected' : ''}>Date (earliest first)</option>
                    <option value="date-desc" ${eventFilters.sortBy === 'date-desc' ? 'selected' : ''}>Date (latest first)</option>
                    <option value="title-asc" ${eventFilters.sortBy === 'title-asc' ? 'selected' : ''}>Title (A → Z)</option>
                    <option value="title-desc" ${eventFilters.sortBy === 'title-desc' ? 'selected' : ''}>Title (Z → A)</option>
                </select>
            </label>
        </div>
        <div id="events-active-filters" class="events-active-filters"></div>
        <div id="events-filter-results" class="events-filter-results"></div>
    `;

    const organizerSelect = document.getElementById('event-filter-organizer');
    const typeSelect = document.getElementById('event-filter-type');
    const topicInput = document.getElementById('event-filter-topic');
    const sortSelect = document.getElementById('event-filter-sort');
    const clearButton = document.getElementById('events-clear-filters');

    if (organizerSelect) {
        setSelectedValues(organizerSelect, eventFilters.organizers);
        organizerSelect.addEventListener('change', () => {
            eventFilters.organizers = getSelectedValues(organizerSelect);
            persistEventFilters();
            applyEventFiltersAndRender();
        });
    }

    if (typeSelect) {
        setSelectedValues(typeSelect, eventFilters.types);
        typeSelect.addEventListener('change', () => {
            eventFilters.types = getSelectedValues(typeSelect);
            persistEventFilters();
            applyEventFiltersAndRender();
        });
    }

    if (topicInput) {
        topicInput.value = eventFilters.topic;
        topicInput.addEventListener('input', () => {
            eventFilters.topic = topicInput.value;
            persistEventFilters();
            applyEventFiltersAndRender();
        });
    }

    if (sortSelect) {
        sortSelect.value = eventFilters.sortBy;
        sortSelect.addEventListener('change', () => {
            eventFilters.sortBy = sortSelect.value;
            persistEventFilters();
            applyEventFiltersAndRender();
        });
    }

    clearButton?.addEventListener('click', () => {
        eventFilters.organizers = [];
        eventFilters.types = [];
        eventFilters.topic = '';
        eventFilters.sortBy = 'date-asc';
        persistEventFilters();
        renderEventFilterControls(allEvents);
        applyEventFiltersAndRender();
    });
}

function applyEventFiltersAndRender() {
    const filtered = allEvents.filter((event) => {
        const organizerMatch = eventFilters.organizers.length === 0 || eventFilters.organizers.includes(getOrganizerLabel(event));
        const typeMatch = eventFilters.types.length === 0 || eventFilters.types.includes(getEventType(event));
        const topicMatch = matchesTopic(event, eventFilters.topic);
        return organizerMatch && typeMatch && topicMatch;
    });

    const sorted = applyEventSorting(filtered, eventFilters.sortBy);

    displayEvents(sorted);
    updateEventFilterResults(sorted.length, allEvents.length);
    updateActiveFilterSummary();
}

function updateEventFilterResults(visibleCount, totalCount) {
    const results = document.getElementById('events-filter-results');
    if (!results) return;

    if (visibleCount === totalCount) {
        results.textContent = `Showing all ${totalCount} events`;
        return;
    }

    results.textContent = `Showing ${visibleCount} of ${totalCount} events`;
}

function matchesTopic(event, topicQuery) {
    const normalizedQuery = (topicQuery || '').trim().toLowerCase();
    if (!normalizedQuery) return true;

    const searchableFields = [
        event.title,
        event.description,
        event.department,
        event.category,
        event.location,
        getOrganizerLabel(event)
    ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase());

    return searchableFields.some(value => value.includes(normalizedQuery));
}

function applyEventSorting(events, sortBy) {
    const sortedEvents = [...events];
    switch (sortBy) {
        case 'date-desc':
            return sortedEvents.sort((a, b) => getEventTimestamp(b) - getEventTimestamp(a));
        case 'title-asc':
            return sortedEvents.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        case 'title-desc':
            return sortedEvents.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        case 'date-asc':
        default:
            return sortedEvents.sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
    }
}

function getEventTimestamp(event) {
    const candidates = [event.startTime, event.date];
    for (const candidate of candidates) {
        if (!candidate) continue;
        const timestamp = Date.parse(candidate);
        if (!Number.isNaN(timestamp)) return timestamp;
    }
    return Number.MAX_SAFE_INTEGER;
}

function updateActiveFilterSummary() {
    const container = document.getElementById('events-active-filters');
    if (!container) return;

    const chips = [];
    eventFilters.organizers.forEach(name => chips.push(`<span class="events-filter-chip">Organizer: ${escapeHtml(name)}</span>`));
    eventFilters.types.forEach(type => chips.push(`<span class="events-filter-chip">Type: ${escapeHtml(type)}</span>`));
    if (eventFilters.topic.trim()) {
        chips.push(`<span class="events-filter-chip">Topic: ${escapeHtml(eventFilters.topic.trim())}</span>`);
    }

    if (chips.length === 0) {
        container.innerHTML = '<span class="events-filter-hint">No active filters.</span>';
        return;
    }

    container.innerHTML = chips.join('');
}

function getSelectedValues(selectElement) {
    return Array.from(selectElement.selectedOptions).map(option => option.value);
}

function setSelectedValues(selectElement, values) {
    const selected = new Set(values || []);
    Array.from(selectElement.options).forEach(option => {
        option.selected = selected.has(option.value);
    });
}

function isOptionSelected(selectedValues, optionValue) {
    return (selectedValues || []).includes(optionValue) ? 'selected' : '';
}

function persistEventFilters() {
    localStorage.setItem(EVENT_FILTERS_STORAGE_KEY, JSON.stringify(eventFilters));
}

function loadPersistedEventFilters() {
    const raw = localStorage.getItem(EVENT_FILTERS_STORAGE_KEY);
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        eventFilters.organizers = normalizePersistedOrganizerFilters(parsed.organizers);
        eventFilters.types = Array.isArray(parsed.types) ? parsed.types : [];
        eventFilters.topic = typeof parsed.topic === 'string' ? parsed.topic : '';
        eventFilters.sortBy = typeof parsed.sortBy === 'string' ? parsed.sortBy : 'date-asc';
    } catch (error) {
        console.warn('Could not parse persisted event filters', error);
    }
}

function getEventType(event) {
    return (event.category || 'Uncategorized').trim();
}

function getOrganizerLabel(event) {
    const resolvedName = (event.organizerName || '').trim();
    if (resolvedName) return resolvedName;
    if (event.organizerId !== null && event.organizerId !== undefined) {
        return ORGANIZER_LABEL_ASSIGNED;
    }
    return ORGANIZER_LABEL_UNSPECIFIED;
}

function normalizePersistedOrganizerFilters(values) {
    if (!Array.isArray(values)) return [];

    const normalized = values.map((value) => {
        if (typeof value !== 'string') return null;
        if (/^Organizer\s*#\d+$/i.test(value.trim())) {
            return ORGANIZER_LABEL_ASSIGNED;
        }
        if (/^Not specified$/i.test(value.trim())) {
            return ORGANIZER_LABEL_UNSPECIFIED;
        }
        return value.trim();
    }).filter(Boolean);

    return [...new Set(normalized)];
}

function buildRegisterButton(event, loggedIn, userRole, context) {
    // context = 'card' (in grid) | 'modal' (in popup)
    const fullWidth = context === 'modal' ? ' style="width:100%;"' : ' style="margin-top:1rem;width:100%;"';
    if (loggedIn && userRole === 'STUDENT') {
        if (myRegisteredEventIds.has(event.id)) {
            return `<div class="already-registered-badge"${fullWidth}>✓ Already Registered</div>`;
        }
        return `<button class="btn btn-primary" onclick="registerForEvent(${event.id})"${fullWidth}>Register for Event</button>`;
    }
    if (loggedIn && (userRole === 'ORGANIZER' || userRole === 'ADMIN')) {
        return `<a href="/organizer-panel" class="btn btn-secondary"${fullWidth}>Manage from Organizer Panel</a>`;
    }
    return `<a href="/login" class="btn"${fullWidth}>Login to Register</a>`;
}

function formatEventDate(event) {
    let formattedDate = 'TBA';
    let formattedTime = '';
    if (event.date) {
        formattedDate = event.date;
    } else if (event.startTime) {
        const startDate = new Date(event.startTime);
        formattedDate = startDate.toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
        formattedTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return { formattedDate, formattedTime };
}

// ── Event detail modal ─────────────────────────────────────────────────────

function ensureModalInDOM() {
    if (document.getElementById('event-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'event-modal';
    overlay.className = 'event-modal-overlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.innerHTML = `
        <div class="event-modal-box" id="event-modal-box">
            <button class="event-modal-close" id="event-modal-close" aria-label="Close">✕</button>
            <div id="event-modal-body"></div>
        </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) closeEventModal(); });
    document.getElementById('event-modal-close').addEventListener('click', closeEventModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeEventModal(); });
}

function openEventModal(eventId) {
    const event = allEvents.find(ev => ev.id === eventId);
    if (!event) return;
    ensureModalInDOM();

    const loggedIn = isLoggedIn();
    const userRole = getCurrentRole();
    const { formattedDate, formattedTime } = formatEventDate(event);
    const registerBtn = buildRegisterButton(event, loggedIn, userRole, 'modal');

    const rows = [
        ['Date',       formattedDate + (formattedTime ? ' · ' + formattedTime : '')],
        ['Category',   event.category],
        ['Department', event.department],
        ['Location',   event.location],
        ['Organizer',  getOrganizerLabel(event)],
        ['Max seats',  event.maxParticipants != null ? String(event.maxParticipants) : null],
    ].filter(([, v]) => v);

    document.getElementById('event-modal-body').innerHTML = `
        <div class="event-modal-header">
            <h2>${escapeHtml(event.title)}</h2>
            ${event.category ? `<span class="badge badge-registered">${escapeHtml(event.category)}</span>` : ''}
        </div>
        <p class="event-modal-desc">${escapeHtml(event.description || 'No description available.')}</p>
        <div class="event-modal-meta">
            ${rows.map(([label, value]) => `
                <div class="event-modal-meta-row">
                    <span class="event-modal-meta-label">${label}</span>
                    <span class="event-modal-meta-value">${escapeHtml(value)}</span>
                </div>`).join('')}
        </div>
        <div class="event-modal-action" id="event-modal-action-${event.id}">
            ${registerBtn}
        </div>`;

    const overlay = document.getElementById('event-modal');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeEventModal() {
    const overlay = document.getElementById('event-modal');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function displayEvents(events) {
    const container = document.getElementById('events-container');
    if (!container) return;

    if (!events.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No matching events</h3>
                <p>Try broadening your organizer/type/topic filters to see more results.</p>
            </div>
        `;
        return;
    }

    const loggedIn = isLoggedIn();
    const userRole = getCurrentRole();

    container.innerHTML = events.map(event => {
        const { formattedDate, formattedTime } = formatEventDate(event);
        const registerButton = buildRegisterButton(event, loggedIn, userRole, 'card');

        return `
            <div class="event-card" onclick="openEventModal(${event.id})" style="cursor:pointer;">
                <h3>${escapeHtml(event.title)}</h3>
                <p>${escapeHtml(event.description || 'No description available')}</p>
                <div class="meta">
                    <span>Date: ${formattedDate}</span>
                    ${formattedTime ? `<span>Time: ${formattedTime}</span>` : ''}
                </div>
                ${event.category ? `<div class="meta" style="margin-top:.4rem;"><span>Type: ${escapeHtml(event.category)}</span></div>` : ''}
                ${event.department ? `<div class="meta" style="margin-top:.4rem;"><span>Department: ${escapeHtml(event.department)}</span></div>` : ''}
                <div class="meta" style="margin-top:.4rem;"><span>Organizer: ${escapeHtml(getOrganizerLabel(event))}</span></div>
                <div onclick="event.stopPropagation()">
                    ${registerButton}
                </div>
            </div>
        `;
    }).join('');
}

// Register for an event
async function registerForEvent(eventId) {
    const token = getToken();
    
    if (!token) {
        alert('Please sign in to register for events.');
        window.location.href = '/login';
        return;
    }

    // Disable the button immediately to prevent double-clicks
    const btn = document.querySelector(`button[onclick="registerForEvent(${eventId})"]`);
    if (btn) { btn.disabled = true; btn.textContent = 'Registering…'; }

    try {
        const response = await fetch(`${API_URL}/api/registrations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId })
        });

        const data = await response.json();

        if (response.ok) {
            // Mark as registered locally and swap every button for this event to the badge
            myRegisteredEventIds.add(eventId);
            const badge = `<div class="already-registered-badge" style="width:100%;">✓ Already Registered</div>`;

            // Swap button in the card grid
            if (btn) {
                const badgeEl = document.createElement('div');
                badgeEl.className = 'already-registered-badge';
                badgeEl.style.width = '100%';
                badgeEl.textContent = '✓ Already Registered';
                btn.replaceWith(badgeEl);
            }

            // Swap button inside the modal (if open)
            const modalAction = document.getElementById(`event-modal-action-${eventId}`);
            if (modalAction) modalAction.innerHTML = badge;
        } else {
            alert(`Registration failed: ${data.error || data.message || 'Unknown error'}`);
            if (btn) { btn.disabled = false; btn.textContent = 'Register for Event'; }
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred while registering. Please try again.');
        if (btn) { btn.disabled = false; btn.textContent = 'Register for Event'; }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load events when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeAppPage();
});

async function initializeAppPage() {
    await ensureUserContext();
    updateNavigation();
    loadPersistedEventFilters();

    if (document.getElementById('events-container')) {
        fetchEvents();
    }
}

// Check if user is logged in
function isLoggedIn() {
    return getToken() !== null;
}

// Update navigation based on authentication status
function updateNavigation() {
    const navUl = document.querySelector('nav ul');
    if (!navUl) return;

    if (isLoggedIn()) {
        const userEmail = localStorage.getItem('user_email');
        const userRole = getCurrentRole();
        const loginLi = Array.from(navUl.querySelectorAll('li')).find(li => li.querySelector('a[href="/login"]'));

        if (loginLi) {
            loginLi.innerHTML = `
                <span class="user-chip">${escapeHtml(userEmail || 'User')}</span>
                <a href="#" onclick="logout(); return false;">Logout</a>
            `;
        }

        if (userRole === 'ORGANIZER' && !document.getElementById('nav-organizer-link')) {
            const organizerLi = document.createElement('li');
            organizerLi.id = 'nav-organizer-link';
            organizerLi.innerHTML = '<a href="/organizer-panel">Organizer Panel</a>';
            navUl.appendChild(organizerLi);
        }

        if (userRole === 'ADMIN') {
            if (!document.getElementById('nav-organizer-link')) {
                const organizerLi = document.createElement('li');
                organizerLi.id = 'nav-organizer-link';
                organizerLi.innerHTML = '<a href="/organizer-panel">Organizer Panel</a>';
                navUl.appendChild(organizerLi);
            }

            if (!document.getElementById('nav-admin-dashboard-link')) {
                const dashLi = document.createElement('li');
                dashLi.id = 'nav-admin-dashboard-link';
                dashLi.innerHTML = '<a href="/admin-dashboard">📊 Dashboard</a>';
                navUl.appendChild(dashLi);
            }

            if (!document.getElementById('nav-admin-organizers-link')) {
                const adminLi = document.createElement('li');
                adminLi.id = 'nav-admin-organizers-link';
                adminLi.innerHTML = '<a href="/admin-organizers">Admin Organizers</a>';
                navUl.appendChild(adminLi);
            }

            if (!document.getElementById('nav-admin-taxonomy-link')) {
                const taxonomyLi = document.createElement('li');
                taxonomyLi.id = 'nav-admin-taxonomy-link';
                taxonomyLi.innerHTML = '<a href="/admin-taxonomy">Admin Taxonomy</a>';
                navUl.appendChild(taxonomyLi);
            }
        }
    }
}

// Logout function
function logout() {
    clearSession();
    alert('You have been signed out successfully.');
    window.location.href = '/';
}

function clearSession() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
}
