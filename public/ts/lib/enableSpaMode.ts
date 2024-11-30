import { renderPage } from './renderPage.js';
import { RenderOptions, Route } from './types.js';
import { getRouteParams } from './utils.js';
import { isAuthenticated } from './utils.js';

const results = document.querySelector('#results');

const clickHandler = async (event: MouseEvent) => {
    const link = event.target as HTMLAnchorElement;
    if (link.nodeName !== 'A' || link.classList.contains('no-ajax')) {
        return;
    }

    event.preventDefault();

    // Do nothing when link to current page is clicked
    if (link.href === window.location.href) {
        return;
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

    const requiresAuth = link.href.indexOf('admin') > -1;

    if (requiresAuth && !await isAuthenticated()) {
        const route: Route = {view: '/login', params: {}};
        await renderPage(route);
        window.history.replaceState(route, '', route.view);
    } else {
        const route: Route = {
            view: link.pathname,
            params: getRouteParams(link.search)
        };
        window.scrollTo(0, 0);
        await renderPage(route, options);
        window.history.pushState(route, '', link.href);
    }
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
