// Fetch and display user's event registrations
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
        container.innerHTML = '<div class="loading">Loading your registrations...</div>';
        
        const response = await fetch(`${API_URL}/api/registrations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
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
    const eventsById = new Map(events.map(event => [event.id, event]));

    displayRegistrations(registrations, eventsById);
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

function displayRegistrations(registrations, eventsById) {
    const container = document.getElementById('registrations-container');
    if (!container) return;

    container.innerHTML = registrations.map(registration => {
        const event = eventsById.get(registration.eventId);
        
        // Handle both date formats
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

        const registeredDate = new Date(registration.registeredAt);
        const formattedRegisteredDate = registeredDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const statusBadge = getStatusBadge(registration.status);
        const eventTitle = event?.title || `Event #${registration.eventId}`;
        const eventDescription = event?.description || 'Event details are currently unavailable.';
        
        return `
            <div class="event-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0;">${escapeHtml(eventTitle)}</h3>
                    ${statusBadge}
                </div>
                <p>${escapeHtml(eventDescription)}</p>
                <div class="meta">
                    <span>Date: ${formattedDate}</span>
                    ${formattedTime ? `<span>Time: ${formattedTime}</span>` : ''}
                </div>
                ${event?.category ? `<div class="meta" style="margin-top: 0.5rem;"><span>Category: ${escapeHtml(event.category)}</span></div>` : ''}
                ${event?.department ? `<div class="meta" style="margin-top: 0.5rem;"><span>Department: ${escapeHtml(event.department)}</span></div>` : ''}
                <div class="meta" style="margin-top: 0.5rem;">
                    <span>Registered on: ${formattedRegisteredDate}</span>
                </div>
                ${registration.status === 'REGISTERED' || registration.status === 'CONFIRMED' ? `
                    <button class="btn" onclick="cancelRegistration(${registration.id})" 
                            style="margin-top: 1rem; width: 100%; background: #dc3545; border-color: #dc3545;">
                        Cancel Registration
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const badges = {
        'REGISTERED': '<span class="badge" style="background: #1f4a77;">Registered</span>',
        'CONFIRMED': '<span class="badge" style="background: #28a745;">Confirmed</span>',
        'PENDING': '<span class="badge" style="background: #ffc107; color: #333;">Pending</span>',
        'CANCELLED': '<span class="badge" style="background: #dc3545;">Cancelled</span>',
        'ATTENDED': '<span class="badge" style="background: #17a2b8;">Attended</span>',
        'NO_SHOW': '<span class="badge" style="background: #6c757d;">No Show</span>'
    };
    return badges[status] || '<span class="badge">Unknown</span>';
}

// Cancel a registration
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
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok || response.status === 204) {
            alert('Registration cancelled successfully.');
            // Reload registrations
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

// Load registrations when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('registrations-container')) {
        fetchMyRegistrations();
    }
});
