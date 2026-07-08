import { createSidebar } from '../components/sidebar.js';
import { createPostCard } from '../components/post-card.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');
  if (!app) return;
  app.appendChild(createSidebar());
  const chamber = document.createElement('section');
  chamber.className = 'feed-grid';
  chamber.appendChild(createPostCard({ title: 'Listening Chamber', body: 'Find quiet support and reflection prompts.' }));
  app.appendChild(chamber);
});
