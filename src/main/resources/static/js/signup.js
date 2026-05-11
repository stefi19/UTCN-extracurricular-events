document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const errorMessage = document.getElementById('error-message');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Hide previous errors
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Validate passwords match
        if (password !== confirmPassword) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Passwords do not match!';
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Password must be at least 8 characters long!';
            return;
        }

        // Validate UTCLUJ email (must end with @*.utcluj.ro)
        const emailPattern = /@[a-zA-Z0-9.-]+\.utcluj\.ro$/;
        if (!emailPattern.test(email)) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Please use your UTCLUJ email address (e.g., @student.utcluj.ro, @cs.utcluj.ro)';
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    firstName,
                    lastName
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                alert('Account created successfully! Please login with your credentials.');
                
                // Redirect to login page
                window.location.href = '/login';
            } else {
                // Show error message
                errorMessage.style.display = 'block';
                errorMessage.textContent = data.error || data.message || 'Registration failed. Please try again.';
            }
        } catch (error) {
            console.error('Signup error:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'An error occurred. Please try again later.';
        }
    });
});
