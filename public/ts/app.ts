import { router } from './lib/router.js';
import { RenderPageOptions, Route, League } from './types.js';
import { store } from './lib/store.js';
import { fetchLeagues, isAuthenticated } from './lib/utils.js';
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
        // user is not logged-in, fetching all leagues
        console.log('user is NOT logged-in');
        const leagues: League[] = await fetchLeagues();
        store.setState({...state, leagues});
    } else {
        // user is logged-in, fetching only his leagues
        const leagues: League[] = await fetchLeagues(authenticated.id);
        store.setState({
            ...state,
            leagues,
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
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    const link = target.closest('a');
    if (!(link instanceof HTMLAnchorElement) || link.classList.contains('no-ajax')) {
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

export async function submitHandler(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target;
    if (form && form instanceof HTMLFormElement) {
        const submitButton = form.querySelector('.submit');

        if (submitButton) {
            submitButton.classList.add('loading');
        }
        const redirect = form.dataset.redirect;
        const formData = new FormData(form);

        try {
            await appendPlayerPhotoToFormData(formData);
        } catch (error) {
            form.classList.add('error');
            const errorElm = form.querySelector('.error');
            if (errorElm) {
                errorElm.innerHTML = error instanceof Error ? error.message : 'Failed to process the selected image';
            }
            if (submitButton) {
                submitButton.classList.remove('loading');
            }
            return;
        }

        const data = new URLSearchParams();
        formData.forEach((value, key) => {
            if (value instanceof File) {
                return;
            }
            data.append(key, value);
        });

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

            // on logout remove tenant data from state and league_id from
            // localStorage and update leagues
            if (form.action.indexOf('logout') > -1) {
                window.localStorage.removeItem('league_id');
                removeTimerLocalStorage();
                const leagues = await fetchLeagues();
                store.setState({
                    ...state,
                    leagues,
                    tenant: {
                        id: undefined,
                        name: undefined
                    }
                });
            }

            if (res.data) {
                // after successful login tenant is returned
                if (res.data.tenant) {
                    // update leagues in state after login
                    const leagues = await fetchLeagues(res.data.tenant.id);
                    store.setState({
                        ...state,
                        leagues,
                        tenant: res.data.tenant
                    });
                } else {
                    storePlayerPhotoFlashMessage(form, res.data.photo_saved_bytes);
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

function storePlayerPhotoFlashMessage(form: HTMLFormElement, photoSavedBytes?: number) {
    if (!photoSavedBytes) {
        return;
    }

    if (window.location.pathname !== '/admin/add-player' && window.location.pathname !== '/admin/edit-player') {
        return;
    }

    const kb = (photoSavedBytes / 1024).toFixed(1);
    window.sessionStorage.setItem('playerPhotoFlash', `Saved image size: ${kb} KB`);
}

async function appendPlayerPhotoToFormData(formData: FormData) {
    const file = formData.get('photo');
    const maxPhotoSizeBytes = 5 * 1024 * 1024;

    if (!(file instanceof File) || file.size === 0) {
        formData.delete('photo');
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Please select a JPG, JPEG, PNG, or GIF image');
    }

    if (file.size > maxPhotoSizeBytes) {
        throw new Error('Please select an image smaller than 5 MB');
    }

    const pngDataUrl = await fileToPngDataUrl(file);
    formData.delete('photo');
    formData.set('photo_data_url', pngDataUrl);
}

async function fileToPngDataUrl(file: File): Promise<string> {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Your browser could not process the selected image');
    }

    context.drawImage(image, 0, 0);
    return canvas.toDataURL('image/png');
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read the selected image'));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load the selected image'));
        image.src = src;
    });
}

function removeTimerLocalStorage() {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const key = window.localStorage.key(i);

        // Remove the current timerState key plus legacy timer keys from earlier storage formats.
        if (key && (key === 'timerState' || key === 'selectedTimer' || key.startsWith('selectedTimer:') || key.startsWith('timerState:'))) {
            window.localStorage.removeItem(key);
        }
    }
}
