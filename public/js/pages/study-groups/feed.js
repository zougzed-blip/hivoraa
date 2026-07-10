var SGFeed = {
  fetch: async function(reset) {
    if (typeof reset === 'undefined') reset = true;
    if (SGState.isLoading) return;

    var container = document.getElementById('groups-container');
    if (!container) return;

    if (reset) {
      SGState.resetPagination();
      SGState.groups = [];
      container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Loading...</div>';
    }

    SGState.isLoading = true;

    try {
      var data = await API.get('/study-groups?page=' + SGState.currentPage + '&limit=20');
      if (data.success && data.data && data.data.length > 0) {
        if (reset) {
          SGState.groups = [];
        }
        SGState.groups = SGState.groups.concat(data.data);
        if (data.data.length < 20) {
          SGState.hasMore = false;
        } else {
          SGState.hasMore = true;
          SGState.currentPage++;
        }
      } else {
        SGState.hasMore = false;
      }

      this.render();
    } catch (err) {
      if (reset) container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No study groups yet.</div>';
    }

    SGState.isLoading = false;
  },

  render: function() {
    var container = document.getElementById('groups-container');
    var detailContainer = document.getElementById('detail-container');
    if (!container) return;
    if (detailContainer) detailContainer.innerHTML = '';

    if (!SGState.groups.length) {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No study groups yet. Create one!</div>';
      return;
    }

    container.innerHTML = '';
    var self = this;
    SGState.groups.forEach(function(g) {
      container.appendChild(self.buildCard(g));
    });

    if (SGState.hasMore) {
      var loadMore = document.createElement('div');
      loadMore.id = 'load-more-btn';
      loadMore.style.cssText = 'text-align:center;padding:16px 0 8px;';
      var btn = document.createElement('button');
      btn.className = 'load-more-link';
      btn.textContent = 'Load More';
      btn.addEventListener('click', function() {
        SGFeed.fetch(false);
      });
      loadMore.appendChild(btn);
      container.appendChild(loadMore);
    }

    this.attachCardEvents();
    if (typeof SGRightPanel !== 'undefined') SGRightPanel.update();
  },

  buildCard: function(g) {
    var joined = SGState.isJoined(g);
    var full = SGState.isFull(g);
    var participants = g.participants || [];
    var count = participants.length;
    var courseCode = g.course ? (typeof g.course === 'object' ? g.course.code : g.course) : 'N/A';

    var card = document.createElement('div');
    card.className = 'group-card';
    card.setAttribute('data-id', g._id);

    var avatars = participants.slice(0, 3).map(function(p) {
      var initial = typeof p === 'object' ? (p.pseudonym ? p.pseudonym[0] : '?') : String(p)[0];
      return '<span class="participant-avatar">' + KSSecurity.esc(initial) + '</span>';
    }).join('');
    var extra = count > 3 ? '<span class="participant-avatar">+' + (count - 3) + '</span>' : '';
    var badge = joined ? '<span class="group-badge joined">Joined</span>' : full ? '<span class="group-badge full">Full</span>' : '<span class="group-badge open">Open</span>';
    var btn = joined ? '<button class="group-btn leave" data-id="' + g._id + '">Leave</button>' : !full ? '<button class="group-btn join" data-id="' + g._id + '">Join</button>' : '';

    card.innerHTML = '<div class="group-card-top"><span class="course-tag">' + KSSecurity.esc(courseCode) + '</span>' + badge + '</div>' +
      '<div class="group-topic">' + KSSecurity.esc(g.topic || 'Untitled') + '</div>' +
      '<div class="group-meta">' +
        '<span class="group-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + KSSecurity.esc(g.location || 'TBD') + '</span>' +
        '<span class="group-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' + (g.dateTime ? new Date(g.dateTime).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'TBD') + '</span>' +
      '</div>' +
      '<div class="group-footer"><div class="participants-row"><div class="participant-avatars">' + avatars + extra + '</div><span class="participant-count' + (full ? ' full' : '') + '">' + count + '/' + g.maxParticipants + '</span></div>' + btn + '</div>';

    return card;
  },

  attachCardEvents: function() {
    var self = this;
    document.querySelectorAll('.group-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.closest('button')) return;
        self.showDetail(card.dataset.id);
      });
    });
    document.querySelectorAll('.group-btn.join').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); SGEvents.joinGroup(b.dataset.id); });
    });
    document.querySelectorAll('.group-btn.leave').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); SGEvents.leaveGroup(b.dataset.id); });
    });
  },

  showDetail: function(id) {
    SGState.currentDetailId = id;
    var g = SGState.getGroup(id);
    if (!g) return;

    if (typeof SGEvents !== 'undefined' && SGEvents.joinRoom) {
      SGEvents.joinRoom(id);
    }

    document.getElementById('groups-container').innerHTML = '';
    var detailContainer = document.getElementById('detail-container');
    var joined = SGState.isJoined(g);
    var participants = g.participants || [];
    var messages = g.messages || [];
    var courseCode = g.course ? (typeof g.course === 'object' ? g.course.code : g.course) : 'N/A';

    detailContainer.innerHTML =
      '<div class="detail-panel">' +
        '<button class="detail-back" id="detail-back"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Back to groups</button>' +
        '<div class="detail-header"><h3>' + KSSecurity.esc(g.topic || '') + '</h3>' +
          '<div class="detail-meta">' + KSSecurity.esc(courseCode) + ' \u00B7 ' + KSSecurity.esc(g.location || '') + ' \u00B7 ' + (g.dateTime ? new Date(g.dateTime).toLocaleString() : 'TBD') + ' \u00B7 ' + participants.length + '/' + g.maxParticipants + ' participants</div>' +
          '<div class="detail-participants">' + participants.map(function(p) {
            var name = typeof p === 'object' ? (p.pseudonym || 'Unknown') : p;
            return '<span class="participant-tag">' + KSSecurity.esc(name) + '</span>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="chat-area" id="chat-area">' + messages.map(function(m) {
          var senderName = 'Unknown';
          if (typeof m.sender === 'object' && m.sender) {
            senderName = m.sender.pseudonym || m.sender.email || 'Unknown';
          } else if (m.sender) {
            senderName = String(m.sender);
          }
          if (m.type === 'audio' && m.audioUrl) {
            return '<div class="chat-msg"><span class="msg-sender">' + KSSecurity.esc(senderName) + '</span><span class="msg-time">' + Utils.timeAgo(m.createdAt) + '</span><div class="msg-text"><audio controls src="' + m.audioUrl + '"></audio></div></div>';
          }
          return '<div class="chat-msg"><span class="msg-sender">' + KSSecurity.esc(senderName) + '</span><span class="msg-time">' + Utils.timeAgo(m.createdAt) + '</span><div class="msg-text">' + KSSecurity.esc(m.text || '') + '</div></div>';
        }).join('') + '</div>' +
        (joined ? '<div class="chat-input-row"><input class="chat-input" id="chat-input" placeholder="Type a message..."><button class="send-btn" id="send-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button><button class="mic-btn" id="mic-btn" title="Record audio"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button><span id="recording-status"></span></div>' : '<div style="text-align:center;color:var(--text-muted);font-size:11px;padding:12px;">Join the group to send messages</div>') +
      '</div>';

    document.getElementById('detail-back').addEventListener('click', function() {
      SGState.currentDetailId = null;
      detailContainer.innerHTML = '';
      SGFeed.render();
    });

    var sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', SGEvents.sendMessage);
    var chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') SGEvents.sendMessage();
      });
      chatInput.focus();
    }

    setTimeout(function() {
  var ca = document.getElementById('chat-area');
  if (ca) ca.scrollTop = ca.scrollHeight;
  SGEvents.initMic();
}, 300);
  }
};