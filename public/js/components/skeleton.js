export function createSkeleton(count = 3) {
  const container = document.createElement('div');
  container.className = 'skeleton-grid';
  for (let i = 0; i < count; i += 1) {
    const item = document.createElement('div');
    item.className = 'skeleton-card';
    container.appendChild(item);
  }
  return container;
}
