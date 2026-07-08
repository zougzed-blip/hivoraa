var TLFeed = {
  fetch: async function() {
    var container = document.getElementById('talents-container');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Loading...</div>';

    var endpoint = '/talents';
    if (TLState.activeSort === 'popular') endpoint += '?sort=popular';
    var q = document.getElementById('search-input');
    if (q && q.value.trim()) endpoint += (endpoint.indexOf('?') === -1 ? '?' : '&') + 'search=' + encodeURIComponent(KSSecurity.sanitize(q.value.trim()));

    var data = await API.get(endpoint);
    if (data.success && data.data) {
      TLState.talents = data.data;
      this.render();
    } else {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No talents found.</div>';
    }
  },

  render: function() {
    var container = document.getElementById('talents-container');
    var chatContainer = document.getElementById('chat-container');
    if (!container) return;
    if (chatContainer) chatContainer.innerHTML = '';

    if (!TLState.talents.length) {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No talents found.</div>';
      return;
    }

    container.innerHTML = '';
    var self = this;
    TLState.talents.forEach(function(t) {
      container.appendChild(self.buildCard(t));
    });

    this.attachEvents();
    if (typeof TLRightPanel !== 'undefined') TLRightPanel.update();
  },

  buildCard: function(t) {
    var card = document.createElement('div');
    card.className = 'talent-card';
    card.setAttribute('data-id', t._id);

    var userName = t.user ? (typeof t.user === 'object' ? t.user.pseudonym : t.user) : 'Unknown';
    var initial = userName.charAt(0).toUpperCase();
    var likesCount = t.likes ? t.likes.length : 0;
    var user = Auth.getUser();
    var userId = user ? (user.id || user._id) : null;
    var ownerId = t.user ? (typeof t.user === 'object' ? (t.user._id || t.user.id) : t.user) : null;
    var isOwner = userId && ownerId && userId === ownerId;
    var liked = t.likes ? t.likes.some(function(id) { return id === userId; }) : false;

    card.innerHTML = '<div class="talent-header"><div class="talent-avatar">' + KSSecurity.esc(initial) + '</div><span class="talent-pseudo">' + KSSecurity.esc(userName) + '</span></div>' +
      '<div class="talent-skill">' + KSSecurity.esc(t.skillOffered || '') + '</div>' +
      '<div class="talent-desc">' + KSSecurity.esc(t.description || '') + '</div>' +
      '<span class="talent-wanted">Wants: ' + KSSecurity.esc(t.skillWanted || 'Not specified') + '</span>' +
      '<div class="talent-meta">' +
        '<span class="talent-stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ' + likesCount + ' likes</span>' +
        '<span class="talent-contact-type">' + this.getContactIcon(t.contactPreference) + ' ' + (t.contactPreference === 'internal' ? 'Chat' : t.contactPreference === 'whatsapp' ? 'WhatsApp' : 'Email') + '</span>' +
      '</div>' +
      '<div class="talent-actions">' +
        '<button class="action-btn like-btn' + (liked ? ' liked' : '') + '" data-id="' + t._id + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="' + (liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Like</button>' +
        '<button class="action-btn primary contact-btn" data-id="' + t._id + '">Contact</button>' +
        (isOwner ? '<button class="action-btn danger delete-btn" data-id="' + t._id + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete</button>' : '') +
      '</div>';

    return card;
  },

  getContactIcon: function(contact) {
    if (contact === 'internal') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    if (contact === 'whatsapp') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
    return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  },

  attachEvents: function() {
    document.querySelectorAll('.like-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); TLEvents.toggleLike(b.dataset.id); });
    });
    document.querySelectorAll('.contact-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); TLEvents.openChat(b.dataset.id); });
    });
    document.querySelectorAll('.delete-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); TLEvents.deleteTalent(b.dataset.id); });
    });
  }
};