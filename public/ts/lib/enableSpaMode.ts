import { renderPage } from './renderPage.js';
import { RenderPageOptions, Route } from './types.js';
// import { isAuthenticated } from '../utils.js';
// import { State } from './types';
// import { store } from './store.js';
import { router } from './router.js';

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
    const options: RenderPageOptions = {
        type: 'click'
    };
    const animationClass = link.getAttribute('data-animation');
    if (animationClass) {
        options.animation = animationClass;
    }

    // const requiresAuth = link.href.indexOf('admin') > -1;
    // const state: State = store.getState();

    // // authenticate with server
    // if (requiresAuth && !state.authenticated) {
    //     const authenticated = await isAuthenticated();
    //     store.setState({ authenticated });
    // }

    // if (requiresAuth && !store.getState().authenticated) {
    //     const route: Route = {view: '/login', params: ''};
    //     await renderPage(route);
    //     window.history.replaceState(route, '', route.view);
    // } else {
    //     const route: Route = {
    //         view: link.pathname,
    //         params: link.search
    //     };
    //     window.scrollTo(0, 0);
    //     await renderPage(route, options);
    //     window.history.pushState(route, '', link.href);
    // }

    router(link.pathname, link.search, options);
};

export default function enableSpaMode() {
    document.addEventListener('click', (event) => {
        clickHandler(event);
    });


    window.addEventListener("popstate", async (event) => {
        console.log(event.state);
        const options: RenderPageOptions = {
            type: 'click'
        };
        await renderPage(event.state, options);
        if (event.state.scroll) {
            results?.querySelector('.wrapper')!.scrollTo(0, event.state.scroll);
        }
    });
}
