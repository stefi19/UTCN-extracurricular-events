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
                localStorage.setItem('user_email', email);
                
                // Show success message
                alert('Signed in successfully. Welcome back.');
                
                // Redirect to events page
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
