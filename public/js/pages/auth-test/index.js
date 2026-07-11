
function showStatus(message, type) {
  var el = document.getElementById('status-message');
  el.className = 'status-message ' + type;
  el.innerHTML = type === 'loading' ? '<span class="spinner"></span>' + message : message;
}

function login() {
  showStatus('Redirecting to Google...', 'loading');

  var nonce = crypto.randomUUID();
  sessionStorage.setItem('oauth_nonce', nonce);

  var authUrl = "https://accounts.google.com/o/oauth2/v2/auth" +
    "?client_id=" + CONFIG.GOOGLE_CLIENT_ID +
    "&redirect_uri=" + encodeURIComponent(CONFIG.REDIRECT_URI) +
    "&response_type=id_token" + 
    "&scope=openid%20email%20profile" +
    "&nonce=" + nonce +
    "&prompt=select_account";

  window.location.href = authUrl;
}

window.addEventListener('load', function () {
 
  var googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) googleBtn.addEventListener('click', login);

  var logoImg = document.getElementById('logo-img');
  if (logoImg) logoImg.addEventListener('error', function () {
    logoImg.style.display = 'none';
  });

  var hash = window.location.hash;
  if (!hash) return;

  var params = new URLSearchParams(hash.substring(1));
  var idToken = params.get("id_token");
  window.location.hash = "";

  if (!idToken) return;

  var expectedNonce = sessionStorage.getItem('oauth_nonce');
  sessionStorage.removeItem('oauth_nonce');

  try {
    var payload = JSON.parse(atob(idToken.split('.')[1]));
    if (expectedNonce && payload.nonce !== expectedNonce) {
      showStatus('Security check failed. Please try again.', 'error');
      return;
    }
  } catch (e) {
    showStatus('Invalid token received.', 'error');
    return;
  }

  showStatus('Signing you in...', 'loading');

  API.post('/auth/google', { token: idToken })
    .then(function (data) {
      if (data.success) {
        
        Auth.setUser(data.data.user);
        showStatus('Welcome! Redirecting...', 'success');
        setTimeout(function () {
          window.location.href = '/';
        }, 800);
      } else {
        showStatus(data.message || 'Authentication failed. Please try again.', 'error');
      }
    })
    .catch(function (err) {
      showStatus('Connection error. Please try again.', 'error');
      
    });
});