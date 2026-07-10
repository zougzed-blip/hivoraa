var Auth = {
  isLoggedIn: function() {
    return document.cookie.indexOf('token=') !== -1;
  },

  getUser: function() {
    var u = localStorage.getItem('hivoraa_user');
    return u ? JSON.parse(u) : null;
  },

  setUser: function(user) {
    localStorage.setItem('hivoraa_user', JSON.stringify(user));
  },

  showLogoutConfirm: function() {
    if (document.getElementById('logout-confirm-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'logout-confirm-modal';
    modal.className = 'confirm-modal';
    modal.innerHTML = [
      '<div class="confirm-card">',
      '  <div class="confirm-title">Sign out?</div>',
      '  <div class="confirm-text">Are you sure you want to leave this session?</div>',
      '  <div class="confirm-actions">',
      '    <button class="confirm-btn cancel" id="logout-cancel-btn">No</button>',
      '    <button class="confirm-btn confirm" id="logout-confirm-btn">Yes</button>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);

    document.getElementById('logout-cancel-btn').addEventListener('click', function() {
      modal.remove();
    });

    document.getElementById('logout-confirm-btn').addEventListener('click', function() {
      modal.remove();
      Auth.logout();
    });
  },

  logout: async function() {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed, continuing local logout', error);
    }

    localStorage.removeItem('hivoraa_user');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'x-csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    this.updateUI();
    window.location.href = '/authentication';
  },

  updateUI: function() {
    var b = document.getElementById('google-signin-btn');
    var m = document.getElementById('user-mini');
    var a = document.getElementById('avatar-letter');
    var n = document.getElementById('user-name-display');

    if (this.isLoggedIn()) {
      var u = this.getUser();
      if (b) b.style.display = 'none';
      if (m) m.classList.remove('hidden');
      if (a && u) a.textContent = (u.pseudonym || u.email || 'U').charAt(0).toUpperCase();
      if (n && u) n.textContent = u.pseudonym || u.email || 'User';
    } else {
      if (b) b.style.display = 'block';
      if (m) m.classList.add('hidden');
    }
  }
};