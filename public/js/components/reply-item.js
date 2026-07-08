export function createReplyItem(reply) {
  const item = document.createElement('div');
  item.className = 'reply-item';
  item.textContent = reply.text || 'No reply text.';
  return item;
}
