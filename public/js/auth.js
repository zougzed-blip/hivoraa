var Auth = {
  getToken: function() { return localStorage.getItem('hivoraa_token'); },
  setToken: function(token) { localStorage.setItem('hivoraa_token', token); },
  removeToken: function() { localStorage.removeItem('hivoraa_token'); },
  getUser: function() { var u = localStorage.getItem('hivoraa_user'); return u ? JSON.parse(u) : null; },
  setUser: function(user) { localStorage.setItem('hivoraa_user', JSON.stringify(user)); },
  isLoggedIn: function() { return !!this.getToken(); },
  logout: function() { this.removeToken(); localStorage.removeItem('hivoraa_user'); window.location.href = '/index.html'; },
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