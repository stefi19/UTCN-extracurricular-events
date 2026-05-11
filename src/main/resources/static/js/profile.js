// Profile page functionality
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    loadProfile();
    loadProfileRegistrations();
});

async function loadProfile() {
    const token = localStorage.getItem('jwt_token');
    const container = document.getElementById('profile-container');
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const user = await response.json();
        displayProfile(user);
    } catch (error) {
        console.error('Error loading profile:', error);
        container.innerHTML = `
            <div class="error">
                <p>Failed to load profile. Please try again.</p>
            </div>
        `;
    }
}

function displayProfile(user) {
    const container = document.getElementById('profile-container');
    
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar">
                    ${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}
                </div>
                <div class="profile-info">
                    <h3>${user.firstName} ${user.lastName}</h3>
                    <p class="profile-email">${user.email}</p>
                    <span class="badge badge-${user.role.toLowerCase()}">${user.role}</span>
                </div>
            </div>
            
            <button id="edit-profile-btn" class="btn-primary" style="margin-top: 1rem;">
                Edit Profile
            </button>
            
            <form id="edit-profile-form" class="edit-profile-form" style="display: none;">
                <h4>Update Your Details</h4>
                
                <div class="form-group">
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value="${user.firstName}" required>
                </div>
                
                <div class="form-group">
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value="${user.lastName}" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" value="${user.email}" required>
                </div>
                
                <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #ddd;">
                
                <h4>Password Update (Optional)</h4>
                <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
                    Leave these fields empty if you do not want to change your password.
                </p>
                
                <div class="form-group">
                    <label for="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" name="currentPassword" 
                           placeholder="Required for email or password changes">
                </div>
                
                <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" 
                           placeholder="Minimum 8 characters">
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" 
                           placeholder="Repeat your new password">
                </div>
                
                <div id="update-error" class="error" style="display: none;"></div>
                <div id="update-success" class="success" style="display: none;"></div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Save Profile</button>
                    <button type="button" id="cancel-edit-btn" class="btn-secondary">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('edit-profile-btn').addEventListener('click', showEditForm);
    document.getElementById('cancel-edit-btn').addEventListener('click', hideEditForm);
    document.getElementById('edit-profile-form').addEventListener('submit', handleProfileUpdate);
}

function showEditForm() {
    document.getElementById('edit-profile-btn').style.display = 'none';
    document.getElementById('edit-profile-form').style.display = 'block';
}

function hideEditForm() {
    document.getElementById('edit-profile-form').style.display = 'none';
    document.getElementById('edit-profile-btn').style.display = 'block';
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Clear messages
    document.getElementById('update-error').style.display = 'none';
    document.getElementById('update-success').style.display = 'none';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('update-error');
    const successDiv = document.getElementById('update-success');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!firstName || !lastName || !email) {
        errorDiv.textContent = 'First name, last name, and email are required';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Email validation for UTCLUJ domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*\.utcluj\.ro$/;
    if (!emailRegex.test(email)) {
    errorDiv.textContent = 'Please use an institutional email in the format username@*.utcluj.ro (for example: john@student.utcluj.ro).';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Password change validation
    if (newPassword || confirmPassword) {
        if (!currentPassword) {
            errorDiv.textContent = 'Current password is required to change password';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            errorDiv.textContent = 'New passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (newPassword.length < 8) {
            errorDiv.textContent = 'New password must be at least 8 characters';
            errorDiv.style.display = 'block';
            return;
        }
    }
    
    // Build update request
    const updateData = {
        firstName,
        lastName,
        email
    };
    
    // Add password fields if changing password or email
    if (newPassword || email !== document.getElementById('email').defaultValue) {
        if (currentPassword) {
            updateData.currentPassword = currentPassword;
        }
        if (newPassword) {
            updateData.newPassword = newPassword;
        }
    }
    
    // Check if email changed and require current password
    const originalEmail = document.getElementById('email').defaultValue;
    if (email !== originalEmail && !currentPassword) {
        errorDiv.textContent = 'Current password is required to change email';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
    const token = localStorage.getItem('jwt_token');
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }
        
        const updatedUser = await response.json();
        
    successDiv.textContent = 'Profile updated successfully.';
        successDiv.style.display = 'block';
        
        // Reload profile after 1.5 seconds
        setTimeout(() => {
            loadProfile();
            hideEditForm();
        }, 1500);
        
    } catch (error) {
        console.error('Error updating profile:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}

async function loadProfileRegistrations() {
    const token = localStorage.getItem('jwt_token');
    const container = document.getElementById('profile-registrations-container');
    
    try {
        const response = await fetch('/api/registrations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load registrations');
        }
        
    const registrations = await response.json();

    const eventsResponse = await fetch('/api/events');
    const events = eventsResponse.ok ? await eventsResponse.json() : [];
    const eventsById = new Map(events.map(event => [event.id, event]));

    displayProfileRegistrations(registrations, eventsById);
    } catch (error) {
        console.error('Error loading registrations:', error);
        container.innerHTML = `
            <div class="error">
                <p>Failed to load registrations.</p>
            </div>
        `;
    }
}

function displayProfileRegistrations(registrations, eventsById) {
    const container = document.getElementById('profile-registrations-container');
    
    if (registrations.length === 0) {
        container.innerHTML = `
            <p style="color: #666;">You haven't registered for any events yet.</p>
            <a href="/events" class="btn-primary" style="display: inline-block; margin-top: 1rem;">
                Browse Events
            </a>
        `;
        return;
    }
    
    // Show only the most recent 3 registrations
    const recentRegistrations = registrations.slice(0, 3);
    
    container.innerHTML = `
        <div class="registrations-list">
            ${recentRegistrations.map(registration => {
                const event = eventsById.get(registration.eventId);
                const eventTitle = event?.title || `Event #${registration.eventId}`;
                const eventDate = event?.date || 'TBA';
                const eventCategory = event?.category || 'General';

                return `
                <div class="registration-item">
                    <div class="registration-header">
                        <h4>${eventTitle}</h4>
                        <span class="badge badge-${registration.status.toLowerCase()}">${registration.status}</span>
                    </div>
                    <p class="registration-meta">
                        ${eventDate} · ${eventCategory}
                    </p>
                    <p class="registration-date">
                        Registered: ${new Date(registration.registeredAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            `;
            }).join('')}
        </div>
        ${registrations.length > 3 ? `
            <a href="/my-registrations" class="btn-secondary" style="display: inline-block; margin-top: 1rem;">
                View All Registrations (${registrations.length})
            </a>
        ` : ''}
    `;
}
