import { createSidebar } from '../components/sidebar.js';
import { createPostCard } from '../components/post-card.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');
  if (!app) return;
  app.appendChild(createSidebar());
  const resources = document.createElement('section');
  resources.className = 'feed-grid';
  resources.appendChild(createPostCard({ title: 'Resource guide', body: 'Learn how to use the platform.' }));
  app.appendChild(resources);
});
