import { renderPage } from './renderPage.js';
import { Route, RenderPageOptions } from './types.js';

export async function renderRoute(
    path: string,
    params: string,
    options: RenderPageOptions) {
    const route: Route = {
        view: path,
        params: params
    };

    window.scrollTo(0, 0);

    // calling renderPage to generate HTML for current route
    await renderPage(route, options);

    const url = (route.params.length > 0)
        ? `${route.view}?${route.params}`
        : route.view;

    // When the app loads from server we need to update browser history
    // by adding state to it, so when user returns to entry page via
    // back button, popState handler can access history to render page.
    // Here we use replaceState instead of pushState as we don't want
    // to add a new entry to history stack.
    if (options.type === 'click') {
        window.history.pushState(route, '', url);
    } else {
        window.history.replaceState(route, '', url);
    }
}
