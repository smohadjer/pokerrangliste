import { store } from './store';
import { router } from './router.js';
import { fetchEvents } from './utils.js';

export function ajaxifyForms(form: HTMLFormElement) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        if (form && form instanceof HTMLFormElement) {
            const submitButton = form.querySelector('.submit');

            if (submitButton) {
                submitButton.classList.add('loading');
            }
            const redirect = form.dataset.redirect;
            const formData = new FormData(form);

            // let object: { [key: string]: FormDataEntryValue; } = {};
            // for (const pair of formData.entries()) {
            //     object[pair[0]] = pair[1];
            //     console.log(pair[0], pair[1]);
            // }

            // const data = new URLSearchParams();
            // for (const pair of formData) {
            //     data.append(pair[0], pair[1]);
            // }

            const data = new URLSearchParams(formData);

            //const body = (form.method === 'DELETE') ? JSON.stringify({}) : JSON.stringify(object);

            //const url =  (form.method === 'DELETE') ? `${form.action}/${object.player_id}` : form.action;
            const url = form.action;

            fetch(url, {
                method: form.method,
                body: data
            })
            .then(response => response.json())
            .then(async (res) => {
                if (res.error) {
                    console.error(res.error);
                    form.classList.add('error');
                    const errorElm = form.querySelector('.error');
                    if (errorElm) {
                        errorElm.innerHTML = res.error;
                    }
                    if (submitButton) {
                        submitButton.classList.remove('loading');
                    }
                    return;
                } else {
                    form.classList.remove('error');
                }

                // on logout clear state and local storage from tenant
                if (url.indexOf('logout') > -1) {
                    console.log('Removing events and tenant from state');
                    store.setState({
                        tenant: {
                            id: undefined,
                            name: undefined
                        },
                        events: []
                    });

                    // update events in state
                    await fetchEvents();
                }

                if (res.data) {
                    // after successful login tenant is returned
                    if (res.data.tenant) {
                        // update events in state after login
                        await fetchEvents(res.data.tenant.id);
                    }

                    // Update the state with data returned from api
                    store.setState(res.data);
                }

                if (submitButton) {
                    submitButton.classList.remove('loading');
                }

                if (redirect) {
                    router(redirect, window.location.search, {
                        type: 'click'
                    });
                } else {
                    // update current page
                    router(window.location.pathname, window.location.search, {
                        type: 'reload'
                    });
                }
            }).catch(error => {
                console.log(error);
            })
        }
    });
}
