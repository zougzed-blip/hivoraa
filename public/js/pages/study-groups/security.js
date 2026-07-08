export function initSecurity(state) {
  const isAuthenticated = Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));

  if (!isAuthenticated) {
    state.canInteract = false;
    return;
  }

  state.canInteract = true;
}

export function ensureSafeAction(state, action) {
  if (!state.canInteract) {
    throw new Error('You must be signed in to perform this action.');
  }
  action();
}
