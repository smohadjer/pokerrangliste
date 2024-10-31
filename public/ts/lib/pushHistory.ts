import { Route } from './types.js';

export const pushHistory = (route: Route) => {
  const urlParams = new URLSearchParams(window.location.search);

  if (route.params.season_id) {
    urlParams.set('season_id', (route.params.season_id));
  } else {
    urlParams.delete('season_id');
  }

  let url = route.view;
  if (urlParams.toString().length > 0) {
    url += '?' + urlParams.toString();
  }

  window.history.pushState(route, '', url);
}
