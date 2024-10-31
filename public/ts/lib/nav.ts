import { renderPage } from './renderPage.js';
import { pushHistory } from './pushHistory.js';
import { Route } from './types.js';
import { getRouteParams } from './utils.js';

export const onChangeEventHandler = async (target: HTMLSelectElement) => {
  const route: Route = {
    view: window.location.pathname === '/' ? 'ranking' : window.location.pathname.substring(1),
    params: getRouteParams(window.location.search)
  };

  route.params.season_id = target.value;
  await renderPage({}, route);
  pushHistory(route);
};
