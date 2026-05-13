/**
 * Cookie Consent Banner
 * Shows once per browser; remembers the user's choice in localStorage.
 */
(function () {
    'use strict';

    const PREF_KEY = 'cookies_consent';

    // Already decided — nothing to do
    if (localStorage.getItem(PREF_KEY)) return;

    var COOKIES_INFO = [
        {
            name:     'auth_token',
            purpose:  'Keeps you securely signed in across pages. HttpOnly — invisible to JavaScript and cannot be accessed by scripts.',
            type:     'Strictly Necessary',
            duration: '24 hours'
        }
    ];

    function buildBanner() {
        // --- Overlay (semi-transparent backdrop) ---
        var overlay = document.createElement('div');
        overlay.id = 'cookie-overlay';

        // --- Banner card ---
        var banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-labelledby', 'cookie-banner-title');
        banner.setAttribute('aria-modal', 'true');

        // Header row
        var header = document.createElement('div');
        header.className = 'cookie-banner-header';

        var titleEl = document.createElement('span');
        titleEl.id = 'cookie-banner-title';
        titleEl.className = 'cookie-banner-title';
        titleEl.innerHTML = '🍪 Cookie Preferences';

        var toggleBtn = document.createElement('button');
        toggleBtn.id = 'cookie-details-toggle';
        toggleBtn.className = 'cookie-details-toggle';
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-controls', 'cookie-details-panel');
        toggleBtn.innerHTML = 'Details <span class="cookie-chevron" aria-hidden="true">▼</span>';

        header.appendChild(titleEl);
        header.appendChild(toggleBtn);

        // Description
        var desc = document.createElement('p');
        desc.className = 'cookie-banner-desc';
        desc.textContent =
            'We use cookies solely to keep you signed in securely. ' +
            'No tracking, advertising, or analytics cookies are used.';

        // Details panel
        var detailsPanel = document.createElement('div');
        detailsPanel.id = 'cookie-details-panel';
        detailsPanel.className = 'cookie-details-panel';
        detailsPanel.hidden = true;

        var table = document.createElement('table');
        table.className = 'cookie-table';
        table.innerHTML =
            '<thead><tr>' +
            '<th>Cookie</th>' +
            '<th>Purpose</th>' +
            '<th>Type</th>' +
            '<th>Duration</th>' +
            '</tr></thead>';

        var tbody = document.createElement('tbody');
        COOKIES_INFO.forEach(function (c) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><code>' + c.name + '</code></td>' +
                '<td>' + c.purpose + '</td>' +
                '<td><span class="cookie-badge">' + c.type + '</span></td>' +
                '<td>' + c.duration + '</td>';
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        detailsPanel.appendChild(table);

        var note = document.createElement('p');
        note.className = 'cookie-note';
        note.textContent =
            'Strictly necessary cookies are always active — ' +
            'they are required for the site to function and are never shared with third parties.';
        detailsPanel.appendChild(note);

        // Action buttons
        var actions = document.createElement('div');
        actions.className = 'cookie-actions';

        var acceptBtn = document.createElement('button');
        acceptBtn.id = 'cookie-accept-btn';
        acceptBtn.className = 'btn btn-primary cookie-btn';
        acceptBtn.textContent = 'Accept All';

        var necessaryBtn = document.createElement('button');
        necessaryBtn.id = 'cookie-necessary-btn';
        necessaryBtn.className = 'btn btn-secondary cookie-btn';
        necessaryBtn.textContent = 'Necessary Only';

        actions.appendChild(acceptBtn);
        actions.appendChild(necessaryBtn);

        // Assemble banner
        banner.appendChild(header);
        banner.appendChild(desc);
        banner.appendChild(detailsPanel);
        banner.appendChild(actions);
        overlay.appendChild(banner);
        document.body.appendChild(overlay);

        // --- Interactions ---

        // Toggle details
        toggleBtn.addEventListener('click', function () {
            var isOpen = detailsPanel.hidden === false;
            detailsPanel.hidden = isOpen;
            toggleBtn.setAttribute('aria-expanded', String(!isOpen));
            toggleBtn.querySelector('.cookie-chevron').textContent = isOpen ? '▼' : '▲';
        });

        // Dismiss with fade-out
        function dismiss(choice) {
            localStorage.setItem(PREF_KEY, choice);
            overlay.classList.add('cookie-fade-out');
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 350);
        }

        acceptBtn.addEventListener('click', function () { dismiss('accepted'); });
        necessaryBtn.addEventListener('click', function () { dismiss('necessary'); });

        // Trap focus inside banner while it's open
        banner.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab') return;
            var focusable = banner.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            var first = focusable[0];
            var last  = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
            }
        });

        // Auto-focus first button for accessibility
        setTimeout(function () { acceptBtn.focus(); }, 50);
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildBanner);
    } else {
        buildBanner();
    }
})();
