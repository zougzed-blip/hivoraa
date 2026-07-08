(function() {
  'use strict';

  var $ = function(sel) { return document.querySelector(sel); };
  var $$ = function(sel) { return document.querySelectorAll(sel); };

  var isAnonymous = false;
  var isDarkMode = true;
  var activeFilter = 'for-you';
  var activeCourse = 'all';
  var coursesList = [];
  var selectedFiles = [];

  var imagePreview = $('#image-preview');
  var modalCourseNew = $('#modal-course-new');
  var postsContainer = $('#posts-container');
  var sidebar = $('#sidebar');
  var hamburgerBtn = $('#hamburger-btn');
  var fabNewPost = $('#fab-new-post');
  var newPostModal = $('#new-post-modal');
  var cancelModal = $('#cancel-modal');
  var submitPostBtn = $('#submit-post-btn');
  var anonymousToggle = $('#anonymous-toggle');
  var searchInput = $('#search-input');
  var toastContainer = $('#toast-container');
  var themeToggle = $('#theme-toggle');
  var sunIcon = $('#sun-icon');
  var moonIcon = $('#moon-icon');
  var signOutLink = $('#sign-out-link');
  var feedTabs = $('#feed-tabs');
  var courseFilters = $('#course-filters');
  var fileDropZone = $('#file-drop-zone');
  var modalImages = $('#modal-images');
  var trendingPosts = $('#trending-posts');
  var activeGroupsPanel = $('#active-groups');
  var popularResources = $('#popular-resources');

  function esc(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function sanitize(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '').trim();
  }

  function updateFileDisplay() {
    var names = [];
    for (var i = 0; i < selectedFiles.length; i++) { names.push(selectedFiles[i].name); }
    if (fileDropZone) {
      fileDropZone.querySelector('span').textContent = names.length > 0 ? names.join(', ') : 'Click or drag images here';
    }
    showImagePreviewList(selectedFiles);
  }

  function showImagePreviewList(files) {
    if (!imagePreview) return;
    imagePreview.innerHTML = '';
    for (var i = 0; i < files.length; i++) {
      var reader = new FileReader();
      (function(file) {
        reader.onload = function(e) {
          var img = document.createElement('img');
          img.src = e.target.result;
          img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;';
          imagePreview.appendChild(img);
        };
      })(files[i]);
      reader.readAsDataURL(files[i]);
    }
  }

  function setTheme(dark) {
    isDarkMode = dark;
    document.documentElement.classList.toggle('light', !dark);
    document.documentElement.classList.toggle('dark', dark);
    if (sunIcon) sunIcon.classList.toggle('hidden', !dark);
    if (moonIcon) moonIcon.classList.toggle('hidden', dark);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function() { setTheme(!isDarkMode); });
  }

  function showToast(message) {
    if (!toastContainer) return;
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = sanitize(message);
    toastContainer.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  }

  if (signOutLink) {
    signOutLink.addEventListener('click', function() { Auth.logout(); });
  }

  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      hamburgerBtn.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== hamburgerBtn && !hamburgerBtn.contains(e.target)) {
        sidebar.classList.remove('open');
        hamburgerBtn.classList.remove('open');
      }
    });
  }

  async function loadCourses() {
    var data = await API.get('/courses');
    if (data.success && data.data) {
      coursesList = data.data;
      renderCourseFilters();
      renderCourseSelect();
    }
  }

  function renderCourseFilters() {
    if (!courseFilters) return;
    var html = '<span class="course-pill active" data-course="all">All</span>';
    coursesList.forEach(function(c) {
      html += '<span class="course-pill" data-course="' + esc(c.code) + '">' + esc(c.code) + '</span>';
    });
    courseFilters.innerHTML = html;
    courseFilters.addEventListener('click', function(e) {
      if (e.target.classList.contains('course-pill')) {
        courseFilters.querySelectorAll('.course-pill').forEach(function(p) { p.classList.remove('active'); });
        e.target.classList.add('active');
        activeCourse = e.target.dataset.course;
        fetchPosts();
      }
    });
  }

  function renderCourseSelect() {
    var select = $('#modal-course');
    if (!select) return;
    select.innerHTML = '<option value="">Select a course...</option>';
    coursesList.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c._id;
      opt.textContent = c.code + ' - ' + c.name;
      select.appendChild(opt);
    });
  }

  function daysUntil(dateStr) {
    if (!dateStr) return 14;
    var now = new Date();
    var deadline = new Date(dateStr);
    return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  }

  function getDeadlineInfo(days) {
    if (days > 7) return { color: 'green', text: days + 'd left' };
    if (days >= 3) return { color: 'yellow', text: days + 'd left' };
    if (days > 0) return { color: 'red', text: days + 'd left' };
    if (days === 0) return { color: 'red', text: 'Today' };
    return { color: 'red', text: 'Overdue' };
  }

  function getProgressPercent(days) {
    if (days < 0) return 100;
    return Math.min(100, Math.max(5, ((14 - days) / 14) * 100));
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    return Math.floor(hours / 24) + 'd ago';
  }

  async function fetchPosts() {
    if (!postsContainer) return;
    postsContainer.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Loading...</div>';

    var endpoint = '/help-requests?page=1&limit=20';
    if (activeCourse !== 'all') endpoint += '&course=' + encodeURIComponent(activeCourse);
    if (activeFilter === 'deadline') endpoint += '&sort=deadline';
    if (activeFilter === 'active') endpoint += '&sort=active';
    var q = searchInput ? searchInput.value.trim() : '';
    if (q) endpoint += '&search=' + encodeURIComponent(sanitize(q));

    try {
      var data = await API.get(endpoint);
      if (data.success) {
        renderPosts(data.data);
      } else {
        postsContainer.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No posts found.</div>';
      }
    } catch (err) {
      postsContainer.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Network error.</div>';
    }
  }

  function renderPosts(posts) {
    if (!postsContainer) return;
    if (!posts || posts.length === 0) {
      postsContainer.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No posts yet.</div>';
      return;
    }

    postsContainer.innerHTML = '';

    posts.forEach(function(post) {
      var days = daysUntil(post.deadline);
      var di = getDeadlineInfo(days);
      var tv = post.difficultyVotes ? post.difficultyVotes.length : 0;
      var easy = post.difficultyVotes ? post.difficultyVotes.filter(function(v) { return v.vote === 'easy'; }).length : 0;
      var medium = post.difficultyVotes ? post.difficultyVotes.filter(function(v) { return v.vote === 'medium'; }).length : 0;
      var hard = post.difficultyVotes ? post.difficultyVotes.filter(function(v) { return v.vote === 'hard'; }).length : 0;
      var eP = tv > 0 ? Math.round((easy / tv) * 100) : 0;
      var mP = tv > 0 ? Math.round((medium / tv) * 100) : 0;
      var hP = tv > 0 ? Math.round((hard / tv) * 100) : 0;
      var replies = post.replies || [];
      var postId = post._id;

      var article = document.createElement('article');
      article.className = 'post-card';
      article.setAttribute('data-id', postId);

      var imagesHtml = '';
      if (post.images && post.images.length > 0) {
        imagesHtml = '<div class="post-images">';
        post.images.forEach(function(img) {
          imagesHtml += '<img src="' + esc(img) + '" alt="Post image" class="post-image" loading="lazy">';
        });
        imagesHtml += '</div>';
      }

      var repliesHtml = '';
      var visibleReplies = replies.slice(0, 3);
      var hiddenReplies = replies.slice(3);

      visibleReplies.forEach(function(r) {
        repliesHtml += '<div class="reply-item"><div class="reply-header"><span class="reply-author">' + esc(r.author ? r.author.pseudonym : 'Anonymous') + '</span><span class="reply-time">' + timeAgo(r.createdAt) + '</span></div><div class="reply-text">' + esc(r.content) + '</div></div>';
      });

      if (hiddenReplies.length > 0) {
        repliesHtml += '<button class="show-more-btn">Show ' + hiddenReplies.length + ' more</button>';
        repliesHtml += '<div class="hidden">';
        hiddenReplies.forEach(function(r) {
          repliesHtml += '<div class="reply-item"><div class="reply-header"><span class="reply-author">' + esc(r.author ? r.author.pseudonym : 'Anonymous') + '</span><span class="reply-time">' + timeAgo(r.createdAt) + '</span></div><div class="reply-text">' + esc(r.content) + '</div></div>';
        });
        repliesHtml += '</div>';
      }

      article.innerHTML = `
        <div class="post-header"><span class="course-tag">${esc(post.course ? post.course.code : 'N/A')}</span><span class="post-title">${esc(post.title)}</span></div>
        <div class="post-meta"><span>${esc(post.author ? post.author.pseudonym : 'Anonymous')}</span><span>&middot;</span><span>${timeAgo(post.createdAt)}</span></div>
        <div class="post-content">${esc(post.content)}</div>
        ${imagesHtml}
        <div class="difficulty-mini">
          <div class="diff-mini-item"><span class="diff-mini-dot green"></span><div class="diff-mini-track"><div class="diff-mini-fill green" style="width:${eP}%;"></div></div><span class="diff-mini-pct">${eP}%</span></div>
          <div class="diff-mini-item"><span class="diff-mini-dot yellow"></span><div class="diff-mini-track"><div class="diff-mini-fill yellow" style="width:${mP}%;"></div></div><span class="diff-mini-pct">${mP}%</span></div>
          <div class="diff-mini-item"><span class="diff-mini-dot red"></span><div class="diff-mini-track"><div class="diff-mini-fill red" style="width:${hP}%;"></div></div><span class="diff-mini-pct">${hP}%</span></div>
        </div>
        <div class="vote-buttons">
          <button class="vote-btn" data-post="${postId}" data-vote="easy">Easy (${easy})</button>
          <button class="vote-btn" data-post="${postId}" data-vote="medium">Medium (${medium})</button>
          <button class="vote-btn" data-post="${postId}" data-vote="hard">Hard (${hard})</button>
        </div>
        <div class="progress-bar-bottom">
          <div class="progress-bar-track"><div class="progress-bar-fill ${di.color}" style="width:${getProgressPercent(days)}%;"></div></div>
          <span class="progress-label" style="color:var(--${di.color})"><span class="deadline-dot ${di.color}"></span>${di.text}</span>
        </div>
        <div class="post-stats">${replies.length} replies</div>
        <div class="replies-section">
          ${repliesHtml}
          <div class="reply-input-row"><textarea placeholder="Write a reply..." rows="1"></textarea><button class="send-reply-btn">Send</button></div>
        </div>
      `;

      article.querySelectorAll('.vote-btn').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          await API.post('/help-requests/' + postId + '/vote', { vote: this.dataset.vote });
          fetchPosts();
        });
      });

      var showMoreBtn = article.querySelector('.show-more-btn');
      if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
          var hidden = this.nextElementSibling;
          if (hidden) hidden.classList.remove('hidden');
          this.remove();
        });
      }

      var replyBtn = article.querySelector('.send-reply-btn');
      var replyTextarea = article.querySelector('textarea');
      replyBtn.addEventListener('click', async function() {
        var content = replyTextarea.value.trim();
        if (!content) return;
        if (!Auth.isLoggedIn()) { showToast('Sign in to reply'); return; }
        await API.post('/help-requests/' + postId + '/reply', { content: sanitize(content) });
        replyTextarea.value = '';
        fetchPosts();
      });

      postsContainer.appendChild(article);
    });
  }

  async function loadRightPanel() {
    if (trendingPosts) {
      try {
        var tp = await API.get('/help-requests?sort=active&limit=4');
        if (tp.success && tp.data && tp.data.length > 0) {
          trendingPosts.innerHTML = '';
          tp.data.forEach(function(p) {
            var item = document.createElement('div');
            item.className = 'panel-item';
            item.innerHTML = '<span class="item-tag">' + esc(p.course ? p.course.code : 'N/A') + '</span> ' + esc(p.title.substring(0, 30));
            trendingPosts.appendChild(item);
          });
        } else {
          trendingPosts.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No posts yet</div>';
        }
      } catch (err) {
        trendingPosts.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>';
      }
    }

    if (activeGroupsPanel) {
      try {
        var ag = await API.get('/study-groups');
        if (ag.success && ag.data && ag.data.length > 0) {
          activeGroupsPanel.innerHTML = '';
          ag.data.slice(0, 4).forEach(function(g) {
            var item = document.createElement('div');
            item.className = 'panel-item';
            item.innerHTML = '<span class="online-dot"></span> ' + esc(g.topic ? g.topic.substring(0, 30) : 'Group') + ' <span style="color:var(--green);font-size:10px;margin-left:auto;">' + (g.participants ? g.participants.length : 0) + ' members</span>';
            activeGroupsPanel.appendChild(item);
          });
        } else {
          activeGroupsPanel.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No groups yet</div>';
        }
      } catch (err) {
        activeGroupsPanel.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>';
      }
    }

    if (popularResources) {
      try {
        var pr = await API.get('/resources?sort=popular&limit=4');
        if (pr.success && pr.data && pr.data.length > 0) {
          popularResources.innerHTML = '';
          pr.data.forEach(function(r) {
            var item = document.createElement('div');
            item.className = 'panel-item';
            item.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> ' + esc(r.title ? r.title.substring(0, 30) : 'Resource');
            popularResources.appendChild(item);
          });
        } else {
          popularResources.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No resources yet</div>';
        }
      } catch (err) {
        popularResources.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>';
      }
    }
  }

  if (feedTabs) {
    feedTabs.addEventListener('click', function(e) {
      if (e.target.classList.contains('feed-tab')) {
        feedTabs.querySelectorAll('.feed-tab').forEach(function(t) { t.classList.remove('active'); });
        e.target.classList.add('active');
        activeFilter = e.target.dataset.filter;
        fetchPosts();
      }
    });
  }

  if (searchInput) {
    var searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function() { fetchPosts(); }, 400);
    });
  }

  if (fabNewPost) {
    fabNewPost.addEventListener('click', function() {
      if (!Auth.isLoggedIn()) { showToast('Please sign in to post'); return; }
      selectedFiles = [];
      updateFileDisplay();
      if (newPostModal) newPostModal.classList.remove('hidden');
    });
  }

  if (cancelModal) {
    cancelModal.addEventListener('click', function() {
      selectedFiles = [];
      updateFileDisplay();
      if (newPostModal) newPostModal.classList.add('hidden');
    });
  }

  if (newPostModal) {
    newPostModal.addEventListener('click', function(e) { if (e.target === newPostModal) newPostModal.classList.add('hidden'); });
  }

  if (anonymousToggle) {
    anonymousToggle.addEventListener('click', function() {
      isAnonymous = !isAnonymous;
      this.classList.toggle('active', isAnonymous);
    });
  }

  if (fileDropZone && modalImages) {
    fileDropZone.addEventListener('click', function() { modalImages.click(); });

    modalImages.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        for (var i = 0; i < this.files.length; i++) {
          selectedFiles.push(this.files[i]);
        }
        if (selectedFiles.length > 5) selectedFiles = selectedFiles.slice(0, 5);
        updateFileDisplay();
      }
      this.value = '';
    });

    fileDropZone.addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor = 'var(--accent)'; });
    fileDropZone.addEventListener('dragleave', function() { this.style.borderColor = ''; });
    fileDropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      this.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (var i = 0; i < e.dataTransfer.files.length; i++) {
          selectedFiles.push(e.dataTransfer.files[i]);
        }
        if (selectedFiles.length > 5) selectedFiles = selectedFiles.slice(0, 5);
        updateFileDisplay();
      }
    });
  }

  if (submitPostBtn) {
    submitPostBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      var course = $('#modal-course') ? $('#modal-course').value : '';
      var newCourse = modalCourseNew ? modalCourseNew.value.trim().toUpperCase() : '';
      var finalCourse = course || newCourse;
      var title = $('#modal-title') ? $('#modal-title').value.trim() : '';
      var content = $('#modal-content') ? $('#modal-content').value.trim() : '';
      var deadline = $('#modal-deadline') ? $('#modal-deadline').value : '';

      if (!finalCourse || !title || !content) { showToast('Please fill in all fields'); return; }

      var res;

      if (selectedFiles.length > 0) {
        var formData = new FormData();
        formData.append('course', finalCourse);
        formData.append('title', sanitize(title));
        formData.append('content', sanitize(content));
        formData.append('deadline', deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 7*86400000).toISOString());
        formData.append('isAnonymous', isAnonymous);
        for (var i = 0; i < selectedFiles.length; i++) { formData.append('images', selectedFiles[i]); }
        res = await API.post('/help-requests', formData, true);
      } else {
        res = await API.post('/help-requests', {
          course: finalCourse, title: sanitize(title), content: sanitize(content),
          deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 7*86400000).toISOString(),
          isAnonymous: isAnonymous
        });
      }

      if (res.success) {
        showToast('Posted');
        newPostModal.classList.add('hidden');
        var form = $('#new-post-form'); if (form) form.reset();
        selectedFiles = [];
        updateFileDisplay();
        if (modalCourseNew) modalCourseNew.value = '';
        isAnonymous = false;
        if (anonymousToggle) anonymousToggle.classList.remove('active');
        fetchPosts();
        loadRightPanel();
      } else {
        showToast('Error: ' + (res.message || 'Failed'));
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && newPostModal && !newPostModal.classList.contains('hidden')) {
      newPostModal.classList.add('hidden');
    }
  });

  function init() {
    setTheme(true);
    Auth.updateUI();
    loadCourses();
    fetchPosts();
    loadRightPanel();
  }

  init();
})();