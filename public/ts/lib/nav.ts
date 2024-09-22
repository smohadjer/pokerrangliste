import { renderPage } from './renderPage.js';
import { store } from './store.js';

export const onChangeEventHandler = (target: HTMLSelectElement) => {
  store.setState ({
    payload: {
      season_id: target.value ? target.value : undefined
    },
    action: renderPage
  });

  // update URL in browser address bar
  const urlParams = new URLSearchParams(window.location.search);
  const state = store.getState();

  if (state.season_id) {
    urlParams.set('season_id', (state.season_id));
  } else {
    urlParams.delete('season_id');
  }
  let url = '/';
  if (urlParams.toString().length > 0) {
    url = '/?' +  urlParams.toString();
  }
  window.history.pushState(state, '', url);
};
