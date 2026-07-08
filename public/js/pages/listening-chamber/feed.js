var LCFeed = {
  fetchDoors: async function() {
    var data = await API.get('/listening-chamber/doors');
    if (data.success && data.data) {
      LCState.doors = data.data;
    }
  },

  renderGate: function() {
    LCState.currentView = 'gate';
    var container = document.getElementById('content-area');
    if (!container) return;
    container.innerHTML =
      '<div class="chamber-gate">' +
        '<div class="chamber-gate-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div>' +
        '<div class="chamber-gate-title">You are completely anonymous.</div>' +
        '<div class="chamber-gate-subtitle">Nothing you share can be traced back to you. Take your time. You are safe.</div>' +
        '<button class="chamber-btn-enter" id="enter-btn">Enter</button>' +
        '<br><button class="chamber-text-link" id="goto-check-link">Check a submitted report</button>' +
      '</div>';
    document.getElementById('enter-btn').addEventListener('click', function() { LCFeed.renderDoors(); });
    document.getElementById('goto-check-link').addEventListener('click', function() { LCFeed.renderCheck(); });
  },

  renderDoors: function() {
    LCState.currentView = 'doors';
    var container = document.getElementById('content-area');
    if (!container) return;
    container.innerHTML =
      '<div class="chamber-doors-list">' +
        LCState.doors.map(function(d) {
          return '<div class="chamber-door-card" data-door="' + d.id + '">' +
            '<div class="chamber-door-number">' + d.id + '</div>' +
            '<div class="chamber-door-info"><div class="chamber-door-name">' + KSSecurity.esc(d.name) + '</div><div class="chamber-door-desc">' + KSSecurity.esc(d.description) + '</div></div>' +
            '<div class="chamber-door-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="text-align:center;margin-top:16px;"><button class="chamber-text-link" id="back-to-gate">Go back</button></div>';
    document.querySelectorAll('.chamber-door-card').forEach(function(card) {
      card.addEventListener('click', function() { LCFeed.openDoor(parseInt(card.dataset.door)); });
    });
    document.getElementById('back-to-gate').addEventListener('click', function() { LCFeed.renderGate(); });
  },

  openDoor: function(doorId) {
    var door = LCState.doors.find(function(d) { return d.id === doorId; });
    if (!door) return;
    LCState.currentView = 'submit';
    var container = document.getElementById('content-area');
    if (!container) return;
    container.innerHTML =
      '<div class="chamber-submit-panel">' +
        '<button class="chamber-back-btn" id="back-to-doors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Back to doors</button>' +
        '<div class="chamber-panel-title">' + KSSecurity.esc(door.name) + '</div>' +
        '<div class="chamber-panel-subtitle">' + KSSecurity.esc(door.description) + '</div>' +
        '<textarea class="chamber-textarea" id="report-content" placeholder="Tell us what\'s happening..."></textarea>' +
        '<button class="chamber-submit-btn" id="submit-report-btn">Send anonymously</button>' +
      '</div>';
    document.getElementById('back-to-doors').addEventListener('click', function() { LCFeed.renderDoors(); });
    document.getElementById('submit-report-btn').addEventListener('click', function() {
      LCEvents.submitReport(doorId);
    });
  },

  renderCode: function(code) {
    LCState.currentView = 'code';
    var container = document.getElementById('content-area');
    if (!container) return;
    container.innerHTML =
      '<div class="chamber-code-panel">' +
        '<div class="chamber-gate-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg></div>' +
        '<div class="chamber-code-title">Your report has been submitted.</div>' +
        '<div class="chamber-code-value">' + KSSecurity.esc(code) + '</div>' +
        '<div class="chamber-code-warning">Save this code. It is the ONLY way to check for responses.</div>' +
        '<button class="chamber-btn-copy" id="copy-code-btn">Copy code</button>' +
        '<br><button class="chamber-text-link" id="goto-check-from-code">Check a report status</button>' +
        '<br><button class="chamber-text-link" id="back-to-gate-from-code">Return to start</button>' +
      '</div>';
    document.getElementById('copy-code-btn').addEventListener('click', function() {
      navigator.clipboard.writeText(code).then(function() { Toast.show('Code copied'); });
    });
    document.getElementById('goto-check-from-code').addEventListener('click', function() { LCFeed.renderCheck(); });
    document.getElementById('back-to-gate-from-code').addEventListener('click', function() { LCFeed.renderGate(); });
  },

  renderCheck: function() {
    LCState.currentView = 'check';
    var container = document.getElementById('content-area');
    if (!container) return;
    container.innerHTML =
      '<div class="chamber-check-panel">' +
        '<button class="chamber-back-btn" id="check-back-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Back</button>' +
        '<div class="chamber-panel-title" style="margin-bottom:12px;">Check a report</div>' +
        '<div class="chamber-check-row">' +
          '<input class="chamber-check-input" id="check-code-input" placeholder="Enter your code (e.g. CONFI-...)">' +
          '<button class="chamber-btn-check" id="check-btn">Check</button>' +
        '</div>' +
        '<div id="check-result"></div>' +
      '</div>';
    document.getElementById('check-back-btn').addEventListener('click', function() { LCFeed.renderGate(); });
    document.getElementById('check-btn').addEventListener('click', function() {
      LCEvents.checkReport();
    });
  }
};