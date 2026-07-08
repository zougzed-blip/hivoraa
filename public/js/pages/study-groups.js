import { createSidebar } from '../components/sidebar.js';
import { createPostCard } from '../components/post-card.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = document.querySelector('#app');
  if (!app) return;

  app.appendChild(createSidebar());
  const section = document.createElement('section');
  section.className = 'feed-grid';
  section.appendChild(createPostCard({ title: 'Study session', body: 'Join a group to share skills.' }));
  app.appendChild(section);
});
