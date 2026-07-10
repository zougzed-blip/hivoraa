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
    if (signOutBtn) signOutBtn.addEventListener('click', function() { Auth.showLogoutConfirm(); });

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
    // Ne rafraîchit que si on est bien DANS une conversation ouverte
    // (pas sur la vue liste, pas sur le mur des talents).
    TLState.socket.on('newMessage', function(msg) {
      var tId = msg.talent ? (msg.talent._id || msg.talent) : null;
      if (TLState.currentChatId && TLState.currentChatUserId && tId === TLState.currentChatId) {
        self.refreshChatMessages();
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

  // PROPRIÉTAIRE : ouvre la liste des conversations (boîte de réception) d'un talent
  openConversationsList: async function(talentId) {
    if (!Auth.isLoggedIn()) { Toast.show('Sign in required'); return; }

    this.leaveCurrentConversation();
    TLState.currentChatId = talentId;
    TLState.currentChatUserId = null;
    TLState.isOwnerView = true;

    document.getElementById('talents-container').innerHTML = '';
    var chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML =
      '<div class="chat-panel">' +
        '<div class="chat-panel-header"><h3>Messages</h3><button class="action-btn" id="close-chat">Back</button></div>' +
        '<div class="chat-list" id="chat-list"><div style="text-align:center;color:var(--text-muted);padding:20px;">Loading...</div></div>' +
      '</div>';

    document.getElementById('close-chat').addEventListener('click', function() {
      TLEvents.closeChat();
    });

    var res = await API.get('/talents/' + talentId + '/conversations');
    var listEl = document.getElementById('chat-list');
    if (!listEl) return;

    if (res.success && res.data && res.data.length) {
      TLState.conversations = res.data;
      listEl.innerHTML = '';
      res.data.forEach(function(c) {
        var item = document.createElement('div');
        item.className = 'chat-list-item';
        var pseudo = c.user && c.user.pseudonym ? c.user.pseudonym : 'Unknown';
        item.innerHTML =
          '<div class="chat-list-avatar">' + KSSecurity.esc(pseudo.charAt(0).toUpperCase()) + '</div>' +
          '<div class="chat-list-info">' +
            '<div class="chat-list-name">' + KSSecurity.esc(pseudo) + '</div>' +
            '<div class="chat-list-preview">' + KSSecurity.esc((c.lastMessage || '').substring(0, 40)) + '</div>' +
          '</div>' +
          '<div class="chat-list-time">' + Utils.timeAgo(c.lastMessageAt) + '</div>';
        item.addEventListener('click', function() {
          TLEvents.openConversation(talentId, c.user._id, pseudo);
        });
        listEl.appendChild(item);
      });
    } else {
      listEl.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;">No messages yet.</div>';
    }
  },

  // Ouvre UN fil de discussion précis (1-à-1). Utilisé par le propriétaire
  // (depuis la liste) ET par un non-propriétaire (bouton Contact direct).
  openConversation: function(talentId, otherUserId, otherUserName) {
    if (!Auth.isLoggedIn()) { Toast.show('Sign in to message'); return; }

    var t = TLState.talents.find(function(tt) { return tt._id === talentId; });
    var isOwner = false;

    if (t) {
      var user = Auth.getUser();
      var userId = user ? (user.id || user._id) : null;
      var ownerId = t.user ? (typeof t.user === 'object' ? (t.user._id || t.user.id) : t.user) : null;
      isOwner = !!(userId && ownerId && userId === ownerId);

      // Non-propriétaire qui clique "Contact" : l'interlocuteur est le propriétaire
      if (!otherUserId) {
        otherUserId = ownerId;
        otherUserName = otherUserName || (typeof t.user === 'object' ? t.user.pseudonym : 'Unknown');
      }
    }

    this.leaveCurrentConversation();

    TLState.isOwnerView = isOwner;
    TLState.currentChatId = talentId;
    TLState.currentChatUserId = otherUserId;

    if (TLState.socket) {
      var currentUser = Auth.getUser();
      var currentUserId = currentUser ? (currentUser.id || currentUser._id) : null;
      TLState.socket.emit('joinTalentConversation', {
        talentId: talentId,
        currentUserId: currentUserId,
        otherUserId: otherUserId
      });
    }

    var backLabel = isOwner ? 'Back to inbox' : 'Back';

    document.getElementById('talents-container').innerHTML = '';
    document.getElementById('chat-container').innerHTML =
      '<div class="chat-panel">' +
        '<div class="chat-panel-header"><h3>' + KSSecurity.esc(otherUserName || 'Conversation') + (t ? ' - ' + KSSecurity.esc(t.skillOffered || '') : '') + '</h3><button class="action-btn" id="close-chat">' + backLabel + '</button></div>' +
        '<div class="chat-messages" id="chat-messages"><div style="text-align:center;color:var(--text-muted);padding:20px;">Loading...</div></div>' +
        '<div class="chat-input-row"><input class="chat-input" id="chat-input" placeholder="' + (isOwner ? 'Reply...' : 'Leave a message (max 2)...') + '"><button class="send-btn" id="send-chat">Send</button></div>' +
      '</div>';

    document.getElementById('close-chat').addEventListener('click', function() {
      if (isOwner) {
        TLEvents.openConversationsList(talentId);
      } else {
        TLEvents.closeChat();
      }
    });

    document.getElementById('send-chat').addEventListener('click', function() {
      TLEvents.sendMessage();
    });
    document.getElementById('chat-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') TLEvents.sendMessage();
    });

    this.refreshChatMessages();
  },

  sendMessage: async function() {
    var input = document.getElementById('chat-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    if (!Auth.isLoggedIn()) { Toast.show('Sign in to message'); return; }

    var body = { text: KSSecurity.sanitize(text) };
    // Le backend exige receiverId quand c'est le propriétaire qui répond,
    // pour savoir dans quel fil classer le message.
    if (TLState.isOwnerView) {
      body.receiverId = TLState.currentChatUserId;
    }

    var res = await API.post('/talents/' + TLState.currentChatId + '/contact', body);
    if (res.success) {
      input.value = '';
      TLEvents.refreshChatMessages();
    } else {
      Toast.show(res.message || 'Failed to send');
    }
  },

  refreshChatMessages: async function() {
    var chatArea = document.getElementById('chat-messages');
    if (!chatArea || !TLState.currentChatId || !TLState.currentChatUserId) return;

    var endpoint = '/talents/' + TLState.currentChatId + '/messages?with=' + encodeURIComponent(TLState.currentChatUserId);
    var msgRes = await API.get(endpoint);

    var currentUser = Auth.getUser();
    var myId = currentUser ? (currentUser.id || currentUser._id) : null;

    if (msgRes.success && msgRes.data) {
      chatArea.innerHTML = msgRes.data.length ? msgRes.data.map(function(m) {
        var senderId = typeof m.sender === 'object' ? (m.sender._id || m.sender.id) : m.sender;
        var sender = typeof m.sender === 'object' ? (m.sender.pseudonym || 'Unknown') : 'Anonymous';
        var isOwn = !!(myId && senderId === myId);
        return '<div class="chat-msg' + (isOwn ? ' own' : '') + '"><div class="msg-header"><span class="msg-sender">' + KSSecurity.esc(sender) + '</span><span class="msg-time">' + Utils.timeAgo(m.createdAt) + '</span></div><div class="msg-text">' + KSSecurity.esc(m.text) + '</div></div>';
      }).join('') : '<div style="text-align:center;color:var(--text-muted);padding:20px;">No messages yet.</div>';
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  },

  leaveCurrentConversation: function() {
    if (TLState.socket && TLState.currentChatId && TLState.currentChatUserId) {
      var currentUser = Auth.getUser();
      var currentUserId = currentUser ? (currentUser.id || currentUser._id) : null;
      TLState.socket.emit('leaveTalentConversation', {
        talentId: TLState.currentChatId,
        currentUserId: currentUserId,
        otherUserId: TLState.currentChatUserId
      });
    }
  },

  closeChat: function() {
    this.leaveCurrentConversation();
    TLState.currentChatId = null;
    TLState.currentChatUserId = null;
    TLState.isOwnerView = false;
    document.getElementById('chat-container').innerHTML = '';
    TLFeed.render();
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