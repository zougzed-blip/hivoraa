var TCEvents = {
  init: function() {
    var signInBtn = document.getElementById('google-signin-btn');
    if (signInBtn) signInBtn.addEventListener('click', function() { window.location.href = '/auth-test.html'; });

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
    TCFeed.fetchRooms();
    if (typeof TCRightPanel !== 'undefined') TCRightPanel.update();
    Auth.updateUI();
  },

  postMessage: async function(roomId) {
    var pseudo = document.getElementById('pseudo-input').value.trim() || 'Anonymous';
    var text = document.getElementById('message-input').value.trim();
    if (!text) { Toast.show('Write a message first'); return; }

    var res = await API.post('/trust-circle/rooms/' + roomId, {
      temporaryPseudonym: KSSecurity.sanitize(pseudo),
      content: KSSecurity.sanitize(text)
    });

    if (res.success) {
      document.getElementById('message-input').value = '';
      TCFeed.loadMessages(roomId);
      Toast.show('Message posted');
    } else {
      Toast.show(res.message || 'Failed to post');
    }
  },

  toggleLike: async function(msgId) {
    if (!Auth.isLoggedIn()) { Toast.show('Sign in to like'); return; }
    var res = await API.post('/trust-circle/messages/' + msgId + '/like');
    if (res.success && TCState.currentRoom) {
      TCFeed.loadMessages(TCState.currentRoom);
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