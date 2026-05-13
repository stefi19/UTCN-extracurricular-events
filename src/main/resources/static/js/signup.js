// Cookie consent banner — loads once, skipped if user already chose
(function () {
    if (localStorage.getItem('cookies_consent')) return;
    var s = document.createElement('script');
    s.src = '/static/js/cookies.js';
    document.head.appendChild(s);
})();

document.addEventListener('DOMContentLoaded', () => {
    injectSignupUX();
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
        if (!passwordMeetsAllRules(password)) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Password does not meet all requirements listed below the field.';
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
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, firstName, lastName }),
            });
            const data = await response.json();
            if (response.ok) {
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
const PW_RULES = [
    { key: 'length',  label: 'At least 8 characters',                test: p => p.length >= 8 },
    { key: 'upper',   label: 'At least one uppercase letter (A–Z)',   test: p => /[A-Z]/.test(p) },
    { key: 'lower',   label: 'At least one lowercase letter (a–z)',   test: p => /[a-z]/.test(p) },
    { key: 'special', label: 'At least one digit or special character', test: p => /[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];
function passwordMeetsAllRules(pw) {
    return PW_RULES.every(r => r.test(pw));
}
function injectSignupUX() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        const hint = document.createElement('span');
        hint.className = 'input-hint';
        hint.textContent = 'Use your institutional email: @student.utcluj.ro, @cs.utcluj.ro, etc.';
        emailInput.parentNode.insertBefore(hint, emailInput.nextSibling);
    }
    wrapSignupToggle('password');
    const pwInput = document.getElementById('password');
    if (pwInput) {
        const box = document.createElement('div');
        box.className = 'pw-requirements';
        box.innerHTML = `<p class="pw-req-title">Password requirements</p><ul>${PW_RULES.map(r => `<li class="pw-req-item" id="rule-${r.key}">${r.label}</li>`).join('')}</ul>`;
        pwInput.closest('.form-group').appendChild(box);
        pwInput.addEventListener('input', () => updatePwRules(pwInput.value));
    }
    wrapSignupToggle('confirmPassword');
    const confirmInput = document.getElementById('confirmPassword');
    if (confirmInput) {
        const hint = document.createElement('span');
        hint.id = 'confirm-hint';
        hint.className = 'confirm-hint';
        confirmInput.closest('.form-group').appendChild(hint);
        const updateConfirm = () => {
            const pw = document.getElementById('password')?.value || '';
            if (!confirmInput.value) { hint.textContent = ''; return; }
            if (confirmInput.value === pw) {
                hint.textContent = '✓ Passwords match';
                hint.className = 'confirm-hint confirm-ok';
            } else {
                hint.textContent = '✗ Passwords do not match';
                hint.className = 'confirm-hint confirm-err';
            }
        };
        confirmInput.addEventListener('input', updateConfirm);
        document.getElementById('password')?.addEventListener('input', updateConfirm);
    }
}
function updatePwRules(pw) {
    PW_RULES.forEach(r => {
        const el = document.getElementById(`rule-${r.key}`);
        if (!el) return;
        el.classList.toggle('met', r.test(pw));
    });
}
function wrapSignupToggle(inputId) {
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
