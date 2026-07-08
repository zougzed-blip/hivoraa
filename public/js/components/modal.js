export function createModal(content) {
  const wrapper = document.createElement('div');
  wrapper.className = 'modal-backdrop';
  wrapper.innerHTML = `
    <div class="modal">
      ${content}
    </div>
  `;
  wrapper.addEventListener('click', (event) => {
    if (event.target === wrapper) {
      wrapper.remove();
    }
  });
  return wrapper;
}
