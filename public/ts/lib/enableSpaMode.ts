import { renderPage } from './utils.js';
import { State } from './types.js';

const clickHandler = async (e, state) => {
    const link = e.target as HTMLAnchorElement;
    if (link.nodeName !== 'A') {
        return;
    }

    e.preventDefault();

    // replace existing history state with one that has scrolling position
    const scrollPosition = document.documentElement.scrollTop;
    const tempState = {...history.state, scroll: scrollPosition};
    history.replaceState(tempState, '', window.location.search);

    // const href = link.getAttribute('href')!;
    const options: { animation?: string} = {};
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
            state[key] = value;
        }
    }

    if (!params.get('view')) {
        state.view = state.defaultView;
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
    const $main = document.querySelector('body > main');
    const $header = document.querySelector('body > header');

    [$main, $header].forEach(item => item!.addEventListener('click', (e) => {
        clickHandler(e, state);
    }));

    window.addEventListener("popstate", async (event) => {
        await renderPage(event.state);
        if (event.state.scroll) {
            window.scrollTo(0, event.state.scroll);
        }
    });
}
