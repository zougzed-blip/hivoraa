export function createProgressBar(percent) {
  const wrapper = document.createElement('div');
  wrapper.className = 'progress-bar';
  wrapper.innerHTML = `<div class="progress-track"><div class="progress-fill" style="width: ${percent}%"></div></div>`;
  return wrapper;
}
