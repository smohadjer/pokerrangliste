import { renderPage } from './utils.js';
import { State, RenderOptions } from './types.js';

const clickHandler = async (event: MouseEvent, state: State) => {
    const link = event.target as HTMLAnchorElement;
    if (link.nodeName !== 'A' || link.classList.contains('no-ajax')) {
        return;
    }

    event.preventDefault();

    // replace existing history state with one that has scrolling position
    const scrollPosition = document.documentElement.scrollTop;
    const tempState = {...history.state, scroll: scrollPosition};
    history.replaceState(tempState, '', window.location.search);

    // const href = link.getAttribute('href')!;
    const options: RenderOptions = {};
    const animationClass = link.getAttribute('data-animation');
    if (animationClass) {
        options.animation = animationClass;
    }

    // Do nothing when link to current page is clicked
    if (link.search === window.location.search) {
        return;
    }

    const params = new URLSearchParams(link.search);

    // for browsers not supporting URLSearchParams's size property
    const size = (params.size)
        ? params.size
        : params.toString().length;

    // update state
    if (size > 0) {
        for (const [key, value] of params) {
            if (state.hasOwnProperty(key)) {
                state[key] = value;
            }
        }
    }

    let url = '/';
    if (params.toString().length > 0) {
        url = '/?' +  params.toString();
    }

    window.scrollTo(0, 0);
    await renderPage(state, options);
    window.history.pushState(state, '', url);
};

export default function enableSpaMode(state: State) {
    document.addEventListener('click', (e) => {
        clickHandler(e, state);
    });

    window.addEventListener("popstate", async (event) => {
        await renderPage(event.state);
        if (event.state.scroll) {
            window.scrollTo(0, event.state.scroll);
        }
    });
}
