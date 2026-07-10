var SGEvents = {
  socket: null,
  mediaRecorder: null,
  audioChunks: [],
  audioStream: null,
  isRecording: false,

  init: function() {
    var fab = document.getElementById('fab-new-post');
    if (fab) {
      fab.addEventListener('click', function() {
        if (!Auth.isLoggedIn()) { Toast.show('Sign in to create a group'); return; }
        document.getElementById('create-modal').classList.remove('hidden');
      });
    }

    var submit = document.getElementById('submit-group');
    if (submit) submit.addEventListener('click', this.createGroup);

    var cancelBtn = document.getElementById('cancel-modal');
    if (cancelBtn) cancelBtn.addEventListener('click', function() {
      document.getElementById('create-modal').classList.add('hidden');
    });

    var modalClose = document.getElementById('modal-close-btn');
    if (modalClose) modalClose.addEventListener('click', function() {
      document.getElementById('create-modal').classList.add('hidden');
    });

    var signInBtn = document.getElementById('google-signin-btn');
    if (signInBtn) {
      signInBtn.addEventListener('click', function() {
        window.location.href = '/auth-test.html';
      });
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
          sidebar.classList.remove('open');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        } else {
          sidebar.classList.add('open');
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var modal = document.getElementById('create-modal');
        if (modal && !modal.classList.contains('hidden')) {
          modal.classList.add('hidden');
        }
      }
    });

    this.loadCourses();
    this.connectSocket();
    this.initTheme();
    SGFeed.fetch();
    Auth.updateUI();
  },

  connectSocket: function() {
    var self = this;
    this.socket = io(CONFIG.SOCKET_URL);

    this.socket.on('newMessage', function(msg) {
      if (!SGState.currentDetailId) return;
      var g = SGState.getGroup(SGState.currentDetailId);
      if (!g) return;

      var exists = g.messages.some(function(m) { return m._id === msg._id; });
      if (!exists) {
        g.messages.push(msg);
        SGFeed.showDetail(SGState.currentDetailId);
      }
    });
  },

  joinRoom: function(groupId) {
    if (this.socket) {
      this.socket.emit('joinGroup', groupId);
    }
  },

  joinGroup: async function(id) {
    if (!Auth.isLoggedIn()) { Toast.show('Sign in to join'); return; }
    var res = await API.post('/study-groups/' + id + '/join');
    if (res.success) { Toast.show('Joined group'); SGFeed.fetch(); }
    else { Toast.show(res.message || 'Failed to join'); }
  },

  leaveGroup: async function(id) {
    var res = await API.post('/study-groups/' + id + '/leave');
    if (res.success) { Toast.show('Left group'); SGFeed.fetch(); }
  },

  createGroup: async function() {
    var courseSelect = document.getElementById('modal-course');
    var courseNew = document.getElementById('modal-course-new');
    var finalCourse = (courseSelect && courseSelect.value) || (courseNew ? courseNew.value.trim().toUpperCase() : '');
    var topic = document.getElementById('modal-topic').value.trim();
    var location = document.getElementById('modal-location').value.trim();
    var dateTime = document.getElementById('modal-datetime').value;
    var max = parseInt(document.getElementById('modal-max').value) || 6;

    if (!finalCourse) { Toast.show('Please select or enter a course'); return; }
    if (!topic) { Toast.show('Please enter a topic'); return; }

    var body = {
      course: finalCourse,
      topic: KSSecurity.sanitize(topic),
      location: KSSecurity.sanitize(location) || 'TBD',
      dateTime: dateTime ? new Date(dateTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
      maxParticipants: max
    };

    var res = await API.post('/study-groups', body);
    if (res.success) {
      Toast.show('Group created');
      document.getElementById('create-modal').classList.add('hidden');
      document.getElementById('modal-topic').value = '';
      document.getElementById('modal-location').value = '';
      if (courseNew) courseNew.value = '';
      SGFeed.fetch();
    } else {
      Toast.show(res.message || 'Failed to create group');
    }
  },

  sendMessage: async function() {
    var input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    var text = input.value.trim();
    var groupId = SGState.currentDetailId;
    if (!groupId) return;
    if (!Auth.isLoggedIn()) { Toast.show('Sign in to send messages'); return; }

    input.value = '';
    var inputRef = input;
    var textRef = text;

    var res = await API.post('/study-groups/' + groupId + '/message', { text: KSSecurity.sanitize(textRef) });
    if (res.success && res.data) {
      var g = SGState.getGroup(groupId);
      if (g) {
        var exists = g.messages.some(function(m) { return m._id === res.data._id; });
        if (!exists) {
          g.messages.push(res.data);
        }
      }
      SGFeed.showDetail(groupId);
    } else {
      Toast.show(res.message || 'Failed to send');
      inputRef.value = textRef;
    }
  },

  initMic: function() {
    var micBtn = document.getElementById('mic-btn');
    if (!micBtn) return;
    if (micBtn.dataset.micReady === 'true') return;
    micBtn.dataset.micReady = 'true';

    var self = this;
    micBtn.addEventListener('click', function() {
      if (self.isRecording) {
        self.stopRecording();
      } else {
        self.startRecording();
      }
    });
  },

  startRecording: async function() {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.audioStream);

      var self = this;
      this.mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
          self.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async function() {
        if (self.audioChunks.length === 0) return;

        var audioBlob = new Blob(self.audioChunks, { type: 'audio/webm' });
        var formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');

        var groupId = SGState.currentDetailId;
        if (!groupId) return;

        await API.post('/study-groups/' + groupId + '/audio', formData, true);

        if (self.audioStream) {
          self.audioStream.getTracks().forEach(function(track) { track.stop(); });
        }

        var micBtn = document.getElementById('mic-btn');
        var status = document.getElementById('recording-status');
        if (micBtn) micBtn.classList.remove('recording');
        if (status) status.textContent = '';
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      var micBtn = document.getElementById('mic-btn');
      var status = document.getElementById('recording-status');
      if (micBtn) micBtn.classList.add('recording');
      if (status) status.textContent = 'Recording...';

    } catch (error) {
      console.error('Mic error:', error);
      Toast.show('Microphone access denied');
    }
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

  stopRecording: function() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.isRecording = false;

      var micBtn = document.getElementById('mic-btn');
      var status = document.getElementById('recording-status');
      if (micBtn) micBtn.classList.remove('recording');
      if (status) status.textContent = 'Sending...';
    }
  },

  initTheme: function() {
    var themeBtn = document.getElementById('theme-toggle-sidebar');
    if (!themeBtn) return;
    if (localStorage.getItem('hivoraa-theme') === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      var sun = themeBtn.querySelector('.icon-sun');
      var moon = themeBtn.querySelector('.icon-moon');
      if (sun) sun.classList.add('hidden');
      if (moon) moon.classList.remove('hidden');
    }
    themeBtn.addEventListener('click', function() {
      var isDark = document.documentElement.classList.contains('dark');
      var sun = this.querySelector('.icon-sun');
      var moon = this.querySelector('.icon-moon');
      if (isDark) {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        if (sun) sun.classList.add('hidden');
        if (moon) moon.classList.remove('hidden');
        localStorage.setItem('hivoraa-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        if (sun) sun.classList.remove('hidden');
        if (moon) moon.classList.add('hidden');
        localStorage.setItem('hivoraa-theme', 'dark');
      }
    });
  }
};