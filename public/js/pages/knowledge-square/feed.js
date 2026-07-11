var KSFeed = {
  fetch: async function(reset) {
    if (typeof reset === 'undefined') reset = true;
    if (KSState.isLoading) return;

    var container = document.getElementById('posts-container');
    if (!container) return;

    if (reset) {
      KSState.resetPagination();
      container.textContent = '';
      var loading = document.createElement('div');
      loading.style.cssText = 'text-align:center;padding:60px;color:var(--text-muted);';
      loading.textContent = 'Loading...';
      container.appendChild(loading);
    }

    KSState.isLoading = true;

    var endpoint = '/help-requests?page=' + KSState.currentPage + '&limit=20';
    if (KSState.activeCourse !== 'all') endpoint += '&course=' + encodeURIComponent(KSState.activeCourse);
    if (KSState.activeFilter === 'deadline') endpoint += '&sort=deadline';
    if (KSState.activeFilter === 'active') endpoint += '&sort=active';
    var q = document.getElementById('search-input');
    if (q && q.value.trim()) endpoint += '&search=' + encodeURIComponent(KSSecurity.sanitize(q.value.trim()));

    try {
      var data = await API.get(endpoint);

      if (reset) container.textContent = '';

      var oldBtn = document.getElementById('load-more-btn');
      if (oldBtn) oldBtn.remove();

      if (data.success && data.data && data.data.length > 0) {
        var self = this;
        data.data.forEach(function(post) {
          container.appendChild(self.buildPost(post));
        });

        if (data.data.length < 20) {
          KSState.hasMore = false;
        } else {
          KSState.hasMore = true;
          KSState.currentPage++;
        }
      } else if (reset) {
        var empty = document.createElement('div');
        empty.style.cssText = 'text-align:center;padding:60px;color:var(--text-muted);';
        empty.textContent = 'No posts yet.';
        container.appendChild(empty);
        KSState.hasMore = false;
      }

      if (KSState.hasMore) {
        var loadMore = document.createElement('div');
        loadMore.id = 'load-more-btn';
        loadMore.style.cssText = 'text-align:center;padding:16px 0 8px;';
        var btn = document.createElement('button');
        btn.className = 'load-more-link';
        btn.textContent = 'Load More';
        btn.addEventListener('click', function() {
          KSFeed.fetch(false);
        });
        loadMore.appendChild(btn);
        container.appendChild(loadMore);
      }

    } catch (err) {
      if (reset) container.textContent = 'Network error.';
    }

    KSState.isLoading = false;
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

    // Images
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
        var voteType = this.dataset.vote;
        await API.post('/help-requests/' + postId + '/vote', { vote: voteType });
        updateVotesLocal(article, postId);
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
      var res = await API.post('/help-requests/' + postId + '/reply', { content: KSSecurity.sanitize(val) });
      if (res.success) {
        textarea.value = '';
        addReplyToPost(article, res.data);
      }
    });
    inputRow.appendChild(textarea);
    inputRow.appendChild(sendBtn);
    repliesSection.appendChild(inputRow);

    article.appendChild(repliesSection);
    return article;
  }
};

// Helper: Add reply without reloading
function addReplyToPost(article, reply) {
  var repliesSection = article.querySelector('.replies-section');
  var inputRow = repliesSection.querySelector('.reply-input-row');

  var item = document.createElement('div');
  item.className = 'reply-item';

  var rh = document.createElement('div');
  rh.className = 'reply-header';
  var ra = document.createElement('span');
  ra.className = 'reply-author';
  var user = Auth.getUser();
  ra.textContent = reply.author ? reply.author.pseudonym : (user ? user.pseudonym : 'You');
  var rt = document.createElement('span');
  rt.className = 'reply-time';
  rt.textContent = 'just now';
  rh.appendChild(ra);
  rh.appendChild(rt);

  var rtxt = document.createElement('div');
  rtxt.className = 'reply-text';
  rtxt.textContent = reply.content || '';

  item.appendChild(rh);
  item.appendChild(rtxt);

  repliesSection.insertBefore(item, inputRow);

  var stats = article.querySelector('.post-stats');
  if (stats) {
    var match = stats.textContent.match(/\d+/);
    var count = match ? parseInt(match[0]) + 1 : 1;
    stats.textContent = count + ' replies';
  }
}

function updateVotesLocal(article, postId) {
  API.get('/help-requests/' + postId).then(function(data) {
    if (!data.success || !data.data) return;
    var post = data.data;
    var tv = post.difficultyVotes ? post.difficultyVotes.length : 0;
    var easy = post.difficultyVotes ? post.difficultyVotes.filter(function(v) { return v.vote === 'easy'; }).length : 0;
    var medium = post.difficultyVotes ? post.difficultyVotes.filter(function(v) { return v.vote === 'medium'; }).length : 0;
    var hard = post.difficultyVotes ? post.difficultyVotes.filter(function(v) { return v.vote === 'hard'; }).length : 0;
    var eP = tv > 0 ? Math.round((easy / tv) * 100) : 0;
    var mP = tv > 0 ? Math.round((medium / tv) * 100) : 0;
    var hP = tv > 0 ? Math.round((hard / tv) * 100) : 0;

    var diffBars = article.querySelector('.difficulty-mini');
    if (diffBars) {
      diffBars.innerHTML = '<div class="diff-mini-item"><span class="diff-mini-dot green"></span><div class="diff-mini-track"><div class="diff-mini-fill green" style="width:' + eP + '%;"></div></div><span class="diff-mini-pct">' + eP + '%</span></div>' +
        '<div class="diff-mini-item"><span class="diff-mini-dot yellow"></span><div class="diff-mini-track"><div class="diff-mini-fill yellow" style="width:' + mP + '%;"></div></div><span class="diff-mini-pct">' + mP + '%</span></div>' +
        '<div class="diff-mini-item"><span class="diff-mini-dot red"></span><div class="diff-mini-track"><div class="diff-mini-fill red" style="width:' + hP + '%;"></div></div><span class="diff-mini-pct">' + hP + '%</span></div>';
    }

    var voteBtns = article.querySelectorAll('.vote-btn');
    if (voteBtns.length >= 3) {
      voteBtns[0].textContent = 'Easy (' + easy + ')';
      voteBtns[1].textContent = 'Medium (' + medium + ')';
      voteBtns[2].textContent = 'Hard (' + hard + ')';
    }
  });
}