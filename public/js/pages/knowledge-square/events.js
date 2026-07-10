var KSEvents = {
  init: function() {
    this.initTheme();
    this.initSidebarTheme();
    this.initTabs();
    this.initSearch();
    this.initCourseFilters();
    this.initSidebar();
    this.initSignOut();
    this.initSignIn();
    this.initModal();
    this.initImageViewer();
    this.initKeyboard();
  },

  initTheme: function() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    var sun = document.getElementById('sun-icon');
    var moon = document.getElementById('moon-icon');
    toggle.addEventListener('click', function() {
      KSState.isDarkMode = !KSState.isDarkMode;
      document.documentElement.classList.toggle('light', !KSState.isDarkMode);
      document.documentElement.classList.toggle('dark', KSState.isDarkMode);
      if (sun) sun.classList.toggle('hidden', !KSState.isDarkMode);
      if (moon) moon.classList.toggle('hidden', KSState.isDarkMode);
    });
  },

  initSidebarTheme: function() {
    var html = document.documentElement;
    var themeBtn = document.getElementById('theme-toggle-sidebar');
    if (!themeBtn) return;

    if (localStorage.getItem('hivoraa-theme') === 'light') {
      html.classList.remove('dark'); html.classList.add('light');
      var sun = themeBtn.querySelector('.icon-sun');
      var moon = themeBtn.querySelector('.icon-moon');
      if (sun) sun.classList.add('hidden');
      if (moon) moon.classList.remove('hidden');
    }

    themeBtn.addEventListener('click', function() {
      var isDark = html.classList.contains('dark');
      var sun = this.querySelector('.icon-sun');
      var moon = this.querySelector('.icon-moon');
      if (isDark) {
        html.classList.remove('dark'); html.classList.add('light');
        if (sun) sun.classList.add('hidden');
        if (moon) moon.classList.remove('hidden');
        localStorage.setItem('hivoraa-theme', 'light');
      } else {
        html.classList.remove('light'); html.classList.add('dark');
        if (sun) sun.classList.remove('hidden');
        if (moon) moon.classList.add('hidden');
        localStorage.setItem('hivoraa-theme', 'dark');
      }
    });
  },

  initTabs: function() {
    var tabs = document.getElementById('feed-tabs');
    if (!tabs) return;
    tabs.addEventListener('click', function(e) {
      if (e.target.classList.contains('feed-tab')) {
        tabs.querySelectorAll('.feed-tab').forEach(function(t) { t.classList.remove('active'); });
        e.target.classList.add('active');
        KSState.activeFilter = e.target.dataset.filter;
        KSFeed.fetch();
      }
    });
  },

  initSearch: function() {
    var input = document.getElementById('search-input');
    if (!input) return;
    var timeout;
    input.addEventListener('input', function() {
      clearTimeout(timeout);
      timeout = setTimeout(function() { KSFeed.fetch(); }, 400);
    });
  },

  initCourseFilters: function() {
    var container = document.getElementById('course-filters');
    if (!container) return;
    container.addEventListener('click', function(e) {
      if (e.target.classList.contains('course-pill')) {
        container.querySelectorAll('.course-pill').forEach(function(p) { p.classList.remove('active'); });
        e.target.classList.add('active');
        KSState.activeCourse = e.target.dataset.course;
        KSFeed.fetch();
      }
    });
  },

  initSidebar: function() {
    var sidebar = document.getElementById('sidebar');
    var hamburger = document.getElementById('hamburger-btn');
    var overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !hamburger || !overlay) return;

    hamburger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        hamburger.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        sidebar.classList.add('open');
        hamburger.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });

    overlay.addEventListener('click', function() {
      sidebar.classList.remove('open');
      hamburger.classList.remove('open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  },

  initSignOut: function() {
    var btn = document.getElementById('sign-out-link');
    if (btn) btn.addEventListener('click', function() { Auth.showLogoutConfirm(); });
  },

  initSignIn: function() {
    var btn = document.getElementById('google-signin-btn');
    if (btn) {
      btn.addEventListener('click', function() {
        window.location.href = '/auth-test.html';
      });
    }
  },

  initModal: function() {
    var modal = document.getElementById('new-post-modal');
    var fab = document.getElementById('fab-new-post');
    var cancel = document.getElementById('cancel-modal');
    var close = document.getElementById('modal-close-btn');
    var submit = document.getElementById('submit-post-btn');
    var toggle = document.getElementById('anonymous-toggle');
    var dropZone = document.getElementById('file-drop-zone');
    var fileInput = document.getElementById('modal-images');

    if (!modal) return;

    if (fab) {
      fab.addEventListener('click', function() {
        if (!KSSecurity.requireAuth()) { Toast.show('Please sign in to post'); return; }
        KSState.clearFiles();
        KSEvents.updateFileDisplay();
        modal.classList.remove('hidden');
      });
    }

    var closeModal = function() {
      KSState.clearFiles();
      KSEvents.updateFileDisplay();
      modal.classList.add('hidden');
    };

    if (cancel) cancel.addEventListener('click', closeModal);
    if (close) close.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });

    if (toggle) {
      toggle.addEventListener('click', function() {
        KSState.isAnonymous = !KSState.isAnonymous;
        this.classList.toggle('active', KSState.isAnonymous);
      });
    }

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', function() {
        if (this.files) { KSState.addFiles(this.files); KSEvents.updateFileDisplay(); this.value = ''; }
      });
      dropZone.addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor = 'var(--accent)'; });
      dropZone.addEventListener('dragleave', function() { this.style.borderColor = ''; });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '';
        if (e.dataTransfer.files) { KSState.addFiles(e.dataTransfer.files); KSEvents.updateFileDisplay(); }
      });
    }

    if (submit) {
      submit.addEventListener('click', function(e) { e.preventDefault(); KSEvents.submitPost(); });
    }
  },

  updateFileDisplay: function() {
    var dropZone = document.getElementById('file-drop-zone');
    var preview = document.getElementById('image-preview');
    var files = KSState.selectedFiles;
    var names = [];
    for (var i = 0; i < files.length; i++) { names.push(files[i].name); }
    if (dropZone) dropZone.querySelector('span').textContent = names.length > 0 ? names.join(', ') : 'Click or drag images here';
    if (!preview) return;
    preview.textContent = '';
    for (var i = 0; i < files.length; i++) {
      var reader = new FileReader();
      (function(file) {
        reader.onload = function(e) {
          var img = document.createElement('img');
          img.src = e.target.result;
          img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;';
          preview.appendChild(img);
        };
      })(files[i]);
      reader.readAsDataURL(files[i]);
    }
  },

  submitPost: async function() {
    var course = document.getElementById('modal-course');
    var newCourse = document.getElementById('modal-course-new');
    var title = document.getElementById('modal-title');
    var content = document.getElementById('modal-content');
    var deadline = document.getElementById('modal-deadline');

    var finalCourse = (course ? course.value : '') || (newCourse ? KSSecurity.sanitize(newCourse.value.trim().toUpperCase()) : '');
    var finalTitle = title ? title.value.trim() : '';
    var finalContent = content ? content.value.trim() : '';
    var finalDeadline = deadline ? deadline.value : '';

    if (!finalCourse || !KSSecurity.validateTitle(finalTitle) || !KSSecurity.validateContent(finalContent)) {
      Toast.show('Please fill in all fields correctly');
      return;
    }

    var res;
    var files = KSState.selectedFiles;

    if (files.length > 0) {
      var formData = new FormData();
      formData.append('course', finalCourse);
      formData.append('title', KSSecurity.sanitize(finalTitle));
      formData.append('content', KSSecurity.sanitize(finalContent));
      formData.append('deadline', finalDeadline ? new Date(finalDeadline).toISOString() : new Date(Date.now() + 7*86400000).toISOString());
      formData.append('isAnonymous', KSState.isAnonymous);
      for (var i = 0; i < files.length; i++) { formData.append('images', files[i]); }
      res = await API.post('/help-requests', formData, true);
    } else {
      var cleanData = KSSecurity.sanitizePostData({
        course: finalCourse, title: finalTitle, content: finalContent,
        deadline: finalDeadline, isAnonymous: KSState.isAnonymous
      });
      res = await API.post('/help-requests', cleanData);
    }

    if (res.success) {
      Toast.show('Posted');
      document.getElementById('new-post-modal').classList.add('hidden');
      var form = document.getElementById('new-post-form'); if (form) form.reset();
      KSState.reset();
      KSState.clearFiles();
      this.updateFileDisplay();
      var anonToggle = document.getElementById('anonymous-toggle');
      if (anonToggle) anonToggle.classList.remove('active');
      if (newCourse) newCourse.value = '';
      KSFeed.fetch();
    } else {
      Toast.show('Error: ' + (res.message || 'Failed'));
    }
  },

  initImageViewer: function() {
    var viewer = document.getElementById('image-viewer-overlay');
    var viewerImg = document.getElementById('image-viewer-img');
    if (!viewer || !viewerImg) return;

    window.openImageViewer = function(src) {
      viewerImg.src = src;
      viewer.classList.remove('hidden');
    };

    viewer.addEventListener('click', function(e) {
      if (e.target === viewer || e.target.closest('.image-viewer-close')) {
        viewer.classList.add('hidden');
      }
    });
  },

  initKeyboard: function() {
    var self = this;
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var sidebar = document.getElementById('sidebar');
        var hamburger = document.getElementById('hamburger-btn');
        var overlay = document.getElementById('sidebar-overlay');
        var modal = document.getElementById('new-post-modal');
        var viewer = document.getElementById('image-viewer-overlay');

        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          if (hamburger) hamburger.classList.remove('open');
          if (overlay) overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
        if (modal && !modal.classList.contains('hidden')) {
          modal.classList.add('hidden');
          KSState.reset();
          KSState.clearFiles();
          self.updateFileDisplay();
        }
        if (viewer && !viewer.classList.contains('hidden')) {
          viewer.classList.add('hidden');
        }
      }
    });
  }
};