import { createSidebar } from '../components/sidebar.js';
import { createPostCard } from '../components/post-card.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');
  if (!app) return;
  app.appendChild(createSidebar());
  const wall = document.createElement('section');
  wall.className = 'feed-grid';
  wall.appendChild(createPostCard({ title: 'Talent wall', body: 'Showcase skills and connect with peers.' }));
  app.appendChild(wall);
});
