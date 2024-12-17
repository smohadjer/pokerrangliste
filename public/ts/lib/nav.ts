import { renderPage } from './renderPage.js';
import { Route } from './types.js';

export const onChangeEventHandler = async (target: HTMLSelectElement) => {
  const urlParams = new URLSearchParams(window.location.search);

  if (target.value) {
    urlParams.set('season_id', target.value);
  } else {
    urlParams.delete('season_id');
  }

  const route: Route = {
    view: window.location.pathname,
    params: urlParams.toString()
  };

  await renderPage(route);

  let url = route.view;
  if (route.params.length > 0) {
    url += '?' + route.params;
  }
  window.history.pushState(route, '', url);
};
