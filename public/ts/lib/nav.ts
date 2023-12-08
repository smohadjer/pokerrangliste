import { State } from './definitions';
import { renderPage } from './utils.js';

export const onChangeEventHandler = (
    target: HTMLSelectElement,
    state: State
  ) => {
  // update state
  state.season_id = target.value ? target.value : undefined;

  renderPage(state);

  // update URL in browser address bar
  const urlParams = new URLSearchParams(window.location.search);
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
