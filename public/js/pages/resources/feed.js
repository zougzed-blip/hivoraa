var RSFeed = {
  fetch: async function(reset) {
    if (typeof reset === 'undefined') reset = true;
    if (RSState.isLoading) return;

    var container = document.getElementById('resources-container');
    if (!container) return;

    if (reset) {
      RSState.resetPagination();
      RSState.resources = [];
      container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">Loading...</div>';
    }

    RSState.isLoading = true;

    var endpoint = '/resources?page=' + RSState.currentPage + '&limit=20';
    if (RSState.activeType !== 'all') endpoint += '&type=' + RSState.activeType;
    var q = document.getElementById('search-input');
    if (q && q.value.trim()) endpoint += '&search=' + encodeURIComponent(KSSecurity.sanitize(q.value.trim()));

    try {
      var data = await API.get(endpoint);
      if (data.success && data.data && data.data.length > 0) {
        if (reset) {
          RSState.resources = [];
        }
        RSState.resources = RSState.resources.concat(data.data);
        if (data.data.length < 20) {
          RSState.hasMore = false;
        } else {
          RSState.hasMore = true;
          RSState.currentPage++;
        }
      } else {
        RSState.hasMore = false;
      }

      this.render();
    } catch (err) {
      if (reset) container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No resources found.</div>';
    }

    RSState.isLoading = false;
  },

  render: function() {
    var container = document.getElementById('resources-container');
    if (!container) return;

    if (!RSState.resources.length) {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">No resources found.</div>';
      return;
    }

    container.innerHTML = '';
    var self = this;
    RSState.resources.forEach(function(r) {
      container.appendChild(self.buildCard(r));
    });

    if (RSState.hasMore) {
      var loadMore = document.createElement('div');
      loadMore.id = 'load-more-btn';
      loadMore.style.cssText = 'text-align:center;padding:16px 0 8px;';
      var btn = document.createElement('button');
      btn.className = 'load-more-link';
      btn.textContent = 'Load More';
      btn.addEventListener('click', function() {
        RSFeed.fetch(false);
      });
      loadMore.appendChild(btn);
      container.appendChild(loadMore);
    }

    this.attachEvents();
    if (typeof RSRightPanel !== 'undefined') RSRightPanel.update();
  },

  buildCard: function(r) {
    var card = document.createElement('div');
    card.className = 'resource-card';
    card.setAttribute('data-id', r._id);

    var fileUrl = r.fileUrl || r.url || '';

    var thumbHTML = this.getThumbHTML(r);
    var courseCode = r.course ? (typeof r.course === 'object' ? r.course.code : r.course) : 'N/A';
    var authorName = r.uploader ? (typeof r.uploader === 'object' ? r.uploader.pseudonym : r.uploader) : 'Unknown';
    var likesCount = r.likes ? r.likes.length : 0;
    var user = Auth.getUser();
    var userId = user ? (user.id || user._id) : null;
    var uploaderId = r.uploader ? (typeof r.uploader === 'object' ? (r.uploader._id || r.uploader.id) : r.uploader) : null;
    var isOwner = userId && uploaderId && userId === uploaderId;
    var liked = r.likes ? r.likes.some(function(id) { return id === userId; }) : false;

    card.innerHTML = '<div class="resource-thumb" data-url="' + fileUrl + '">' + thumbHTML + '</div>' +
      '<div class="resource-body">' +
        '<div class="resource-top"><span class="course-tag">' + KSSecurity.esc(courseCode) + '</span><span class="resource-type-badge ' + (r.type || '') + '">' + KSSecurity.esc((r.type || '').toUpperCase()) + '</span></div>' +
        '<div class="resource-title">' + KSSecurity.esc(r.title || '') + '</div>' +
        '<div class="resource-meta">' +
          '<span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' + KSSecurity.esc(authorName) + '</span>' +
          '<span>' + Utils.timeAgo(r.createdAt) + '</span>' +
        '</div>' +
        '<div class="resource-footer">' +
          '<div class="resource-stats">' +
            '<button class="resource-action like-btn' + (liked ? ' liked' : '') + '" data-id="' + r._id + '"><svg width="13" height="13" viewBox="0 0 24 24" fill="' + (liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ' + likesCount + '</button>' +
            '<span class="resource-stat-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg> ' + (r.downloads || 0) + '</span>' +
          '</div>' +
          '<div class="resource-btns">' + this.getActionBtn(r) + (isOwner ? '<button class="resource-delete-btn" data-id="' + r._id + '"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : '') + '</div>' +
        '</div>' +
      '</div>';

    return card;
  },

  getThumbHTML: function(r) {
    var url = r.fileUrl || r.url || '';
    if (r.type === 'video') {
      return '<div class="thumb-video-wrapper"><span class="play-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><polygon points="5 3 19 12 5 21 5 3"/></svg></span></div>';
    }
    if (r.type === 'image' && url) {
      return '<img src="' + url + '" alt="' + KSSecurity.esc(r.title || '') + '" class="resource-thumb-img" loading="lazy">';
    }
    if (r.type === 'pdf') {
      return '<div class="thumb-pdf-preview"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>PDF</span></div>';
    }
    return '<span class="resource-thumb-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>';
  },

  getActionBtn: function(r) {
    var url = r.fileUrl || r.url || '';
    if (!url || url === '#') return '';
    if (r.type === 'pdf' || r.type === 'image') {
      return '<a class="resource-download-btn" href="' + url + '" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg> View</a>';
    }
    return '<a class="resource-open-btn" href="' + url + '" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Open</a>';
  },

  attachEvents: function() {
    // Clic sur le thumbnail -> ouvrir le fichier
    document.querySelectorAll('.resource-thumb').forEach(function(thumb) {
      thumb.addEventListener('click', function(e) {
        e.stopPropagation();
        var url = this.dataset.url;
        if (url && url !== '#' && url !== '') {
          window.open(url, '_blank');
        }
      });
    });

    document.querySelectorAll('.like-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); RSEvents.toggleLike(b.dataset.id); });
    });
    document.querySelectorAll('.resource-delete-btn').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); RSEvents.deleteResource(b.dataset.id); });
    });
  }
};