var TLRightPanel = {
  update: function() {
    this.loadMyTalents();
    this.loadTrending();
    this.loadResources();
  },

  loadMyTalents: function() {
    var el = document.getElementById('my-talents');
    if (!el) return;
    var user = Auth.getUser();
    var userId = user ? (user.id || user._id) : null;
    var myTalents = TLState.talents.filter(function(t) {
      var ownerId = t.user ? (typeof t.user === 'object' ? (t.user._id || t.user.id) : t.user) : null;
      return userId && ownerId && userId === ownerId;
    });
    el.innerHTML = myTalents.length ? myTalents.map(function(t) {
      return '<div class="panel-item" style="cursor:pointer;">' + KSSecurity.esc(t.skillOffered ? t.skillOffered.substring(0, 30) : 'Talent') + '</div>';
    }).join('') : '<div style="color:var(--text-muted);font-size:11px;padding:5px 0;">Post a talent to see it here</div>';
  },

  loadTrending: function() {
    var el = document.getElementById('trending-posts');
    if (!el) return;
    API.get('/help-requests?sort=active&limit=4').then(function(data) {
      if (data.success && data.data && data.data.length > 0) {
        el.innerHTML = '';
        data.data.forEach(function(p) {
          var item = document.createElement('div');
          item.className = 'panel-item';
          item.style.cursor = 'pointer';
          item.innerHTML = '<span class="item-tag">' + KSSecurity.esc(p.course ? p.course.code : 'N/A') + '</span> ' + KSSecurity.esc(p.title ? p.title.substring(0, 30) : '');
          item.addEventListener('click', function() {
            window.location.href = '/index.html?post=' + p._id;
          });
          el.appendChild(item);
        });
      } else {
        el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No posts yet</div>';
      }
    }).catch(function() { el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>'; });
  },

  loadResources: function() {
    var el = document.getElementById('popular-resources');
    if (!el) return;
    API.get('/resources?sort=popular&limit=4').then(function(data) {
      if (data.success && data.data && data.data.length > 0) {
        el.innerHTML = '';
        data.data.forEach(function(r) {
          var item = document.createElement('div');
          item.className = 'panel-item';
          item.style.cursor = 'pointer';
          item.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> ' + KSSecurity.esc(r.title ? r.title.substring(0, 30) : 'Resource');
          item.addEventListener('click', function() {
            window.open(r.fileUrl || r.url || '#', '_blank');
          });
          el.appendChild(item);
        });
      } else {
        el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No resources yet</div>';
      }
    }).catch(function() { el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>'; });
  }
};