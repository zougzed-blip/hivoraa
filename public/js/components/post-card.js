export function createPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.innerHTML = `
    <h2>${post.title || 'Untitled'}</h2>
    <p>${post.body || 'No content available.'}</p>
  `;
  return card;
}
