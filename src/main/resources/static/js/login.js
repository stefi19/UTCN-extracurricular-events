document.addEventListener('DOMContentLoaded', () => {
    injectLoginUX();
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('jwt_token', data.token);
                localStorage.setItem('user_email', data.user?.email || email);
                localStorage.setItem('user_role', data.user?.role || 'STUDENT');
                localStorage.setItem('user_id', String(data.user?.id || ''));
                localStorage.setItem('user_name', `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim());
                if (data.user?.role === 'ORGANIZER') { window.location.href = '/organizer-panel'; return; }
                if (data.user?.role === 'ADMIN')      { window.location.href = '/admin-organizers'; return; }
                window.location.href = '/events';
            } else {
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
function injectLoginUX() {
    wrapWithToggle('password');
    const emailInput = document.getElementById('email');
    if (emailInput) {
        const hint = document.createElement('span');
        hint.className = 'input-hint';
        hint.textContent = 'Use your institutional email: @student.utcluj.ro, @cs.utcluj.ro, etc.';
        emailInput.parentNode.insertBefore(hint, emailInput.nextSibling);
    }
}
function wrapWithToggle(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const wrap = document.createElement('div');
    wrap.className = 'pw-input-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-toggle';
    btn.textContent = 'Show';
    btn.addEventListener('click', () => {
        const isText = input.type === 'text';
        input.type = isText ? 'password' : 'text';
        btn.textContent = isText ? 'Show' : 'Hide';
    });
    wrap.appendChild(btn);
}
