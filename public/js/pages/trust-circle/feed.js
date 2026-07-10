var TCFeed = {
  fetchRooms: async function() {
    var container = document.getElementById('content-area');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Loading...</div>';

    var data = await API.get('/trust-circle/rooms');
    if (data.success && data.data) {
      TCState.rooms = data.data;
      this.renderRooms();
    } else {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Failed to load rooms.</div>';
    }
  },

  renderRooms: function() {
    var container = document.getElementById('content-area');
    if (!container) return;

    container.innerHTML = '<div class="trust-rooms-grid">' +
      TCState.rooms.map(function(r) {
        return '<div class="trust-room-card" data-room="' + r.id + '">' +
          '<div class="trust-room-left">' +
            '<div class="trust-room-title">' + KSSecurity.esc(r.name) + '</div>' +
            '<div class="trust-room-desc">' + KSSecurity.esc(r.description) + '</div>' +
          '</div>' +
          '<span class="trust-room-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span>' +
        '</div>';
      }).join('') +
    '</div>';

    var self = this;
    document.querySelectorAll('.trust-room-card').forEach(function(card) {
      card.addEventListener('click', function() { self.openRoom(card.dataset.room); });
    });
  },

  openRoom: async function(roomId) {
    var room = TCState.rooms.find(function(r) { return r.id === roomId; });
    if (!room) return;

    TCState.currentRoom = roomId;
    var container = document.getElementById('content-area');

    container.innerHTML = '<div class="trust-detail-panel">' +
      '<button class="trust-detail-back" id="back-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Back to rooms</button>' +
      '<div class="trust-detail-header"><h3>' + KSSecurity.esc(room.name) + '</h3><p class="trust-detail-desc">' + KSSecurity.esc(room.description) + '</p></div>' +
      '<div class="trust-messages-list" id="messages-list"><div style="text-align:center;color:var(--text-muted);padding:20px;">Loading...</div></div>' +
      '<div class="trust-post-form">' +
        '<input type="text" id="pseudo-input" placeholder="Your temporary name" value="Anonymous" maxlength="30">' +
        '<textarea id="message-input" placeholder="Share your thoughts..."></textarea>' +
        '<button class="trust-post-btn" id="send-message-btn">Post Message</button>' +
      '</div>' +
    '</div>';

    document.getElementById('back-btn').addEventListener('click', function() {
      TCState.currentRoom = null;
      TCFeed.renderRooms();
    });

    document.getElementById('send-message-btn').addEventListener('click', function() {
      TCEvents.postMessage(roomId);
    });

    await this.loadMessages(roomId);
  },

  loadMessages: async function(roomId) {
    var list = document.getElementById('messages-list');
    if (!list) return;

    if (TCState.isLoadingMessages) return;
    TCState.isLoadingMessages = true;

    var data = await API.get('/trust-circle/rooms/' + roomId + '?page=' + TCState.messagePage + '&limit=20');
    if (data.success && data.data) {
      if (TCState.messagePage === 1) {
        TCState.messages = [];
      }
      TCState.messages = TCState.messages.concat(data.data);
      if (data.data.length < 20) {
        TCState.hasMoreMessages = false;
      } else {
        TCState.hasMoreMessages = true;
        TCState.messagePage++;
      }

      list.innerHTML = TCState.messages.length ? TCState.messages.map(function(m) {
        var liked = m.likes ? m.likes.some(function(id) {
          var user = Auth.getUser();
          return user && (id === user.id || id === user._id);
        }) : false;
        var likesCount = m.likes ? m.likes.length : 0;
        return '<div class="trust-message-card">' +
          '<div class="trust-msg-top"><span class="trust-msg-pseudo">' + KSSecurity.esc(m.temporaryPseudonym || 'Anonymous') + '</span><span class="trust-msg-time">' + Utils.timeAgo(m.createdAt) + '</span></div>' +
          '<div class="trust-msg-text">' + KSSecurity.esc(m.content) + '</div>' +
          '<div class="trust-msg-bottom"><button class="trust-like-btn' + (liked ? ' liked' : '') + '" data-msg-id="' + m._id + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="' + (liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ' + likesCount + '</button></div>' +
        '</div>';
      }).join('') : '<div style="text-align:center;color:var(--text-muted);padding:20px;">No messages yet. Be the first to share.</div>';

      if (TCState.hasMoreMessages) {
        list.insertAdjacentHTML('beforeend', '<div style="text-align:center;padding:14px 0;"><button class="load-more-link" id="trust-load-more-btn">Load More</button></div>');
        var btn = document.getElementById('trust-load-more-btn');
        if (btn) btn.addEventListener('click', function() { TCFeed.loadMessages(roomId); });
      }

      document.querySelectorAll('.trust-like-btn').forEach(function(b) {
        b.addEventListener('click', function(e) { e.stopPropagation(); TCEvents.toggleLike(b.dataset.msgId); });
      });

      list.scrollTop = list.scrollHeight;
    }

    TCState.isLoadingMessages = false;
  }
};