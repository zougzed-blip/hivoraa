var KSFeed = {
  fetch: async function() {
    var container = document.getElementById('posts-container');
    if (!container) return;
    container.textContent = '';
    var loading = document.createElement('div');
    loading.style.cssText = 'text-align:center;padding:60px;color:var(--text-muted);';
    loading.textContent = 'Loading...';
    container.appendChild(loading);

    var endpoint = '/help-requests?page=1&limit=20';
    if (KSState.activeCourse !== 'all') endpoint += '&course=' + encodeURIComponent(KSState.activeCourse);
    if (KSState.activeFilter === 'deadline') endpoint += '&sort=deadline';
    if (KSState.activeFilter === 'active') endpoint += '&sort=active';
    var q = document.getElementById('search-input');
    if (q && q.value.trim()) endpoint += '&search=' + encodeURIComponent(KSSecurity.sanitize(q.value.trim()));

    try {
      var data = await API.get(endpoint);
      container.textContent = '';
      if (data.success && data.data && data.data.length > 0) {
        var self = this;
        data.data.forEach(function(post) {
          container.appendChild(self.buildPost(post));
        });
      } else {
        var empty = document.createElement('div');
        empty.style.cssText = 'text-align:center;padding:60px;color:var(--text-muted);';
        empty.textContent = 'No posts yet.';
        container.appendChild(empty);
      }
    } catch (err) {
      container.textContent = 'Network error.';
    }
  },

  buildPost: function(post) {
    var days = KSUtils.daysUntil(post.deadline);
    var di = KSUtils.getDeadlineInfo(days);
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

    // Header
    var header = document.createElement('div');
    header.className = 'post-header';
    var tag = document.createElement('span');
    tag.className = 'course-tag';
    tag.textContent = post.course ? post.course.code : 'N/A';
    var title = document.createElement('span');
    title.className = 'post-title';
    title.textContent = post.title || '';
    header.appendChild(tag);
    header.appendChild(title);
    article.appendChild(header);

    // Meta
    var meta = document.createElement('div');
    meta.className = 'post-meta';
    meta.textContent = (post.author ? post.author.pseudonym : 'Anonymous') + ' \u00B7 ' + KSUtils.timeAgo(post.createdAt);
    article.appendChild(meta);

    // Content
    var content = document.createElement('div');
    content.className = 'post-content';
    content.textContent = post.content || '';
    article.appendChild(content);

    // Images - PAS d'echappement sur les URLs
    if (post.images && post.images.length > 0) {
      var imagesDiv = document.createElement('div');
      imagesDiv.className = 'post-images';
      post.images.forEach(function(imgUrl) {
        var imgEl = document.createElement('img');
        imgEl.src = imgUrl;
        imgEl.className = 'post-image';
        imgEl.loading = 'lazy';
        imgEl.alt = 'Post image';
        imgEl.addEventListener('click', function() {
          if (window.openImageViewer) window.openImageViewer(imgUrl);
        });
        imagesDiv.appendChild(imgEl);
      });
      article.appendChild(imagesDiv);
    }

    // Difficulty
    var diff = document.createElement('div');
    diff.className = 'difficulty-mini';
    diff.innerHTML = '<div class="diff-mini-item"><span class="diff-mini-dot green"></span><div class="diff-mini-track"><div class="diff-mini-fill green" style="width:' + eP + '%;"></div></div><span class="diff-mini-pct">' + eP + '%</span></div>' +
      '<div class="diff-mini-item"><span class="diff-mini-dot yellow"></span><div class="diff-mini-track"><div class="diff-mini-fill yellow" style="width:' + mP + '%;"></div></div><span class="diff-mini-pct">' + mP + '%</span></div>' +
      '<div class="diff-mini-item"><span class="diff-mini-dot red"></span><div class="diff-mini-track"><div class="diff-mini-fill red" style="width:' + hP + '%;"></div></div><span class="diff-mini-pct">' + hP + '%</span></div>';
    article.appendChild(diff);

    // Vote buttons
    var votes = document.createElement('div');
    votes.className = 'vote-buttons';
    var voteLabels = [
      { key: 'easy', count: easy },
      { key: 'medium', count: medium },
      { key: 'hard', count: hard }
    ];
    voteLabels.forEach(function(v) {
      var btn = document.createElement('button');
      btn.className = 'vote-btn';
      btn.textContent = v.key.charAt(0).toUpperCase() + v.key.slice(1) + ' (' + v.count + ')';
      btn.setAttribute('data-post', postId);
      btn.setAttribute('data-vote', v.key);
      btn.addEventListener('click', async function() {
        await API.post('/help-requests/' + postId + '/vote', { vote: this.dataset.vote });
        KSFeed.fetch();
      });
      votes.appendChild(btn);
    });
    article.appendChild(votes);

    // Progress
    var prog = document.createElement('div');
    prog.className = 'progress-bar-bottom';
    prog.innerHTML = '<div class="progress-bar-track"><div class="progress-bar-fill ' + di.color + '" style="width:' + KSUtils.getProgressPercent(days) + '%;"></div></div>' +
      '<span class="progress-label" style="color:var(--' + di.color + ')"><span class="deadline-dot ' + di.color + '"></span>' + di.text + '</span>';
    article.appendChild(prog);

    // Stats
    var stats = document.createElement('div');
    stats.className = 'post-stats';
    stats.textContent = replies.length + ' replies';
    article.appendChild(stats);

    // Replies
    var repliesSection = document.createElement('div');
    repliesSection.className = 'replies-section';
    var visibleReplies = replies.slice(0, 3);
    var hiddenReplies = replies.slice(3);

    visibleReplies.forEach(function(r) {
      var item = document.createElement('div');
      item.className = 'reply-item';
      var rh = document.createElement('div');
      rh.className = 'reply-header';
      var ra = document.createElement('span');
      ra.className = 'reply-author';
      ra.textContent = r.author ? r.author.pseudonym : 'Anonymous';
      var rt = document.createElement('span');
      rt.className = 'reply-time';
      rt.textContent = KSUtils.timeAgo(r.createdAt);
      rh.appendChild(ra);
      rh.appendChild(rt);
      var rtxt = document.createElement('div');
      rtxt.className = 'reply-text';
      rtxt.textContent = r.content || '';
      item.appendChild(rh);
      item.appendChild(rtxt);
      repliesSection.appendChild(item);
    });

    if (hiddenReplies.length > 0) {
      var showBtn = document.createElement('button');
      showBtn.className = 'show-more-btn';
      showBtn.textContent = 'Show ' + hiddenReplies.length + ' more';
      var hiddenDiv = document.createElement('div');
      hiddenDiv.className = 'hidden';
      hiddenReplies.forEach(function(r) {
        var item = document.createElement('div');
        item.className = 'reply-item';
        var rh = document.createElement('div');
        rh.className = 'reply-header';
        var ra = document.createElement('span');
        ra.className = 'reply-author';
        ra.textContent = r.author ? r.author.pseudonym : 'Anonymous';
        var rt = document.createElement('span');
        rt.className = 'reply-time';
        rt.textContent = KSUtils.timeAgo(r.createdAt);
        rh.appendChild(ra);
        rh.appendChild(rt);
        var rtxt = document.createElement('div');
        rtxt.className = 'reply-text';
        rtxt.textContent = r.content || '';
        item.appendChild(rh);
        item.appendChild(rtxt);
        hiddenDiv.appendChild(item);
      });
      showBtn.addEventListener('click', function() {
        hiddenDiv.classList.remove('hidden');
        showBtn.remove();
      });
      repliesSection.appendChild(showBtn);
      repliesSection.appendChild(hiddenDiv);
    }

    // Reply input
    var inputRow = document.createElement('div');
    inputRow.className = 'reply-input-row';
    var textarea = document.createElement('textarea');
    textarea.placeholder = 'Write a reply...';
    textarea.rows = 1;
    var sendBtn = document.createElement('button');
    sendBtn.className = 'send-reply-btn';
    sendBtn.textContent = 'Send';
    sendBtn.addEventListener('click', async function() {
      var val = textarea.value.trim();
      if (!val) return;
      if (!KSSecurity.requireAuth()) { Toast.show('Sign in to reply'); return; }
      await API.post('/help-requests/' + postId + '/reply', { content: KSSecurity.sanitize(val) });
      textarea.value = '';
      KSFeed.fetch();
    });
    inputRow.appendChild(textarea);
    inputRow.appendChild(sendBtn);
    repliesSection.appendChild(inputRow);

    article.appendChild(repliesSection);
    return article;
  }
};