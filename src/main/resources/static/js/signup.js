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
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        if (password !== confirmPassword) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'The passwords do not match.';
            return;
        }
        if (password.length < 8) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Password must be at least 8 characters long.';
            return;
        }
        const emailPattern = /@[a-zA-Z0-9.-]+\.utcluj\.ro$/;
        if (!emailPattern.test(email)) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Please use your institutional email address (for example: @student.utcluj.ro, @cs.utcluj.ro).';
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
                alert('Account created successfully. You can sign in now.');
                window.location.href = '/login';
            } else {
                errorMessage.style.display = 'block';
                errorMessage.textContent = data.error || data.message || 'We could not complete registration. Please try again.';
            }
        } catch (error) {
            console.error('Signup error:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'A temporary error occurred. Please try again shortly.';
        }
    });
});
