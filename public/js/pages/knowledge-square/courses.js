var KSCourses = {
  load: async function() {
    var data = await API.get('/courses');
    if (data.success && data.data) {
      KSState.coursesList = data.data;
      this.renderFilters();
      this.renderSelect();
    }
  },

  renderFilters: function() {
    var container = document.getElementById('course-filters');
    if (!container) return;
    container.textContent = '';
    var all = document.createElement('span');
    all.className = 'course-pill active';
    all.setAttribute('data-course', 'all');
    all.textContent = 'All';
    container.appendChild(all);
    KSState.coursesList.forEach(function(c) {
      var pill = document.createElement('span');
      pill.className = 'course-pill';
      pill.setAttribute('data-course', KSSecurity.esc(c.code));
      pill.textContent = c.code;
      container.appendChild(pill);
    });
  },

  renderSelect: function() {
    var select = document.getElementById('modal-course');
    if (!select) return;
    select.textContent = '';
    var opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Select a course...';
    select.appendChild(opt);
    KSState.coursesList.forEach(function(c) {
      var o = document.createElement('option');
      o.value = c._id;
      o.textContent = c.code + ' - ' + c.name;
      select.appendChild(o);
    });
  }
};