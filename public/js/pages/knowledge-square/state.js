var KSState = (function() {
 
  var _isAnonymous = false;
  var _isDarkMode = true;
  var _activeFilter = 'for-you';
  var _activeCourse = 'all';
  var _coursesList = [];
  var _selectedFiles = [];

  return {
    get isAnonymous() { return _isAnonymous; },
    set isAnonymous(val) { _isAnonymous = !!val; },

    get isDarkMode() { return _isDarkMode; },
    set isDarkMode(val) { _isDarkMode = !!val; },

    get activeFilter() { return _activeFilter; },
    set activeFilter(val) {
      var allowed = ['for-you', 'recent', 'active', 'deadline'];
      if (allowed.indexOf(val) !== -1) _activeFilter = val;
    },

    get activeCourse() { return _activeCourse; },
    set activeCourse(val) {
      if (val === 'all' || /^[a-zA-Z0-9]+$/.test(val)) _activeCourse = val;
    },

    get coursesList() { return _coursesList.slice(); },
    set coursesList(val) {
      if (Array.isArray(val)) _coursesList = val.slice(0, 50);
    },

    get selectedFiles() { return _selectedFiles.slice(); },

    addFiles: function(files) {
      for (var i = 0; i < files.length; i++) {
        if (_selectedFiles.length >= 5) break;
        if (files[i] && files[i].size < 10 * 1024 * 1024) {
          _selectedFiles.push(files[i]);
        }
      }
    },

    clearFiles: function() { _selectedFiles = []; },

    reset: function() {
      _isAnonymous = false;
      _selectedFiles = [];
    }
  };
})();