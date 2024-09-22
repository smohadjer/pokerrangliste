import { renderPage } from './renderPage.js';
import { RenderOptions } from './types.js';
import { store } from './store.js';

type Payload = {
    [key: string]: string;
};

const results = document.querySelector('#results');

const clickHandler = async (event: MouseEvent) => {
    const link = event.target as HTMLAnchorElement;
    if (link.nodeName !== 'A' || link.classList.contains('no-ajax')) {
        return;
    }

    event.preventDefault();

    // replace existing history state with one that has scrolling position
    const scrollPosition = results?.querySelector('.wrapper')!.scrollTop;
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

    const payload: Payload = {}
    const state = store.getState();

    if (size > 0) {
        for (const [key, value] of params) {
            if (state.hasOwnProperty(key)) {
                payload[key] = value;
            }
        }
        store.setState({ payload });
    }

    let url = '/';
    if (params.toString().length > 0) {
        url = '/?' +  params.toString();
    }

    window.scrollTo(0, 0);
    await renderPage(options);
    window.history.pushState(store.getState(), '', url);
};

export default function enableSpaMode() {
    document.addEventListener('click', (event) => {
        clickHandler(event);
    });


    window.addEventListener("popstate", async (event) => {
        store.setState({
            payload: event.state
        });
        await renderPage();
        if (event.state.scroll) {
            results?.querySelector('.wrapper')!.scrollTo(0, event.state.scroll);
        }
    });
}
