var PFEvents = {
  init: function() {
    var signInBtn = document.getElementById('google-signin-btn');
    if (signInBtn) signInBtn.addEventListener('click', function() { window.location.href = '/authentication'; });

    var signOutBtn = document.getElementById('sign-out-link');
    if (signOutBtn) signOutBtn.addEventListener('click', function() { Auth.showLogoutConfirm(); });

    var mobileSignInBtn = document.getElementById('mobile-signin-btn');
    if (mobileSignInBtn) mobileSignInBtn.addEventListener('click', function() { window.location.href = '/authentication'; });

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

    // Pseudo modal
    var modalClose = document.getElementById('modal-close-btn');
    if (modalClose) modalClose.addEventListener('click', function() { document.getElementById('pseudo-modal').classList.add('hidden'); });
    var cancelPseudo = document.getElementById('cancel-pseudo');
    if (cancelPseudo) cancelPseudo.addEventListener('click', function() { document.getElementById('pseudo-modal').classList.add('hidden'); });
    var pseudoModal = document.getElementById('pseudo-modal');
    if (pseudoModal) pseudoModal.addEventListener('click', function(e) { if (e.target === this) this.classList.add('hidden'); });
    var savePseudo = document.getElementById('save-pseudo');
    if (savePseudo) savePseudo.addEventListener('click', function() { PFEvents.savePseudonym(); });

    // Edit post modal
    var editPostClose = document.getElementById('edit-post-close');
    if (editPostClose) editPostClose.addEventListener('click', function() { document.getElementById('edit-post-modal').classList.add('hidden'); });
    var cancelEditPost = document.getElementById('cancel-edit-post');
    if (cancelEditPost) cancelEditPost.addEventListener('click', function() { document.getElementById('edit-post-modal').classList.add('hidden'); });
    var editPostModal = document.getElementById('edit-post-modal');
    if (editPostModal) editPostModal.addEventListener('click', function(e) { if (e.target === this) this.classList.add('hidden'); });
    var saveEditPost = document.getElementById('save-edit-post');
    if (saveEditPost) saveEditPost.addEventListener('click', function() { PFEvents.saveEditPost(); });

    // Quick Actions
    var actionPosts = document.getElementById('action-posts');
    var actionGroups = document.getElementById('action-groups');
    var actionResources = document.getElementById('action-resources');
    if (actionPosts) {
      actionPosts.addEventListener('click', function() {
        var el = document.querySelector('.section-card:nth-of-type(1)');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (actionGroups) {
      actionGroups.addEventListener('click', function() {
        var el = document.querySelector('.section-card:nth-of-type(2)');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (actionResources) {
      actionResources.addEventListener('click', function() {
        var el = document.querySelector('.section-card:nth-of-type(3)');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var pm = document.getElementById('pseudo-modal');
        var epm = document.getElementById('edit-post-modal');
        if (pm) pm.classList.add('hidden');
        if (epm) epm.classList.add('hidden');
      }
    });

    this.initTheme();
    PFFeed.fetchAll();
    Auth.updateUI();
  },

  savePseudonym: async function() {
    var input = document.getElementById('pseudo-input');
    if (!input) return;
    var np = input.value.trim();
    if (np.length < 3 || np.length > 20) { Toast.show('3-20 characters required'); return; }
    var res = await API.put('/auth/pseudonym', { pseudonym: KSSecurity.sanitize(np) });
    if (res.success) {
      PFState.user.pseudonym = np;
      Auth.setUser(PFState.user);
      document.getElementById('pseudo-modal').classList.add('hidden');
      PFFeed.render();
      Toast.show('Pseudonym updated');
    } else {
      Toast.show(res.message || 'Failed to update');
    }
  },

  openEditPost: function(id) {
    var p = PFState.posts.find(function(p) { return p._id === id; });
    if (!p) return;
    document.getElementById('edit-post-id').value = p._id;
    document.getElementById('edit-post-title').value = p.title;
    document.getElementById('edit-post-content').value = p.content;
    document.getElementById('edit-post-modal').classList.remove('hidden');
  },

  saveEditPost: async function() {
    var id = document.getElementById('edit-post-id').value;
    var title = document.getElementById('edit-post-title').value.trim();
    var content = document.getElementById('edit-post-content').value.trim();
    if (!title) { Toast.show('Title required'); return; }
    var res = await API.put('/help-requests/' + id, { title: KSSecurity.sanitize(title), content: KSSecurity.sanitize(content) });
    if (res.success) {
      document.getElementById('edit-post-modal').classList.add('hidden');
      PFFeed.fetchAll();
      Toast.show('Post updated');
    } else {
      Toast.show(res.message || 'Failed to update');
    }
  },

  deletePost: async function(id) {
    if (!confirm('Delete this post?')) return;
    var res = await API.delete('/help-requests/' + id);
    if (res.success) { PFFeed.fetchAll(); Toast.show('Post deleted'); }
  },

  deleteGroup: async function(id) {
    if (!confirm('Delete this group?')) return;
    var res = await API.delete('/study-groups/' + id);
    if (res.success) { PFFeed.fetchAll(); Toast.show('Group deleted'); }
  },

  leaveGroup: async function(id) {
    var res = await API.post('/study-groups/' + id + '/leave');
    if (res.success) { PFFeed.fetchAll(); Toast.show('Left group'); }
  },

  deleteResource: async function(id) {
    if (!confirm('Delete this resource?')) return;
    var res = await API.delete('/resources/' + id);
    if (res.success) { PFFeed.fetchAll(); Toast.show('Resource deleted'); }
  },

  deleteTalent: async function(id) {
    if (!confirm('Delete this talent?')) return;
    var res = await API.delete('/talents/' + id);
    if (res.success) { PFFeed.fetchAll(); Toast.show('Talent deleted'); }
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
        this.querySelector('.icon-sun').classList.add('hidden'); this.querySelector('.icon-moon').classList.remove('hidden');
        localStorage.setItem('hivoraa-theme', 'light');
      } else {
        document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark');
        this.querySelector('.icon-sun').classList.remove('hidden'); this.querySelector('.icon-moon').classList.add('hidden');
        localStorage.setItem('hivoraa-theme', 'dark');
      }
    });
  }
};