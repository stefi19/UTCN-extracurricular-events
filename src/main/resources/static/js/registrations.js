let allRegistrations = [];
let allEventsById = new Map();
let selectedStatusFilter = 'ALL';
let selectedSortOrder = 'NEWEST';
async function fetchMyRegistrations() {
    const container = document.getElementById('registrations-container');
    if (!container) return;
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Sign In Required</h3>
                <p>Please sign in to view your registrations.</p>
                <a href="/login" class="btn btn-primary" style="margin-top: 1rem;">Login</a>
            </div>
        `;
        return;
    }
    try {
        container.innerHTML = '<div class="loading">Loading your registrations.</div>';
        const response = await fetch(`${API_URL}/api/registrations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_email');
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>Session Expired</h3>
                        <p>Your session has expired. Please sign in again.</p>
                        <a href="/login" class="btn btn-primary" style="margin-top: 1rem;">Login</a>
                    </div>
                `;
                return;
            }
            throw new Error('Failed to fetch registrations');
        }
        const registrations = await response.json();
        if (registrations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Registrations Yet</h3>
                    <p>You have not registered for any events yet.</p>
                    <a href="/events" class="btn btn-primary" style="margin-top: 1rem;">Browse Events</a>
                </div>
            `;
            return;
        }
        const eventsResponse = await fetch(`${API_URL}/api/events`);
        const events = eventsResponse.ok ? await eventsResponse.json() : [];
        allRegistrations = registrations;
        allEventsById = new Map(events.map(event => [event.id, event]));
        renderRegistrationsPage();
    } catch (error) {
        console.error('Error fetching registrations:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load Registrations</h3>
                <p>We could not load your registrations right now. Please try again shortly.</p>
            </div>
        `;
    }
}
function renderRegistrationsPage() {
    const container = document.getElementById('registrations-container');
    if (!container) return;
    const filteredRegistrations = applyFiltersAndSorting(allRegistrations);
    const summary = calculateSummary(allRegistrations);
    container.innerHTML = `
        <div class="manage-panel">
            <div class="manage-panel-header">
                <h3>Manage Registrations</h3>
                <p>Review all registrations, filter by status, and cancel active entries.</p>
            </div>
            <div class="manage-panel-controls">
                <div class="manage-control-group">
                    <label for="status-filter">Status</label>
                    <select id="status-filter">
                        <option value="ALL" ${selectedStatusFilter === 'ALL' ? 'selected' : ''}>All</option>
                        <option value="REGISTERED" ${selectedStatusFilter === 'REGISTERED' ? 'selected' : ''}>Registered</option>
                        <option value="WAITLISTED" ${selectedStatusFilter === 'WAITLISTED' ? 'selected' : ''}>Waiting List</option>
                        <option value="CONFIRMED" ${selectedStatusFilter === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                        <option value="PENDING" ${selectedStatusFilter === 'PENDING' ? 'selected' : ''}>Pending</option>
                        <option value="CANCELLED" ${selectedStatusFilter === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                        <option value="ATTENDED" ${selectedStatusFilter === 'ATTENDED' ? 'selected' : ''}>Attended</option>
                        <option value="NO_SHOW" ${selectedStatusFilter === 'NO_SHOW' ? 'selected' : ''}>No Show</option>
                    </select>
                </div>
                <div class="manage-control-group">
                    <label for="sort-order">Sort by</label>
                    <select id="sort-order">
                        <option value="NEWEST" ${selectedSortOrder === 'NEWEST' ? 'selected' : ''}>Newest first</option>
                        <option value="OLDEST" ${selectedSortOrder === 'OLDEST' ? 'selected' : ''}>Oldest first</option>
                        <option value="EVENT_ASC" ${selectedSortOrder === 'EVENT_ASC' ? 'selected' : ''}>Event title A–Z</option>
                        <option value="EVENT_DESC" ${selectedSortOrder === 'EVENT_DESC' ? 'selected' : ''}>Event title Z–A</option>
                    </select>
                </div>
            </div>
            <div class="manage-summary-grid">
                <div class="manage-summary-card"><strong>${summary.total}</strong><span>Total</span></div>
                <div class="manage-summary-card"><strong>${summary.active}</strong><span>Active</span></div>
                <div class="manage-summary-card"><strong>${summary.cancelled}</strong><span>Cancelled</span></div>
                <div class="manage-summary-card"><strong>${summary.completed}</strong><span>Completed</span></div>
            </div>
        </div>
        <div class="registrations-grid" id="managed-registrations-list">
            ${renderRegistrationCards(filteredRegistrations)}
        </div>
    `;
    attachManagePanelListeners();
}
function applyFiltersAndSorting(registrations) {
    const statusFiltered = selectedStatusFilter === 'ALL'
        ? [...registrations]
        : registrations.filter(registration => registration.status === selectedStatusFilter);
    const sortByRegisteredAt = (left, right) => {
        const leftTime = left.registeredAt ? new Date(left.registeredAt).getTime() : 0;
        const rightTime = right.registeredAt ? new Date(right.registeredAt).getTime() : 0;
        return leftTime - rightTime;
    };
    const sortByEventName = (left, right) => {
        const leftEvent = allEventsById.get(left.eventId);
        const rightEvent = allEventsById.get(right.eventId);
        const leftName = (leftEvent?.title || `Event #${left.eventId}`).toLowerCase();
        const rightName = (rightEvent?.title || `Event #${right.eventId}`).toLowerCase();
        return leftName.localeCompare(rightName);
    };
    if (selectedSortOrder === 'NEWEST') {
        return statusFiltered.sort((left, right) => sortByRegisteredAt(right, left));
    }
    if (selectedSortOrder === 'OLDEST') {
        return statusFiltered.sort(sortByRegisteredAt);
    }
    if (selectedSortOrder === 'EVENT_ASC') {
        return statusFiltered.sort(sortByEventName);
    }
    return statusFiltered.sort((left, right) => sortByEventName(right, left));
}
function calculateSummary(registrations) {
    const isActiveStatus = status => status === 'REGISTERED' || status === 'WAITLISTED' || status === 'CONFIRMED' || status === 'PENDING';
    const isCompletedStatus = status => status === 'ATTENDED' || status === 'NO_SHOW';
    return {
        total: registrations.length,
        active: registrations.filter(registration => isActiveStatus(registration.status)).length,
        cancelled: registrations.filter(registration => registration.status === 'CANCELLED').length,
        completed: registrations.filter(registration => isCompletedStatus(registration.status)).length
    };
}
function formatSeats(event) {
    if (!event || event.maxParticipants == null) return null;
    const available = event.availableSeats ?? Math.max(event.maxParticipants - (event.registeredCount || 0), 0);
    const waitlisted = event.waitlistedCount || 0;
    const waitlistText = waitlisted > 0 ? ` · ${waitlisted} waiting` : '';
    return `${available}/${event.maxParticipants} seats available${waitlistText}`;
}
function renderRegistrationCards(registrations) {
    if (registrations.length === 0) {
        return `
            <div class="empty-state">
                <h3>No registrations for this filter</h3>
                <p>Try a different status or sorting option.</p>
            </div>
        `;
    }
    return registrations.map(registration => {
        const event = allEventsById.get(registration.eventId);
        const eventTitle = event?.title || `Event #${registration.eventId}`;
        const eventDescription = event?.description || 'Event details are currently unavailable.';
        let formattedDate = 'TBA';
        let formattedTime = '';
        if (event?.date) {
            formattedDate = event.date;
        } else if (event?.startTime) {
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
        const registeredDate = registration.registeredAt
            ? new Date(registration.registeredAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
            : 'Unknown';
        const seatsText = formatSeats(event);
        const cancelButton = registration.status === 'REGISTERED' || registration.status === 'WAITLISTED' || registration.status === 'CONFIRMED'
            ? `<button class="btn btn-manage-cancel" onclick="cancelRegistration(${registration.id})">Cancel Registration</button>`
            : '';
        return `
            <div class="reg-card">
                <div class="reg-card-main">
                    <div class="reg-card-title-row">
                        <h3>${escapeHtml(eventTitle)}</h3>
                        ${getStatusBadge(registration.status)}
                    </div>
                    <p class="reg-card-desc">${escapeHtml(eventDescription)}</p>
                </div>
                <div class="reg-card-side">
                    <div class="reg-card-meta">
                        <div class="reg-meta-item"><span class="reg-meta-label">Date</span><span>${formattedDate}${formattedTime ? ' · ' + formattedTime : ''}</span></div>
                        ${event?.category ? `<div class="reg-meta-item"><span class="reg-meta-label">Category</span><span>${escapeHtml(event.category)}</span></div>` : ''}
                        ${event?.department ? `<div class="reg-meta-item"><span class="reg-meta-label">Department</span><span>${escapeHtml(event.department)}</span></div>` : ''}
                        ${event?.location ? `<div class="reg-meta-item"><span class="reg-meta-label">Location</span><span>${escapeHtml(event.location)}</span></div>` : ''}
                        ${seatsText ? `<div class="reg-meta-item"><span class="reg-meta-label">Seats</span><span>${escapeHtml(seatsText)}</span></div>` : ''}
                        <div class="reg-meta-item"><span class="reg-meta-label">Registered on</span><span>${registeredDate}</span></div>
                    </div>
                    ${cancelButton ? `<div class="reg-card-actions">${cancelButton}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}
function attachManagePanelListeners() {
    const statusFilterElement = document.getElementById('status-filter');
    const sortOrderElement = document.getElementById('sort-order');
    if (statusFilterElement) {
        statusFilterElement.addEventListener('change', event => {
            selectedStatusFilter = event.target.value;
            renderRegistrationsPage();
        });
    }
    if (sortOrderElement) {
        sortOrderElement.addEventListener('change', event => {
            selectedSortOrder = event.target.value;
            renderRegistrationsPage();
        });
    }
}
function getStatusBadge(status) {
    const badgeConfig = {
        REGISTERED: 'badge-registered',
        WAITLISTED: 'badge-waitlisted',
        CONFIRMED: 'badge-confirmed',
        PENDING: 'badge-pending',
        CANCELLED: 'badge-cancelled',
        ATTENDED: 'badge-attended',
        NO_SHOW: 'badge-no-show'
    };
    const cssClass = badgeConfig[status] || 'badge-default';
    const statusLabel = status.replace('_', ' ');
    return `<span class="badge ${cssClass}">${statusLabel}</span>`;
}
async function cancelRegistration(registrationId) {
    if (!confirm('Are you sure you want to cancel this registration?')) {
        return;
    }
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        alert('Please sign in to cancel registrations.');
        window.location.href = '/login';
        return;
    }
    try {
        const response = await fetch(`${API_URL}/api/registrations/${registrationId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (response.ok || response.status === 204) {
            alert('Registration cancelled successfully.');
            fetchMyRegistrations();
        } else {
            const data = await response.json();
            alert(`Cancellation failed: ${data.error || data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Cancellation error:', error);
        alert('An error occurred while cancelling. Please try again.');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('registrations-container')) {
        fetchMyRegistrations();
    }
});
