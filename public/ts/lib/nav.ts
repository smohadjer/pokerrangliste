import { renderPage } from './renderPage.js';
import { Route } from './types.js';
import { router } from './router.js';
import { RenderPageOptions } from './types.js';

export const onChangeEventHandler = async (target: HTMLSelectElement) => {
  const urlParams = new URLSearchParams(window.location.search);
  if (target.value) {
    urlParams.set('season_id', target.value);
  } else {
    urlParams.delete('season_id');
  }
  const params = urlParams.toString();

  // const route: Route = {
  //   view: window.location.pathname,
  //   params: urlParams.toString()
  // };

  // await renderPage(route);

  // let url = route.view;
  // if (route.params.length > 0) {
  //   url += '?' + route.params;
  // }

  // console.log(route);
  // window.history.pushState(route, '', url);
  const options: RenderPageOptions = {
    type: 'click'
  };

  router(window.location.pathname, params, options);
};
