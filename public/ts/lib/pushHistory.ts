import { store } from './store.js';

export const pushHistory = () => {
  // update URL in browser address bar
  const urlParams = new URLSearchParams(window.location.search);
  const state = store.getState();

  if (state.season_id) {
    urlParams.set('season_id', (state.season_id));
  } else {
    urlParams.delete('season_id');
  }

  let url = state.view;
  if (urlParams.toString().length > 0) {
    url += '?' + urlParams.toString();
  }

  window.history.pushState(state, '', url);

}
