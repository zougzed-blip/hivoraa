export function createSidebar() {
  const nav = document.createElement('nav');
  nav.className = 'sidebar';
  nav.innerHTML = `
    <a href="/">Knowledge Square</a>
    <a href="/study-groups">Study Groups</a>
    <a href="/resources">Resources</a>
    <a href="/talents">Talent Wall</a>
    <a href="/trust-circle">Trust Circle</a>
    <a href="/listening-chamber">Listening Chamber</a>
    <a href="profile.html">Profile</a>
    <a href="/auth">Login</a>
  `;
  return nav;
}
