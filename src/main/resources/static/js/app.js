const API_URL = 'http://localhost:8080';
let allEvents = [];
let myRegisteredEventIds = new Set(); 
let activeEventsTab = 'upcoming'; 
const EVENT_FILTERS_STORAGE_KEY = 'events_filters_v2';
const ORGANIZER_LABEL_ASSIGNED = 'Assigned Organizer';
const ORGANIZER_LABEL_UNSPECIFIED = 'No organizer specified';
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
function isUpcomingEvent(event) {
    const ts = getEventTimestamp(event);
    if (ts === Number.MAX_SAFE_INTEGER) return true; 
    return ts >= Date.now();
}
function renderEventTabs(allFilteredUpcoming, allFilteredPast) {
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer || !eventsContainer.parentElement) return;
    let tabBar = document.getElementById('events-tab-bar');
    if (!tabBar) {
        tabBar = document.createElement('div');
        tabBar.id = 'events-tab-bar';
        tabBar.className = 'events-tab-bar';
        eventsContainer.parentElement.insertBefore(tabBar, document.getElementById('events-filter-container') || eventsContainer);
    }
    tabBar.innerHTML = `
        <button class="events-tab-btn ${activeEventsTab === 'upcoming' ? 'active' : ''}" onclick="switchEventsTab('upcoming')">
            Upcoming Events
            <span class="events-tab-count">${allFilteredUpcoming}</span>
        </button>
        <button class="events-tab-btn ${activeEventsTab === 'past' ? 'active' : ''}" onclick="switchEventsTab('past')">
            Past Events
            <span class="events-tab-count">${allFilteredPast}</span>
        </button>
    `;
}
function switchEventsTab(tab) {
    activeEventsTab = tab;
    applyEventFiltersAndRender();
}
function applyEventFiltersAndRender() {
    const filtered = allEvents.filter((event) => {
        const organizerMatch = eventFilters.organizers.length === 0 || eventFilters.organizers.includes(getOrganizerLabel(event));
        const typeMatch = eventFilters.types.length === 0 || eventFilters.types.includes(getEventType(event));
        const topicMatch = matchesTopic(event, eventFilters.topic);
        return organizerMatch && typeMatch && topicMatch;
    });
    const upcomingFiltered = filtered.filter(isUpcomingEvent);
    const pastFiltered = filtered.filter(e => !isUpcomingEvent(e));
    renderEventTabs(upcomingFiltered.length, pastFiltered.length);
    const tabEvents = activeEventsTab === 'past' ? pastFiltered : upcomingFiltered;
    const sorted = applyEventSorting(tabEvents, eventFilters.sortBy);
    displayEvents(sorted, activeEventsTab === 'past');
    updateEventFilterResults(sorted.length, allEvents.filter(isUpcomingEvent).length, allEvents.filter(e => !isUpcomingEvent(e)).length);
    updateActiveFilterSummary();
}
function updateEventFilterResults(visibleCount, totalUpcoming, totalPast) {
    const results = document.getElementById('events-filter-results');
    if (!results) return;
    const tabTotal = activeEventsTab === 'past' ? totalPast : totalUpcoming;
    if (visibleCount === tabTotal) {
        results.textContent = `Showing all ${visibleCount} ${activeEventsTab} events`;
        return;
    }
    results.textContent = `Showing ${visibleCount} of ${tabTotal} ${activeEventsTab} events`;
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
    const isPast = !isUpcomingEvent(event);
    const { formattedDate, formattedTime } = formatEventDate(event);
    const actionArea = isPast
        ? `<div class="event-past-note">This event has already taken place.</div>`
        : `<div class="event-modal-action" id="event-modal-action-${event.id}">${buildRegisterButton(event, loggedIn, userRole, 'modal')}</div>`;
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
            ${isPast ? '<span class="event-past-badge" style="font-size:.8rem;padding:.25rem .6rem;">Past</span>' : ''}
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
        ${actionArea}`;
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
function displayEvents(events, isPastTab = false) {
    const container = document.getElementById('events-container');
    if (!container) return;
    if (!events.length) {
        container.innerHTML = isPastTab ? `
            <div class="empty-state">
                <h3>No past events</h3>
                <p>No past events match the current filters.</p>
            </div>
        ` : `
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
        const registerButton = isPastTab ? '' : buildRegisterButton(event, loggedIn, userRole, 'card');
        return `
            <div class="event-card${isPastTab ? ' event-card-past' : ''}" onclick="openEventModal(${event.id})" style="cursor:pointer;">
                ${isPastTab ? '<span class="event-past-badge">Past</span>' : ''}
                <h3>${escapeHtml(event.title)}</h3>
                <p>${escapeHtml(event.description || 'No description available')}</p>
                <div class="meta">
                    <span>Date: ${formattedDate}</span>
                    ${formattedTime ? `<span>Time: ${formattedTime}</span>` : ''}
                </div>
                ${event.category ? `<div class="meta" style="margin-top:.4rem;"><span>Type: ${escapeHtml(event.category)}</span></div>` : ''}
                ${event.department ? `<div class="meta" style="margin-top:.4rem;"><span>Department: ${escapeHtml(event.department)}</span></div>` : ''}
                <div class="meta" style="margin-top:.4rem;"><span>Organizer: ${escapeHtml(getOrganizerLabel(event))}</span></div>
                ${registerButton ? `<div onclick="event.stopPropagation()">${registerButton}</div>` : ''}
            </div>
        `;
    }).join('');
}
async function registerForEvent(eventId) {
    const token = getToken();
    if (!token) {
        alert('Please sign in to register for events.');
        window.location.href = '/login';
        return;
    }
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
            myRegisteredEventIds.add(eventId);
            const badge = `<div class="already-registered-badge" style="width:100%;">✓ Already Registered</div>`;
            if (btn) {
                const badgeEl = document.createElement('div');
                badgeEl.className = 'already-registered-badge';
                badgeEl.style.width = '100%';
                badgeEl.textContent = '✓ Already Registered';
                btn.replaceWith(badgeEl);
            }
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
document.addEventListener('DOMContentLoaded', () => {
    initializeAppPage();
});
async function initializeAppPage() {
    await ensureUserContext();
    updateNavigation();
    loadPersistedEventFilters();
    if (document.getElementById('home-container')) {
        loadHomePage();
    }
    if (document.getElementById('events-container')) {
        fetchEvents();
    }
}
function isLoggedIn() {
    return getToken() !== null;
}
async function loadHomePage() {
    const container = document.getElementById('home-container');
    if (!container) return;
    container.innerHTML = '<div class="loading">Personalizing your experience…</div>';
    try {
        const loggedIn = isLoggedIn();
        const role = getCurrentRole();
        const fetchList = [fetch(`${API_URL}/api/events`)];
        if (loggedIn && role === 'STUDENT') {
            fetchList.push(fetch(`${API_URL}/api/registrations`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            }));
        }
        const results = await Promise.all(fetchList);
        if (!results[0].ok) throw new Error('events fetch failed');
        allEvents = await results[0].json();
        let registrations = [];
        if (results[1] && results[1].ok) {
            registrations = await results[1].json();
            myRegisteredEventIds = new Set(
                registrations.filter(r => r.status !== 'CANCELLED').map(r => r.eventId)
            );
        }
        if (loggedIn && role === 'STUDENT') {
            renderStudentHome(container, registrations);
        } else if (loggedIn && role === 'ORGANIZER') {
            renderOrganizerHome(container);
        } else {
            renderGuestHome(container);
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="empty-state"><h3>Something went wrong</h3><p>Please refresh the page.</p></div>`;
    }
}
function getStudentLevel(count) {
    const levels = [
        { min: 0,  max: 0,        title: 'Newcomer',   emoji: '🌱', nextAt: 1  },
        { min: 1,  max: 2,        title: 'Explorer',   emoji: '🔭', nextAt: 3  },
        { min: 3,  max: 5,        title: 'Scholar',    emoji: '📚', nextAt: 6  },
        { min: 6,  max: 9,        title: 'Enthusiast', emoji: '⚡', nextAt: 10 },
        { min: 10, max: Infinity, title: 'Legend',     emoji: '🏆', nextAt: null },
    ];
    return levels.find(l => count >= l.min && count <= l.max) || levels[0];
}
function renderStudentHome(container, registrations) {
    const firstName = (localStorage.getItem('user_name') || 'there').split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const activeRegs = registrations.filter(r => r.status !== 'CANCELLED');
    const upcoming = allEvents.filter(isUpcomingEvent);
    const myUpcoming = upcoming.filter(e => myRegisteredEventIds.has(e.id))
        .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
    const myPast = allEvents.filter(e => !isUpcomingEvent(e) && myRegisteredEventIds.has(e.id));
    const notRegistered = upcoming.filter(e => !myRegisteredEventIds.has(e.id));
    const { title: rankTitle, emoji, nextAt } = getStudentLevel(activeRegs.length);
    const progress = nextAt === null ? 100 : Math.min(100, Math.round((activeRegs.length / nextAt) * 100));
    const catCount = {};
    activeRegs.forEach(r => {
        const ev = allEvents.find(e => e.id === r.eventId);
        if (ev?.category) catCount[ev.category] = (catCount[ev.category] || 0) + 1;
    });
    const cats = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;
    const achievements = [
        activeRegs.length >= 1  ? { icon: '🎫', label: 'First Step'  } : null,
        activeRegs.length >= 3  ? { icon: '🔭', label: 'Explorer'    } : null,
        cats.length >= 2        ? { icon: '🌐', label: 'Diverse'      } : null,
        myUpcoming.length >= 1  ? { icon: '📅', label: 'Committed'    } : null,
        activeRegs.length >= 5  ? { icon: '⚡', label: 'Enthusiast'   } : null,
        activeRegs.length >= 10 ? { icon: '🏆', label: 'Legend'       } : null,
    ].filter(Boolean);
    container.innerHTML = `
        <div class="home-wrap">
            <div class="home-greeting">
                <div class="home-greeting-text">
                    <span class="home-greeting-sub">${greeting}</span>
                    <h2 class="home-greeting-name">${escapeHtml(firstName)} <span class="home-wave">👋</span></h2>
                    <p class="home-greeting-desc">
                        ${upcoming.length} event${upcoming.length !== 1 ? 's' : ''} waiting for you.
                        ${myUpcoming.length > 0 ? `You're signed up for <strong>${myUpcoming.length}</strong> of them.` : 'Start building your journey.'}
                    </p>
                </div>
                <div class="home-rank-card">
                    <div class="home-rank-emoji">${emoji}</div>
                    <div class="home-rank-body">
                        <span class="home-rank-label">YOUR RANK</span>
                        <span class="home-rank-title">${rankTitle}</span>
                        <div class="home-rank-bar-wrap">
                            <div class="home-rank-bar" style="width:${progress}%"></div>
                        </div>
                        <span class="home-rank-hint">
                            ${nextAt === null ? '✨ Maximum rank achieved' : `${activeRegs.length} / ${nextAt} registrations to next rank`}
                        </span>
                    </div>
                </div>
            </div>
            <div class="home-stats-grid">
                <div class="home-stat-card">
                    <span class="home-stat-icon">🎫</span>
                    <span class="home-stat-value">${activeRegs.length}</span>
                    <span class="home-stat-label">Registrations</span>
                </div>
                <div class="home-stat-card">
                    <span class="home-stat-icon">📅</span>
                    <span class="home-stat-value">${myUpcoming.length}</span>
                    <span class="home-stat-label">Coming Up</span>
                </div>
                <div class="home-stat-card">
                    <span class="home-stat-icon">🏛️</span>
                    <span class="home-stat-value">${myPast.length}</span>
                    <span class="home-stat-label">Attended</span>
                </div>
                <div class="home-stat-card">
                    <span class="home-stat-icon">🔬</span>
                    <span class="home-stat-value">${cats.length}</span>
                    <span class="home-stat-label">Categories</span>
                </div>
            </div>
            <div class="home-panels">
                <div class="home-panel">
                    <div class="home-panel-hdr">
                        <h3>Your Upcoming Events</h3>
                        <a href="/my-registrations" class="btn btn-secondary home-panel-action">View All</a>
                    </div>
                    ${myUpcoming.length === 0 ? `
                        <div class="home-empty-panel">
                            <span>🗓️</span>
                            <p>No upcoming registrations yet.</p>
                            <a href="/events" class="btn btn-primary" style="margin-top:.75rem;font-size:.85rem;">Find Events →</a>
                        </div>
                    ` : myUpcoming.slice(0, 4).map(ev => {
                        const daysLeft = Math.ceil((getEventTimestamp(ev) - Date.now()) / 86400000);
                        const cls = daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'soon' : '';
                        return `
                        <div class="home-ev-row home-ev-row--${cls}" onclick="openEventModal(${ev.id})" style="cursor:pointer;">
                            <div class="home-ev-info">
                                <span class="home-ev-title">${escapeHtml(ev.title)}</span>
                                <span class="home-ev-meta">${escapeHtml(ev.category || '')}${ev.location ? ' · ' + escapeHtml(ev.location) : ''}</span>
                            </div>
                            <div class="home-ev-countdown">
                                <span class="home-ev-days">${daysLeft}</span>
                                <span class="home-ev-days-lbl">day${daysLeft !== 1 ? 's' : ''}</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <div class="home-panel">
                    <div class="home-panel-hdr">
                        <h3>Your Profile</h3>
                    </div>
                    ${cats.length === 0 ? `
                        <div class="home-empty-panel">
                            <span>🔭</span>
                            <p>Register for events to build your profile.</p>
                        </div>
                    ` : `
                        <div class="home-cats">
                            ${cats.map(([cat, n]) => `
                            <div class="home-cat-row">
                                <span class="home-cat-name">${escapeHtml(cat)}</span>
                                <div class="home-cat-bar-wrap">
                                    <div class="home-cat-bar" style="width:${Math.round((n/maxCat)*100)}%"></div>
                                </div>
                                <span class="home-cat-n">${n}</span>
                            </div>`).join('')}
                        </div>
                    `}
                    ${achievements.length > 0 ? `
                        <div class="home-achievements">
                            <span class="home-ach-label">ACHIEVEMENTS</span>
                            <div class="home-ach-list">
                                ${achievements.map(a => `
                                <span class="home-ach-badge" title="${escapeHtml(a.label)}">${a.icon} ${escapeHtml(a.label)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            ${notRegistered.length > 0 ? `
            <div class="home-discover">
                <div class="home-panel-hdr" style="margin-bottom:1.25rem;">
                    <h3>Discover What's Next</h3>
                    <a href="/events" class="btn btn-secondary home-panel-action">All Events →</a>
                </div>
                <div class="home-discover-grid">
                    ${notRegistered.slice(0, 3).map(ev => `
                    <div class="home-disc-card" onclick="openEventModal(${ev.id})" style="cursor:pointer;">
                        <span class="home-disc-cat">${escapeHtml(ev.category || 'Event')}</span>
                        <h4 class="home-disc-title">${escapeHtml(ev.title)}</h4>
                        <p class="home-disc-desc">${escapeHtml((ev.description || '').slice(0, 100))}…</p>
                        <div class="home-disc-footer">
                            <span class="home-disc-loc">📍 ${escapeHtml(ev.location || 'TBA')}</span>
                            <div onclick="event.stopPropagation()">
                                <button class="btn btn-primary home-disc-btn" onclick="registerForEvent(${ev.id})">Register</button>
                            </div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>
            ` : `
            <div class="home-allreg-banner">
                <span>🎉</span>
                <div>
                    <strong>You're registered for everything!</strong>
                    <p>You've signed up for all ${upcoming.length} upcoming events. Impressive.</p>
                </div>
                <a href="/events" class="btn btn-secondary">Browse History</a>
            </div>
            `}
        </div>
    `;
    ensureModalInDOM();
}
function renderOrganizerHome(container) {
    const firstName = (localStorage.getItem('user_name') || 'there').split(' ')[0];
    const userId = getCurrentUserId();
    const myEvents = allEvents.filter(e => e.organizerId === userId);
    const myUpcoming = myEvents.filter(isUpcomingEvent).sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
    const myPast = myEvents.filter(e => !isUpcomingEvent(e));
    const totalSeats = myEvents.reduce((s, e) => s + (e.maxParticipants || 0), 0);
    container.innerHTML = `
        <div class="home-wrap">
            <div class="home-greeting">
                <div class="home-greeting-text">
                    <span class="home-greeting-sub">Organizer Dashboard</span>
                    <h2 class="home-greeting-name">${escapeHtml(firstName)} <span class="home-wave">⚡</span></h2>
                    <p class="home-greeting-desc">
                        You have <strong>${myUpcoming.length}</strong> upcoming event${myUpcoming.length !== 1 ? 's' : ''} on the platform.
                        ${allEvents.filter(isUpcomingEvent).length} total upcoming across all organizers.
                    </p>
                </div>
                <div class="home-rank-card">
                    <div class="home-rank-emoji">🎙️</div>
                    <div class="home-rank-body">
                        <span class="home-rank-label">YOUR ROLE</span>
                        <span class="home-rank-title">Event Organizer</span>
                        <span class="home-rank-hint">${myEvents.length} event${myEvents.length !== 1 ? 's' : ''} created on the platform</span>
                    </div>
                </div>
            </div>
            <div class="home-stats-grid">
                <div class="home-stat-card">
                    <span class="home-stat-icon">📅</span>
                    <span class="home-stat-value">${myUpcoming.length}</span>
                    <span class="home-stat-label">Upcoming</span>
                </div>
                <div class="home-stat-card">
                    <span class="home-stat-icon">✅</span>
                    <span class="home-stat-value">${myPast.length}</span>
                    <span class="home-stat-label">Past Events</span>
                </div>
                <div class="home-stat-card">
                    <span class="home-stat-icon">🎯</span>
                    <span class="home-stat-value">${totalSeats}</span>
                    <span class="home-stat-label">Total Seats</span>
                </div>
                <div class="home-stat-card">
                    <span class="home-stat-icon">🌐</span>
                    <span class="home-stat-value">${allEvents.filter(isUpcomingEvent).length}</span>
                    <span class="home-stat-label">Platform Events</span>
                </div>
            </div>
            <div class="home-discover">
                <div class="home-panel-hdr" style="margin-bottom:1.25rem;">
                    <h3>Your Upcoming Events</h3>
                    <a href="/organizer-panel" class="btn btn-primary home-panel-action">Manage Events</a>
                </div>
                ${myUpcoming.length === 0 ? `
                    <div class="home-empty-panel">
                        <span>📭</span>
                        <p>No upcoming events. Head to the Organizer Panel to create one.</p>
                        <a href="/organizer-panel" class="btn btn-primary" style="margin-top:.75rem;font-size:.85rem;">Go to Panel →</a>
                    </div>
                ` : `
                <div class="home-discover-grid">
                    ${myUpcoming.slice(0, 3).map(ev => `
                    <div class="home-disc-card" onclick="openEventModal(${ev.id})" style="cursor:pointer;">
                        <span class="home-disc-cat">${escapeHtml(ev.category || 'Event')}</span>
                        <h4 class="home-disc-title">${escapeHtml(ev.title)}</h4>
                        <p class="home-disc-desc">${escapeHtml((ev.description || '').slice(0, 100))}…</p>
                        <div class="home-disc-footer">
                            <span class="home-disc-loc">📍 ${escapeHtml(ev.location || 'TBA')}</span>
                            <span class="home-disc-loc">${ev.maxParticipants || '∞'} seats</span>
                        </div>
                    </div>`).join('')}
                </div>`}
            </div>
        </div>
    `;
    ensureModalInDOM();
}
function renderGuestHome(container) {
    const upcoming = allEvents.filter(isUpcomingEvent);
    const organizers = [...new Set(allEvents.map(e => e.organizerName).filter(Boolean))];
    const cats = [...new Set(allEvents.map(e => e.category).filter(Boolean))];
    container.innerHTML = `
        <div class="home-wrap">
            <div class="home-guest-banner">
                <div class="home-guest-stats">
                    <div class="home-guest-stat">
                        <span class="home-guest-num">${allEvents.length}</span>
                        <span class="home-guest-lbl">Events on Platform</span>
                    </div>
                    <div class="home-guest-divider"></div>
                    <div class="home-guest-stat">
                        <span class="home-guest-num">${upcoming.length}</span>
                        <span class="home-guest-lbl">Upcoming</span>
                    </div>
                    <div class="home-guest-divider"></div>
                    <div class="home-guest-stat">
                        <span class="home-guest-num">${organizers.length}</span>
                        <span class="home-guest-lbl">Organizers</span>
                    </div>
                    <div class="home-guest-divider"></div>
                    <div class="home-guest-stat">
                        <span class="home-guest-num">${cats.length}</span>
                        <span class="home-guest-lbl">Categories</span>
                    </div>
                </div>
                <p class="home-guest-tagline">Join the UTCN Events community. Track your registrations, build your profile, earn ranks.</p>
                <div class="home-guest-ctas">
                    <a href="/register" class="btn btn-primary">Create Account — It's Free</a>
                    <a href="/login" class="btn btn-secondary">Sign In</a>
                </div>
            </div>
            <div class="home-discover">
                <div class="home-panel-hdr" style="margin-bottom:1.25rem;">
                    <h3>What's Coming Up</h3>
                    <a href="/events" class="btn btn-secondary home-panel-action">All Events →</a>
                </div>
                <div class="home-discover-grid">
                    ${upcoming.slice(0, 3).map(ev => `
                    <div class="home-disc-card" onclick="openEventModal(${ev.id})" style="cursor:pointer;">
                        <span class="home-disc-cat">${escapeHtml(ev.category || 'Event')}</span>
                        <h4 class="home-disc-title">${escapeHtml(ev.title)}</h4>
                        <p class="home-disc-desc">${escapeHtml((ev.description || '').slice(0, 100))}…</p>
                        <div class="home-disc-footer">
                            <span class="home-disc-loc">📍 ${escapeHtml(ev.location || 'TBA')}</span>
                            <div onclick="event.stopPropagation()">
                                <a href="/login" class="btn btn-secondary home-disc-btn">Sign in to Register</a>
                            </div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>
        </div>
    `;
    ensureModalInDOM();
}
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
                dashLi.innerHTML = '<a href="/admin-dashboard">Dashboard</a>';
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
