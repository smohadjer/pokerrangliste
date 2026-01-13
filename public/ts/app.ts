import { router } from './lib/router.js';
import { RenderPageOptions, Route, Event } from './types.js';
import { store } from './lib/store.js';
import { fetchEvents, isAuthenticated } from './lib/utils.js';
import { setHandlebars } from './lib/handlebars.js';
import { render } from './lib/render.js';

(async () => {
    console.log('initilizing app');
    const results: HTMLElement = document.querySelector('#results')!;

    // registering helpers and partials needed for using Handlebars templating engine
    await setHandlebars();

    addSPAEventListeners(results);

    const state = store.getState();
    const authenticated = await isAuthenticated();

    if (authenticated.error) {
        // user is not logged-in, fetching all events
        console.log('user is NOT logged-in');
        const events: Event[] = await fetchEvents();
        store.setState({...state, events});
    } else {
        // user is logged-in, fetching only his events
        const events: Event[] = await fetchEvents(authenticated.id);
        store.setState({
            ...state,
            events,
            tenant: authenticated
        });
    }

    await router(window.location.pathname, window.location.search, { type: 'reload'});

    console.log('done');
})();


function addSPAEventListeners(results: HTMLElement) {
    document.addEventListener('click', (event) => {
        clickHandler(event, results);
    });

    document.addEventListener('submit', (event) => {
        submitHandler(event);
    });

    window.addEventListener("popstate", async (event) => {
        const route: Route = event.state;
        await render(route, { type: 'click' });
        if (event.state.scroll) {
            results?.querySelector('.wrapper')!.scrollTo(0, event.state.scroll);
        }
    });

    results.addEventListener('animationend', (event) => {
        const container = event.target as HTMLElement;
        container.classList.remove('slideInRTL');
        container.classList.remove('slideInLTR');
        container.classList.remove('fadeIn');
    });
}

const clickHandler = async (event: MouseEvent, results: HTMLElement) => {
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

export function submitHandler(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target;
    if (form && form instanceof HTMLFormElement) {
        const submitButton = form.querySelector('.submit');

        if (submitButton) {
            submitButton.classList.add('loading');
        }
        const redirect = form.dataset.redirect;
        const formData = new FormData(form);
        // casting formData as any to avoid typescript error
        // https://github.com/microsoft/TypeScript/issues/30584
        const data = new URLSearchParams(formData as any);

        //const body = (form.method === 'DELETE') ? JSON.stringify({}) : JSON.stringify(object);
        //const url =  (form.method === 'DELETE') ? `${form.action}/${object.player_id}` : form.action;

        fetch(form.action, {
            method: form.method,
            body: data
        })
        .then(response => response.json())
        .then(async (res) => {
            if (res.error) {
                form.classList.add('error');
                const errorElm = form.querySelector('.error');
                if (errorElm) {
                    errorElm.innerHTML = res.error;
                }
                if (submitButton) {
                    submitButton.classList.remove('loading');
                }
                return;
            }

            form.classList.remove('error');
            const state = store.getState();

            // on logout remove tenant data from state and event_id from
            // localStorage and update events
            if (form.action.indexOf('logout') > -1) {
                window.localStorage.removeItem('event_id');
                const events = await fetchEvents();
                store.setState({
                    ...state,
                    events,
                    tenant: {
                        id: undefined,
                        name: undefined
                    }
                });
            }

            if (res.data) {
                // after successful login tenant is returned
                if (res.data.tenant) {
                    // update events in state after login
                    const events = await fetchEvents(res.data.tenant.id);
                    store.setState({
                        ...state,
                        events,
                        tenant: res.data.tenant
                    });
                } else {
                    // Update the state with data returned from api and reset rankings
                    // so rankings are calculated and cached again
                    console.log(res.data);
                    store.setState({
                        ...state,
                        ...res.data,
                        rankings: {}
                    });
                }
            }

            if (submitButton) {
                submitButton.classList.remove('loading');
            }

            const urlParams = new URLSearchParams(window.location.search);

            // when duplicating a tournament, api also returns the id of new tournament
            // so when we redirect user to edit tournament page the new tournament
            // can already be selected for editing
            if (redirect) {
                if (res.tournament_id) {
                    urlParams.set('tournament_id', res.tournament_id);
                }
                router(redirect, urlParams.toString(), {type: 'click'});
            } else {
                // update current page
                router(window.location.pathname, urlParams.toString(), {
                    type: 'reload'
                });
            }
        }).catch(error => {
            console.log(error);
        })
    }
}

