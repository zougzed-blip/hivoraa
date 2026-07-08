var PFFeed = {
  fetchAll: async function() {
    var container = document.getElementById('profile-content');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Loading...</div>';

    PFState.user = Auth.getUser();
    if (!PFState.user) {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Sign in to view your profile.</div>';
      return;
    }

    var userId = PFState.user.id || PFState.user._id;

    var postsData = await API.get('/help-requests?limit=100');
    var groupsData = await API.get('/study-groups');
    var resourcesData = await API.get('/resources?limit=100');
    var talentsData = await API.get('/talents?limit=100');

    PFState.posts = postsData.success ? postsData.data.filter(function(p) {
      return p.author && (p.author._id === userId || p.author.id === userId);
    }) : [];

    PFState.groups = groupsData.success ? groupsData.data.filter(function(g) {
      return g.participants && g.participants.some(function(p) {
        var pid = typeof p === 'object' ? (p._id || p.id) : p;
        return pid === userId;
      });
    }) : [];

    PFState.resources = resourcesData.success ? resourcesData.data.filter(function(r) {
      return r.uploader && (r.uploader._id === userId || r.uploader.id === userId);
    }) : [];

    PFState.talents = talentsData.success ? talentsData.data.filter(function(t) {
      return t.user && (t.user._id === userId || t.user.id === userId);
    }) : [];

    this.render();
  },

  render: function() {
    var container = document.getElementById('profile-content');
    if (!container || !PFState.user) return;

    var user = PFState.user;
    var userId = user.id || user._id;
    var mp = PFState.posts;
    var mg = PFState.groups;
    var mr = PFState.resources;
    var mt = PFState.talents;

    container.innerHTML =
      '<div class="profile-card">' +
        '<div class="profile-row">' +
          '<div class="profile-avatar">' + KSSecurity.esc((user.pseudonym || user.email || 'U')[0]) + '</div>' +
          '<div class="profile-info">' +
            '<div class="profile-name">' + KSSecurity.esc(user.pseudonym || 'User') + '</div>' +
            '<div class="profile-email">' + KSSecurity.esc(user.email || '') + '</div>' +
            '<span class="profile-role">' + KSSecurity.esc(user.role || 'student') + '</span>' +
          '</div>' +
          '<div class="profile-header-actions">' +
            '<button class="profile-btn" id="edit-pseudo-btn">Edit</button>' +
            '<button class="profile-btn danger" id="signout-btn">Sign Out</button>' +
          '</div>' +
        '</div>' +
        '<div class="profile-stats">' +
          '<div class="stat-item"><span class="stat-num">' + mp.length + '</span><span class="stat-lbl">Posts</span></div>' +
          '<div class="stat-item"><span class="stat-num">' + mg.length + '</span><span class="stat-lbl">Groups</span></div>' +
          '<div class="stat-item"><span class="stat-num">' + mr.length + '</span><span class="stat-lbl">Resources</span></div>' +
          '<div class="stat-item"><span class="stat-num">' + mt.length + '</span><span class="stat-lbl">Talents</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="section-card"><div class="section-card-header">Recent Posts <span class="section-count">' + mp.length + '</span></div>' +
        (mp.length ? mp.slice(0, 5).map(function(p) {
          return '<div class="list-item"><div class="list-item-body"><span class="course-tag">' + KSSecurity.esc(p.course ? p.course.code : 'N/A') + '</span><span class="list-item-title">' + KSSecurity.esc(p.title) + '</span><span class="list-item-meta">' + Utils.timeAgo(p.createdAt) + '</span></div><div class="list-item-actions"><button class="icon-btn edit-post-btn" data-id="' + p._id + '" title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="icon-btn danger delete-post-btn" data-id="' + p._id + '" title="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></div>';
        }).join('') : '<div class="empty-state">No posts yet</div>') +
      '</div>' +

      '<div class="section-card"><div class="section-card-header">My Groups <span class="section-count">' + mg.length + '</span></div>' +
        (mg.length ? mg.map(function(g) {
          var isOwner = g.creator && (typeof g.creator === 'object' ? (g.creator._id || g.creator.id) : g.creator) === userId;
          return '<div class="list-item"><div class="list-item-body"><span class="course-tag">' + KSSecurity.esc(g.course ? g.course.code : 'N/A') + '</span><span class="list-item-title">' + KSSecurity.esc((g.topic || '').substring(0, 45)) + '</span><span class="list-item-meta">' + (g.participants ? g.participants.length : 0) + ' members' + (isOwner ? ' &middot; Owner' : '') + '</span></div><div class="list-item-actions"><a href="/groups.html" class="icon-btn" title="Open"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>' + (isOwner ? '<button class="icon-btn danger delete-group-btn" data-id="' + g._id + '" title="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : '<button class="icon-btn danger leave-group-btn" data-id="' + g._id + '" title="Leave"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>') + '</div></div>';
        }).join('') : '<div class="empty-state">No groups joined</div>') +
      '</div>' +

      '<div class="section-card"><div class="section-card-header">My Resources <span class="section-count">' + mr.length + '</span></div>' +
        (mr.length ? mr.map(function(r) {
          return '<div class="list-item"><div class="list-item-body"><span class="course-tag">' + KSSecurity.esc((r.type || '').toUpperCase()) + '</span><span class="list-item-title">' + KSSecurity.esc(r.title) + '</span><span class="list-item-meta">' + Utils.timeAgo(r.createdAt) + '</span></div><div class="list-item-actions"><button class="icon-btn danger delete-resource-btn" data-id="' + r._id + '" title="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></div>';
        }).join('') : '<div class="empty-state">No resources uploaded</div>') +
      '</div>' +

      '<div class="section-card"><div class="section-card-header">My Talents <span class="section-count">' + mt.length + '</span></div>' +
        (mt.length ? mt.map(function(t) {
          return '<div class="list-item"><div class="list-item-body"><span class="list-item-title">' + KSSecurity.esc(t.skillOffered || t.skill) + '</span><span class="list-item-meta">Wants: ' + KSSecurity.esc(t.skillWanted || t.wanted) + ' &middot; ' + (t.likes ? t.likes.length : 0) + ' likes</span></div><div class="list-item-actions"><button class="icon-btn danger delete-talent-btn" data-id="' + t._id + '" title="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></div>';
        }).join('') : '<div class="empty-state">No talents posted</div>') +
      '</div>';

    PFFeed.attachEvents();
  },

  attachEvents: function() {
    document.getElementById('edit-pseudo-btn').addEventListener('click', function() {
      document.getElementById('pseudo-input').value = PFState.user.pseudonym || '';
      document.getElementById('pseudo-modal').classList.remove('hidden');
    });

    document.getElementById('signout-btn').addEventListener('click', function() {
      Auth.logout();
    });

    document.querySelectorAll('.delete-post-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); PFEvents.deletePost(b.dataset.id); });
    });
    document.querySelectorAll('.edit-post-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); PFEvents.openEditPost(b.dataset.id); });
    });
    document.querySelectorAll('.delete-group-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); PFEvents.deleteGroup(b.dataset.id); });
    });
    document.querySelectorAll('.leave-group-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); PFEvents.leaveGroup(b.dataset.id); });
    });
    document.querySelectorAll('.delete-resource-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); PFEvents.deleteResource(b.dataset.id); });
    });
    document.querySelectorAll('.delete-talent-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); PFEvents.deleteTalent(b.dataset.id); });
    });
  }
};