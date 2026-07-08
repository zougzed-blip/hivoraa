var TLEvents = {
  init: function() {
    var self = this;

    var fab = document.getElementById('fab-post-talent');
    if (fab) {
      fab.addEventListener('click', function() {
        if (!Auth.isLoggedIn()) { Toast.show('Sign in to post'); return; }
        document.getElementById('post-modal').classList.remove('hidden');
      });
    }

    var submit = document.getElementById('submit-talent');
    if (submit) submit.addEventListener('click', function(e) { e.preventDefault(); self.postTalent(); });

    var cancelBtn = document.getElementById('cancel-modal');
    if (cancelBtn) cancelBtn.addEventListener('click', function() { document.getElementById('post-modal').classList.add('hidden'); });

    var modalClose = document.getElementById('modal-close-btn');
    if (modalClose) modalClose.addEventListener('click', function() { document.getElementById('post-modal').classList.add('hidden'); });

    var signInBtn = document.getElementById('google-signin-btn');
    if (signInBtn) signInBtn.addEventListener('click', function() { window.location.href = '/auth-test.html'; });

    var signOutBtn = document.getElementById('sign-out-link');
    if (signOutBtn) signOutBtn.addEventListener('click', function() { Auth.logout(); });

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

    document.getElementById('sort-tabs').addEventListener('click', function(e) {
      if (e.target.classList.contains('feed-tab')) {
        document.querySelectorAll('#sort-tabs .feed-tab').forEach(function(t) { t.classList.remove('active'); });
        e.target.classList.add('active');
        TLState.activeSort = e.target.dataset.sort;
        TLFeed.fetch();
      }
    });

    var searchInput = document.getElementById('search-input');
    if (searchInput) {
      var timeout;
      searchInput.addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(function() { TLFeed.fetch(); }, 800);
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var modal = document.getElementById('post-modal');
        if (modal && !modal.classList.contains('hidden')) modal.classList.add('hidden');
      }
    });

    this.connectSocket();
    this.initTheme();
    TLFeed.fetch();
    Auth.updateUI();
  },

  connectSocket: function() {
    TLState.socket = io(CONFIG.SOCKET_URL);

    var self = this;
    TLState.socket.on('newMessage', function(msg) {
      if (TLState.currentChatId) {
        var tId = msg.talent ? (msg.talent._id || msg.talent) : null;
        if (tId === TLState.currentChatId) {
          self.refreshChatMessages();
        }
      }
    });
  },

  postTalent: async function() {
    var skill = document.getElementById('modal-skill').value.trim();
    var desc = document.getElementById('modal-desc').value.trim();
    var wanted = document.getElementById('modal-wanted').value.trim();
    var contact = document.getElementById('modal-contact').value;

    if (!skill) { Toast.show('Enter your skill'); return; }

    var res = await API.post('/talents', {
      skillOffered: KSSecurity.sanitize(skill),
      description: KSSecurity.sanitize(desc),
      skillWanted: KSSecurity.sanitize(wanted) || 'Not specified',
      contactPreference: contact
    });

    if (res.success) {
      Toast.show('Talent posted');
      document.getElementById('post-modal').classList.add('hidden');
      document.getElementById('modal-skill').value = '';
      document.getElementById('modal-desc').value = '';
      document.getElementById('modal-wanted').value = '';
      TLFeed.fetch();
    } else {
      Toast.show(res.message || 'Failed to post');
    }
  },

  toggleLike: async function(id) {
    var res = await API.post('/talents/' + id + '/like');
    if (res.success) TLFeed.fetch();
  },

  deleteTalent: async function(id) {
    var res = await API.delete('/talents/' + id);
    if (res.success) { Toast.show('Deleted'); TLFeed.fetch(); }
  },

  openChat: function(id) {
    var t = TLState.talents.find(function(t) { return t._id === id; });
    if (!t) return;

    TLState.currentChatId = id;

    if (TLState.socket) {
      TLState.socket.emit('joinTalent', id);
    }

    var userName = t.user ? (typeof t.user === 'object' ? t.user.pseudonym : t.user) : 'Unknown';

    document.getElementById('talents-container').innerHTML = '';
    document.getElementById('chat-container').innerHTML =
      '<div class="chat-panel">' +
        '<div class="chat-panel-header"><h3>' + KSSecurity.esc(userName) + ' - ' + KSSecurity.esc(t.skillOffered || '') + '</h3><button class="action-btn" id="close-chat">Back</button></div>' +
        '<div class="chat-messages" id="chat-messages"><div style="text-align:center;color:var(--text-muted);padding:20px;">Loading...</div></div>' +
        '<div class="chat-input-row"><input class="chat-input" id="chat-input" placeholder="Leave a message (max 2)..."><button class="send-btn" id="send-chat">Send</button></div>' +
      '</div>';

    document.getElementById('close-chat').addEventListener('click', function() {
      TLState.currentChatId = null;
      document.getElementById('chat-container').innerHTML = '';
      TLFeed.render();
    });

    document.getElementById('send-chat').addEventListener('click', async function() {
      var input = document.getElementById('chat-input');
      var text = input.value.trim();
      if (!text) return;
      if (!Auth.isLoggedIn()) { Toast.show('Sign in to message'); return; }
      var res = await API.post('/talents/' + id + '/contact', { text: KSSecurity.sanitize(text) });
      if (res.success) {
        input.value = '';
        TLEvents.refreshChatMessages();
      } else {
        Toast.show(res.message || 'Failed to send');
      }
    });

    this.refreshChatMessages();
  },

  refreshChatMessages: async function() {
    var chatArea = document.getElementById('chat-messages');
    if (!chatArea) return;

    var msgRes = await API.get('/talents/' + TLState.currentChatId + '/messages');
    if (msgRes.success && msgRes.data) {
      chatArea.innerHTML = msgRes.data.length ? msgRes.data.map(function(m) {
        var sender = typeof m.sender === 'object' ? (m.sender.pseudonym || 'Unknown') : 'Anonymous';
        return '<div class="chat-msg"><div class="msg-header"><span class="msg-sender">' + KSSecurity.esc(sender) + '</span><span class="msg-time">' + Utils.timeAgo(m.createdAt) + '</span></div><div class="msg-text">' + KSSecurity.esc(m.text) + '</div></div>';
      }).join('') : '<div style="text-align:center;color:var(--text-muted);padding:20px;">No messages yet.</div>';
      chatArea.scrollTop = chatArea.scrollHeight;
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
        this.querySelector('.icon-sun').classList.add('hidden');
        this.querySelector('.icon-moon').classList.remove('hidden');
        localStorage.setItem('hivoraa-theme', 'light');
      } else {
        document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark');
        this.querySelector('.icon-sun').classList.remove('hidden');
        this.querySelector('.icon-moon').classList.add('hidden');
        localStorage.setItem('hivoraa-theme', 'dark');
      }
    });
  }
};