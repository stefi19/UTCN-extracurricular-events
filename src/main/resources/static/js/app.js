// Simple API helper
const API_URL = 'http://localhost:8080';

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
        
        const events = await response.json();
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Events Available</h3>
                    <p>There are no events at the moment. Please check back soon.</p>
                </div>
            `;
            return;
        }
        
        displayEvents(events);
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

function displayEvents(events) {
    const container = document.getElementById('events-container');
    if (!container) return;

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
                ${event.category ? `<div class="meta" style="margin-top: 0.5rem;"><span>Category: ${escapeHtml(event.category)}</span></div>` : ''}
                ${event.department ? `<div class="meta" style="margin-top: 0.5rem;"><span>Department: ${escapeHtml(event.department)}</span></div>` : ''}
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

            if (!document.getElementById('nav-admin-organizers-link')) {
                const adminLi = document.createElement('li');
                adminLi.id = 'nav-admin-organizers-link';
                adminLi.innerHTML = '<a href="/admin-organizers">Admin Organizers</a>';
                navUl.appendChild(adminLi);
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
