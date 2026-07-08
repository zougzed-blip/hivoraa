var KSSecurity = {
 
  escapeHTML: function(text) {
    if (!text || typeof text !== 'string') return '';
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return text.replace(/[&<>"'`=\/]/g, function(s) { return map[s]; });
  },

  esc: function(text) { return this.escapeHTML(text); },

  sanitize: function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '').replace(/[<>"'&`=\/]/g, '').trim();
  },

  sanitizePostData: function(data) {
    var clean = {};
    if (data.course) clean.course = this.sanitize(data.course);
    if (data.title) clean.title = this.sanitize(data.title);
    if (data.content) clean.content = this.sanitize(data.content);
    if (data.deadline) clean.deadline = data.deadline;
    if (data.isAnonymous !== undefined) clean.isAnonymous = !!data.isAnonymous;
    return clean;
  },

  validateTitle: function(title) {
    if (!title || typeof title !== 'string') return false;
    var clean = this.sanitize(title);
    return clean.length >= 3 && clean.length <= 150;
  },

  validateContent: function(content) {
    if (!content || typeof content !== 'string') return false;
    var clean = this.sanitize(content);
    return clean.length >= 5 && clean.length <= 3000;
  },

  requireAuth: function() {
    return Auth.isLoggedIn();
  },

  canPerformAction: function(action) {
    if (action === 'post' || action === 'reply' || action === 'vote') {
      return this.requireAuth();
    }
    return true;
  }
};