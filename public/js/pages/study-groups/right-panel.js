var SGRightPanel = {
  update: function() {
    this.updateMyGroups();
    this.loadTrending();
    this.loadResources();
  },

  updateMyGroups: function() {
    var myList = document.getElementById('my-groups-list');
    if (!myList) return;
    var joined = SGState.groups.filter(function(g) { return SGState.isJoined(g); });
    myList.innerHTML = joined.length ? joined.map(function(g) {
      return '<div class="panel-item" data-gid="' + g._id + '" style="cursor:pointer;">' + KSSecurity.esc(g.topic ? g.topic.substring(0, 30) : 'Group') + '</div>';
    }).join('') : '<div style="color:var(--text-muted);font-size:11px;padding:5px 0;">Join a group to see it here</div>';
    myList.querySelectorAll('.panel-item').forEach(function(item) {
      item.addEventListener('click', function() { SGFeed.showDetail(item.dataset.gid); });
    });
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
    }).catch(function() {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>';
    });
  },

  loadResources: function() {
    var el = document.getElementById('popular-resources');
    if (!el) return;
    API.get('/resources?sort=popular&limit=4').then(function(data) {
      if (data.success && data.data && data.data.length > 0) {
        el.innerHTML = '';
        data.data.forEach(function(r) {
          el.innerHTML += '<div class="panel-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> ' + KSSecurity.esc(r.title ? r.title.substring(0, 30) : 'Resource') + '</div>';
        });
      } else {
        el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No resources yet</div>';
      }
    }).catch(function() {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>';
    });
  }
};