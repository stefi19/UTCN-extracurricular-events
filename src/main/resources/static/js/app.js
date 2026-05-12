// Simple API helper
const API_URL = 'http://localhost:8080';
let allEvents = [];
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

async function fetchEvents() {
    const container = document.getElementById('events-container');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading">Loading events...</div>';
        
        const response = await fetch(`${API_URL}/api/events`);
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        
        allEvents = await response.json();

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
        // Handle both date formats
        let formattedDate = 'TBA';
        let formattedTime = '';
        
        if (event.date) {
            // Simple date format from our schema
            formattedDate = event.date;
        } else if (event.startTime) {
            const startDate = new Date(event.startTime);
            formattedDate = startDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            formattedTime = startDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        let registerButton = `<a href="/login" class="btn" style="margin-top: 1rem; display: block; text-align: center;">Login to Register</a>`;
        if (loggedIn && userRole === 'STUDENT') {
            registerButton = `<button class="btn btn-primary" onclick="registerForEvent(${event.id})" style="margin-top: 1rem; width: 100%;">Register for Event</button>`;
        } else if (loggedIn && (userRole === 'ORGANIZER' || userRole === 'ADMIN')) {
            registerButton = `<a href="/organizer-panel" class="btn btn-secondary" style="margin-top: 1rem; display: block; text-align: center;">Manage from Organizer Panel</a>`;
        }
        
        return `
            <div class="event-card">
                <h3>${escapeHtml(event.title)}</h3>
                <p>${escapeHtml(event.description || 'No description available')}</p>
                <div class="meta">
                    <span>Date: ${formattedDate}</span>
                    ${formattedTime ? `<span>Time: ${formattedTime}</span>` : ''}
                </div>
                ${event.category ? `<div class="meta" style="margin-top: 0.5rem;"><span>Type: ${escapeHtml(event.category)}</span></div>` : ''}
                ${event.department ? `<div class="meta" style="margin-top: 0.5rem;"><span>Department: ${escapeHtml(event.department)}</span></div>` : ''}
                <div class="meta" style="margin-top: 0.5rem;"><span>Organizer: ${escapeHtml(getOrganizerLabel(event))}</span></div>
                ${event.location ? `<div class="meta" style="margin-top: 0.5rem;"><span>Location: ${escapeHtml(event.location)}</span></div>` : ''}
                ${registerButton}
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
            alert('You have been registered for the event successfully.');
            // Optionally reload events to update UI
            fetchEvents();
        } else {
            alert(`Registration failed: ${data.error || data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred while registering. Please try again.');
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
