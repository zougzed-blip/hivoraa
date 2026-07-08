var KSUtils = {
  daysUntil: function(dateStr) {
    if (!dateStr) return 14;
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  },
  getDeadlineInfo: function(days) {
    if (days > 7) return { color: 'green', text: days + 'd left' };
    if (days >= 3) return { color: 'yellow', text: days + 'd left' };
    if (days > 0) return { color: 'red', text: days + 'd left' };
    if (days === 0) return { color: 'red', text: 'Today' };
    return { color: 'red', text: 'Overdue' };
  },
  getProgressPercent: function(days) {
    if (days < 0) return 100;
    return Math.min(100, Math.max(5, ((14 - days) / 14) * 100));
  },
  timeAgo: function(dateStr) {
    if (!dateStr) return '';
    var seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    return Math.floor(hours / 24) + 'd ago';
  }
};

document.addEventListener('DOMContentLoaded', function() {
  KSEvents.init();
  KSCourses.load();
  KSFeed.fetch();
  loadRightPanel();
  Auth.updateUI();
});

function loadRightPanel() {
  var trendingPosts = document.getElementById('trending-posts');
  var activeGroupsPanel = document.getElementById('active-groups');
  var popularResources = document.getElementById('popular-resources');

  if (trendingPosts) {
    API.get('/help-requests?sort=active&limit=4').then(function(data) {
      if (data.success && data.data && data.data.length > 0) {
        trendingPosts.textContent = '';
        data.data.forEach(function(p) {
          var item = document.createElement('div');
          item.className = 'panel-item';
          item.innerHTML = '<span class="item-tag">' + KSSecurity.esc(p.course ? p.course.code : 'N/A') + '</span> ' + KSSecurity.esc(p.title ? p.title.substring(0, 30) : '');
          trendingPosts.appendChild(item);
        });
      } else {
        trendingPosts.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No posts yet</div>';
      }
    }).catch(function() {
      trendingPosts.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>';
    });
  }

  if (activeGroupsPanel) {
    API.get('/study-groups').then(function(data) {
      if (data.success && data.data && data.data.length > 0) {
        activeGroupsPanel.textContent = '';
        data.data.slice(0, 4).forEach(function(g) {
          var item = document.createElement('div');
          item.className = 'panel-item';
          item.innerHTML = '<span class="online-dot"></span> ' + KSSecurity.esc(g.topic ? g.topic.substring(0, 30) : 'Group') + ' <span style="color:var(--green);font-size:10px;margin-left:auto;">' + (g.participants ? g.participants.length : 0) + ' members</span>';
          activeGroupsPanel.appendChild(item);
        });
      } else {
        activeGroupsPanel.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No groups yet</div>';
      }
    }).catch(function() {
      activeGroupsPanel.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>';
    });
  }

  if (popularResources) {
    API.get('/resources?sort=popular&limit=4').then(function(data) {
      if (data.success && data.data && data.data.length > 0) {
        popularResources.textContent = '';
        data.data.forEach(function(r) {
          var item = document.createElement('div');
          item.className = 'panel-item';
          item.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> ' + KSSecurity.esc(r.title ? r.title.substring(0, 30) : 'Resource');
          popularResources.appendChild(item);
        });
      } else {
        popularResources.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">No resources yet</div>';
      }
    }).catch(function() {
      popularResources.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Unavailable</div>';
    });
  }
}