var API = {
  request: async function(method, endpoint, body, isFormData) {
    var headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    var token = localStorage.getItem('hivoraa_token');
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    var options = { method: method, headers: headers };
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
    }
  },

  get: function(endpoint) { return this.request('GET', endpoint); },
  post: function(endpoint, body, isFormData) { return this.request('POST', endpoint, body, isFormData || false); },
  put: function(endpoint, body) { return this.request('PUT', endpoint, body); },
  delete: function(endpoint) { return this.request('DELETE', endpoint); }
};