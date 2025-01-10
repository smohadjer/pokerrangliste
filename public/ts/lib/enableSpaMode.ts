import { render } from './render.js';
import { RenderPageOptions, Route } from './types.js';
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

    router(link.pathname, link.search, options);
};

export default function enableSpaMode() {
    document.addEventListener('click', (event) => {
        clickHandler(event);
    });


    window.addEventListener("popstate", async (event) => {
        const options: RenderPageOptions = {
            type: 'click'
        };
        const route: Route = event.state;
        await render(route, options);
        if (event.state.scroll) {
            results?.querySelector('.wrapper')!.scrollTo(0, event.state.scroll);
        }
    });
}
