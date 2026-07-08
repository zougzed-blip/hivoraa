export function createRightPanel() {
  const panel = document.createElement('aside');
  panel.className = 'right-panel';
  panel.innerHTML = `
    <h2>Quick updates</h2>
    <p>Activity, reminders, and links appear here.</p>
  `;
  return panel;
}
