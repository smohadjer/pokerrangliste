import { renderPage } from './renderPage.js';
import { RenderOptions, Route } from './types.js';
import { store } from './store.js';
import { getRouteParams } from './utils.js';

const results = document.querySelector('#results');

const clickHandler = async (event: MouseEvent) => {
    const link = event.target as HTMLAnchorElement;
    if (link.nodeName !== 'A' || link.classList.contains('no-ajax')) {
        return;
    }

    event.preventDefault();

    const requiresAuth = link.href.indexOf('admin') > -1;

    console.log(link.href, requiresAuth);

    // if link requires authorization and user is not authorized go to login
    if (requiresAuth) {
        const userIsAuthenticatedResponse = await fetch('api/verifyAuth');
        const userIsAuthenticated = await userIsAuthenticatedResponse.json();
        console.log({userIsAuthenticated});
        if (!userIsAuthenticated.valid) {
            const route: Route = {view: 'login', params: {}};
            await renderPage(route);
            window.history.pushState(route, '', '/login');
            return;
        }
    }

    // replace existing history state with one that has scrolling position
    const scrollPosition = results?.querySelector('.wrapper')!.scrollTop;
    const tempState = {...window.history.state, scroll: scrollPosition};
    window.history.replaceState(tempState, '');

    // const href = link.getAttribute('href')!;
    const options: RenderOptions = {};
    const animationClass = link.getAttribute('data-animation');
    if (animationClass) {
        options.animation = animationClass;
    }

    // Do nothing when link to current page is clicked
    if (link.href === window.location.href) {
        return;
    }

    const route: Route = {
        view: link.pathname === '/' ? 'ranking' : link.pathname.substring(1),
        params: getRouteParams(link.search)
    };

    window.scrollTo(0, 0);
    await renderPage(route, options);
    window.history.pushState(route, '', link.href);
};

export default function enableSpaMode() {
    document.addEventListener('click', (event) => {
        clickHandler(event);
    });


    window.addEventListener("popstate", async (event) => {
        await renderPage(event.state);
        if (event.state.scroll) {
            results?.querySelector('.wrapper')!.scrollTo(0, event.state.scroll);
        }
    });
}
