var Utils = {
  esc: function(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  },

  sanitize: function(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '').trim();
  },

  formatDate: function(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  clamp: function(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

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