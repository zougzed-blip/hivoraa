export function createSidebar() {
  const nav = document.createElement('nav');
  nav.className = 'sidebar';
  nav.innerHTML = `
    <a href="index.html">Knowledge Square</a>
    <a href="groups.html">Study Groups</a>
    <a href="resources.html">Resources</a>
    <a href="talents.html">Talent Wall</a>
    <a href="trust-circle.html">Trust Circle</a>
    <a href="listening-chamber.html">Listening Chamber</a>
    <a href="saved.html">Saved Posts</a>
    <a href="profile.html">Profile</a>
    <a href="auth.html">Login</a>
  `;
  return nav;
}
