var RSEvents = {
  selectedFile: null,

  init: function() {
    var self = this;

    var fab = document.getElementById('fab-upload');
    if (fab) {
      fab.addEventListener('click', function() {
        if (!Auth.isLoggedIn()) { Toast.show('Sign in to upload'); return; }
        self.resetForm();
        document.getElementById('upload-modal').classList.remove('hidden');
      });
    }

    var submit = document.getElementById('submit-upload');
    if (submit) {
      submit.addEventListener('click', function(e) {
        e.preventDefault();
        self.uploadResource();
      });
    }

    var cancelBtn = document.getElementById('cancel-modal');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        document.getElementById('upload-modal').classList.add('hidden');
      });
    }

    var modalClose = document.getElementById('modal-close-btn');
    if (modalClose) {
      modalClose.addEventListener('click', function() {
        document.getElementById('upload-modal').classList.add('hidden');
      });
    }

    var signInBtn = document.getElementById('google-signin-btn');
    if (signInBtn) {
      signInBtn.addEventListener('click', function() { window.location.href = '/auth-test.html'; });
    }

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

    document.getElementById('type-filters').addEventListener('click', function(e) {
      var filter = e.target.closest('.type-filter');
      if (!filter) return;
      document.querySelectorAll('.type-filters .type-filter').forEach(function(f) { f.classList.remove('active'); });
      filter.classList.add('active');
      RSState.activeType = filter.dataset.type;
      RSFeed.fetch();
    });

    var searchInput = document.getElementById('search-input');
    if (searchInput) {
      var searchTimeout;
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() { RSFeed.fetch(); }, 400);
      });
    }

    var dropZone = document.getElementById('file-drop-zone');
    var fileInput = document.getElementById('modal-file');
    if (dropZone && fileInput) {
      dropZone.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          self.selectedFile = this.files[0];
          self.showFilePreview(this.files[0]);
        }
      });
      dropZone.addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor = 'var(--accent)'; });
      dropZone.addEventListener('dragleave', function() { this.style.borderColor = ''; });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          self.selectedFile = e.dataTransfer.files[0];
          self.showFilePreview(e.dataTransfer.files[0]);
        }
      });
    }

    var typeSelect = document.getElementById('modal-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', function() {
        self.toggleUploadFields(this.value);
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var modal = document.getElementById('upload-modal');
        if (modal && !modal.classList.contains('hidden')) modal.classList.add('hidden');
      }
    });

    this.initTheme();
    this.loadCourses();
    RSFeed.fetch();
    Auth.updateUI();
  },

  toggleUploadFields: function(type) {
    var fileGroup = document.getElementById('file-upload-group');
    var urlGroup = document.getElementById('url-input-group');
    if (type === 'pdf' || type === 'image') {
      if (fileGroup) fileGroup.style.display = 'block';
      if (urlGroup) urlGroup.style.display = 'block';
    } else {
      if (fileGroup) fileGroup.style.display = 'none';
      if (urlGroup) urlGroup.style.display = 'block';
    }
  },

  showFilePreview: function(file) {
    var preview = document.getElementById('file-preview');
    if (!preview) return;
    preview.style.display = 'block';
    preview.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> ' + KSSecurity.esc(file.name) + ' (' + (file.size / 1024).toFixed(1) + ' KB)</div>';
  },

  resetForm: function() {
    this.selectedFile = null;
    var preview = document.getElementById('file-preview');
    if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
    var fileInput = document.getElementById('modal-file');
    if (fileInput) fileInput.value = '';
    var dropZone = document.getElementById('file-drop-zone');
    if (dropZone) dropZone.querySelector('span').textContent = 'Drag & drop a file here or click to browse';
    var urlInput = document.getElementById('modal-url');
    if (urlInput) urlInput.value = '';
    var titleInput = document.getElementById('modal-title');
    if (titleInput) titleInput.value = '';
    var courseNew = document.getElementById('modal-course-new');
    if (courseNew) courseNew.value = '';
    this.toggleUploadFields('pdf');
  },

  loadCourses: async function() {
    var data = await API.get('/courses');
    if (data.success && data.data) {
      var select = document.getElementById('modal-course');
      if (!select) return;
      select.innerHTML = '<option value="">Select a course...</option>';
      data.data.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c._id;
        opt.textContent = c.code + ' - ' + c.name;
        select.appendChild(opt);
      });
    }
  },

  uploadResource: async function() {
    var self = RSEvents;
    var courseSelect = document.getElementById('modal-course');
    var courseNew = document.getElementById('modal-course-new');
    var finalCourse = (courseSelect && courseSelect.value) || (courseNew ? courseNew.value.trim().toUpperCase() : '');
    var title = document.getElementById('modal-title').value.trim();
    var type = document.getElementById('modal-type').value;
    var urlInput = document.getElementById('modal-url');
    var url = urlInput ? urlInput.value.trim() : '';

    if (!finalCourse) { Toast.show('Please select or enter a course'); return; }
    if (!title) { Toast.show('Please enter a title'); return; }

    var res;

    if (self.selectedFile) {
      var formData = new FormData();
      formData.append('course', finalCourse);
      formData.append('title', KSSecurity.sanitize(title));
      formData.append('type', type);
      formData.append('file', self.selectedFile);
      res = await API.post('/resources', formData, true);
    } else if (url && url !== '') {
      res = await API.post('/resources', { course: finalCourse, title: KSSecurity.sanitize(title), type: type, link: url });
    } else {
      Toast.show('Please select a file or enter a URL');
      return;
    }

    if (res.success) {
      Toast.show('Resource uploaded');
      document.getElementById('upload-modal').classList.add('hidden');
      self.resetForm();
      RSFeed.fetch();
    } else {
      Toast.show(res.message || 'Failed to upload');
    }
  },

  toggleLike: async function(id) {
    var res = await API.post('/resources/' + id + '/like');
    if (res.success) RSFeed.fetch();
  },

  deleteResource: async function(id) {
    var res = await API.delete('/resources/' + id);
    if (res.success) { Toast.show('Deleted'); RSFeed.fetch(); }
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