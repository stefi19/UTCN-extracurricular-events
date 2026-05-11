// Fetch and display user's event registrations
async function fetchMyRegistrations() {
    const container = document.getElementById('registrations-container');
    if (!container) return;

    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Please Login</h3>
                <p>You need to be logged in to view your registrations.</p>
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
                        <p>Your session has expired. Please login again.</p>
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
                    <p>You haven't registered for any events yet.</p>
                    <a href="/events" class="btn btn-primary" style="margin-top: 1rem;">Browse Events</a>
                </div>
            `;
            return;
        }
        
        displayRegistrations(registrations);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to Load Registrations</h3>
                <p>Please try again later or contact support.</p>
            </div>
        `;
    }
}

function displayRegistrations(registrations) {
    const container = document.getElementById('registrations-container');
    if (!container) return;

    container.innerHTML = registrations.map(registration => {
        const event = registration.event;
        
        // Handle both date formats
        let formattedDate = 'TBA';
        let formattedTime = '';
        
        if (event.date) {
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

        const registeredDate = new Date(registration.registeredAt);
        const formattedRegisteredDate = registeredDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const statusBadge = getStatusBadge(registration.status);
        
        return `
            <div class="event-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0;">${escapeHtml(event.title)}</h3>
                    ${statusBadge}
                </div>
                <p>${escapeHtml(event.description || 'No description available')}</p>
                <div class="meta">
                    <span>📅 ${formattedDate}</span>
                    ${formattedTime ? `<span>🕒 ${formattedTime}</span>` : ''}
                </div>
                ${event.category ? `<div class="meta" style="margin-top: 0.5rem;"><span>🏷️ ${escapeHtml(event.category)}</span></div>` : ''}
                ${event.department ? `<div class="meta" style="margin-top: 0.5rem;"><span>🏛️ ${escapeHtml(event.department)}</span></div>` : ''}
                <div class="meta" style="margin-top: 0.5rem;">
                    <span>📝 Registered: ${formattedRegisteredDate}</span>
                </div>
                ${registration.status === 'CONFIRMED' ? `
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
        'CONFIRMED': '<span class="badge" style="background: #28a745;">✓ Confirmed</span>',
        'PENDING': '<span class="badge" style="background: #ffc107; color: #333;">⏳ Pending</span>',
        'CANCELLED': '<span class="badge" style="background: #dc3545;">✗ Cancelled</span>',
        'ATTENDED': '<span class="badge" style="background: #17a2b8;">★ Attended</span>'
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
        alert('Please login to cancel registrations');
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
            alert('✅ Registration cancelled successfully!');
            // Reload registrations
            fetchMyRegistrations();
        } else {
            const data = await response.json();
            alert(`❌ Cancellation failed: ${data.error || data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Cancellation error:', error);
        alert('❌ An error occurred during cancellation. Please try again.');
    }
}

// Load registrations when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('registrations-container')) {
        fetchMyRegistrations();
    }
});
