var LCEvents = {
  init: function() {
    var signInBtn = document.getElementById('google-signin-btn');
    if (signInBtn) signInBtn.addEventListener('click', function() { window.location.href = '/authentication'; });

    var signOutBtn = document.getElementById('sign-out-link');
    if (signOutBtn) signOutBtn.addEventListener('click', function() { Auth.showLogoutConfirm(); });

    var mobileSignInBtn = document.getElementById('mobile-signin-btn');
    if (mobileSignInBtn) mobileSignInBtn.addEventListener('click', function() { window.location.href = '/authentication'; });

    var hamburger = document.getElementById('hamburger-btn');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    if (hamburger && sidebar && overlay) {
      hamburger.addEventListener('click', function(e) {
        e.preventDefault();
        if (sidebar.classList.contains('open')) {
          sidebar.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow = '';
        } else {
          sidebar.classList.add('open'); overlay.classList.add('active'); document.body.style.overflow = 'hidden';
        }
      });
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow = '';
      });
    }

    this.initTheme();
    LCFeed.fetchDoors().then(function() { LCFeed.renderGate(); });
    if (typeof LCRightPanel !== 'undefined') LCRightPanel.update();
    Auth.updateUI();
  },

  submitReport: async function(doorId) {
    var content = document.getElementById('report-content').value.trim();
    if (!content || content.length < 5) { Toast.show('Please write at least 5 characters'); return; }

    var res = await API.post('/listening-chamber/submit', {
      door: doorId,
      content: content
    });

    if (res.success && res.data) {
      LCFeed.renderCode(res.data.code);
    } else {
      Toast.show(res.message || 'Failed to submit');
    }
  },

  checkReport: async function() {
    var code = document.getElementById('check-code-input').value.trim();
    if (!code) { Toast.show('Enter a code'); return; }

    var res = await API.get('/listening-chamber/check/' + code);
    var resultDiv = document.getElementById('check-result');
    if (!resultDiv) return;

    if (res.success && res.data) {
      resultDiv.innerHTML =
        '<div class="chamber-response-card">' +
          '<div class="chamber-response-label">Response from admin</div>' +
          '<div class="chamber-response-text">' + KSSecurity.esc(res.data.adminResponse || 'No response yet.') + '</div>' +
          '<div class="chamber-response-meta">Door ' + res.data.door + ' &middot; ' + new Date(res.data.createdAt).toLocaleDateString() + ' &middot; Status: ' + KSSecurity.esc(res.data.status) + '</div>' +
        '</div>';
    } else {
      resultDiv.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px;">No report found with that code.</div>';
    }
  },

  initTheme: function() {
    var themeBtn = document.getElementById('theme-toggle-sidebar');
    if (!themeBtn) return;
    if (localStorage.getItem('hivoraa-theme') === 'light') {
      document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light');
      themeBtn.querySelector('.icon-sun').classList.add('hidden');
      themeBtn.querySelector('.icon-moon').classList.remove('hidden');
    }
    themeBtn.addEventListener('click', function() {
      var isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light');
        this.querySelector('.icon-sun').classList.add('hidden'); this.querySelector('.icon-moon').classList.remove('hidden');
        localStorage.setItem('hivoraa-theme', 'light');
      } else {
        document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark');
        this.querySelector('.icon-sun').classList.remove('hidden'); this.querySelector('.icon-moon').classList.add('hidden');
        localStorage.setItem('hivoraa-theme', 'dark');
      }
    });
  }
};