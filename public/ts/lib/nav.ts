import { renderPage } from './renderPage.js';
import { Route } from './types.js';
import { getRouteParams } from './utils.js';

export const onChangeEventHandler = async (target: HTMLSelectElement) => {
  const route: Route = {
    view: window.location.pathname,
    params: getRouteParams(window.location.search)
  };

  route.params.season_id = target.value;
  await renderPage(route);
  pushHistory(route);
};

const pushHistory = (route: Route) => {
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

