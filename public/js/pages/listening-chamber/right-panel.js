var LCRightPanel = {
  update: function() {
    this.loadTrending();
    this.loadGroups();
  },

  loadTrending: function() {
    var el = document.getElementById('trending-posts');
    if (!el) return;
    API.get('/help-requests?sort=active&limit=4').then(function(data) {
      if (data.success && data.data && data.data.length > 0) {
        el.innerHTML = '';
        data.data.forEach(function(p) {
          el.innerHTML += '<div class="panel-item"><span class="item-tag">' + KSSecurity.esc(p.course ? p.course.code : 'N/A') + '</span> ' + KSSecurity.esc(p.title ? p.title.substring(0, 30) : '') + '</div>';
        });
      } else {
        el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No posts yet</div>';
      }
    }).catch(function() { el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>'; });
  },

  loadGroups: function() {
    var el = document.getElementById('active-groups');
    if (!el) return;
    API.get('/study-groups').then(function(data) {
      if (data.success && data.data && data.data.length > 0) {
        el.innerHTML = '';
        data.data.slice(0, 4).forEach(function(g) {
          el.innerHTML += '<div class="panel-item"><span class="online-dot"></span> ' + KSSecurity.esc(g.topic ? g.topic.substring(0, 30) : 'Group') + ' <span style="color:var(--green);font-size:10px;margin-left:auto;">' + (g.participants ? g.participants.length : 0) + ' members</span></div>';
        });
      } else {
        el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No groups yet</div>';
      }
    }).catch(function() { el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>'; });
  }
};