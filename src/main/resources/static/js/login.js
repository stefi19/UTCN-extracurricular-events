document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Hide previous errors
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store the JWT token
                localStorage.setItem('jwt_token', data.token);
                localStorage.setItem('user_email', data.user?.email || email);
                localStorage.setItem('user_role', data.user?.role || 'STUDENT');
                localStorage.setItem('user_id', String(data.user?.id || ''));
                localStorage.setItem('user_name', `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim());
                
                // Show success message
                alert('Signed in successfully. Welcome back.');
                
                // Redirect based on role
                if (data.user?.role === 'ORGANIZER') {
                    window.location.href = '/organizer-panel';
                    return;
                }

                if (data.user?.role === 'ADMIN') {
                    window.location.href = '/admin-organizers';
                    return;
                }

                window.location.href = '/events';
            } else {
                // Show error message
                errorMessage.style.display = 'block';
                errorMessage.textContent = data.error || 'The email or password is incorrect. Please try again.';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'We could not sign you in right now. Please try again shortly.';
        }
    });
});
