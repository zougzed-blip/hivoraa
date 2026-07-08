import { createSidebar } from '../components/sidebar.js';
import { createPostCard } from '../components/post-card.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');
  if (!app) return;
  app.appendChild(createSidebar());
  const circle = document.createElement('section');
  circle.className = 'feed-grid';
  circle.appendChild(createPostCard({ title: 'Trust Circle', body: 'Share trust stories and support each other.' }));
  app.appendChild(circle);
});
