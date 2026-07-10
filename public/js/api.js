var API = {
  _loadingCount: 0,
  _overlayEl: null,

  ensureLoadingOverlay: function() {
    if (this._overlayEl) return this._overlayEl;

    var overlay = document.createElement('div');
    overlay.id = 'global-loading-overlay';
    overlay.className = 'global-loading-overlay hidden';
    overlay.innerHTML = '<div class="global-loading-card"><img src="/assets/loading.gif" alt="Loading" class="global-loading-gif"><div class="global-loading-text">Loading...</div></div>';

    var root = document.body || document.documentElement;
    if (root) root.appendChild(overlay);
    this._overlayEl = overlay;
    return overlay;
  },

  showLoading: function() {
    this.ensureLoadingOverlay();
    this._loadingCount += 1;
    if (this._loadingCount === 1 && this._overlayEl) {
      this._overlayEl.classList.remove('hidden');
    }
  },

  hideLoading: function() {
    if (this._loadingCount > 0) this._loadingCount -= 1;
    if (this._loadingCount === 0 && this._overlayEl) {
      this._overlayEl.classList.add('hidden');
    }
  },

  request: async function(method, endpoint, body, isFormData) {
    this.showLoading();

    var headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    var csrfToken = this.getCookie('x-csrf-token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    var options = { method: method, headers: headers, credentials: 'include' };
    if (body) {
      options.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      var res = await fetch(CONFIG.API_URL + endpoint, options);
      var data = await res.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: 'Network error' };
    } finally {
      this.hideLoading();
    }
  },

  getCookie: function(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },

  get: function(endpoint) { return this.request('GET', endpoint); },
  post: function(endpoint, body, isFormData) { return this.request('POST', endpoint, body, isFormData || false); },
  put: function(endpoint, body) { return this.request('PUT', endpoint, body); },
  delete: function(endpoint) { return this.request('DELETE', endpoint); }
};