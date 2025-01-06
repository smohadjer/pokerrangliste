import { renderPage } from './renderPage.js';
import { State, Route, RenderPageOptions} from './types.js';
import { store } from '../lib/store';
import fetchData from '../lib/fetchData.js';
import { router } from '../lib/router.js';

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
                headers: {
                    // 'Accept': 'application/json',
                    // 'Content-Type': 'application/json'
                },
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
                    console.log('Removing events and tenant from state and local storage');
                    localStorage.removeItem('tenant');
                    store.setState({
                        tenant: {
                            id: undefined,
                            name: undefined
                        },
                        events: []
                    });
                }

                if (res.data) {
                    // after successful login tenant is returned
                    if (res.data.tenant) {
                        localStorage.setItem('tenant', JSON.stringify(res.data.tenant));

                        // fetch app data from server and storing it in state
                        // const data: State | undefined = await fetchData(res.data.tenant.id);
                        // store.setState(data);
                    }

                    // Update the state with data returned from api
                    store.setState(res.data);
                }

                if (submitButton) {
                    submitButton.classList.remove('loading');
                }

                if (redirect) {
                    const options: RenderPageOptions = {
                        type: 'click'
                    };
                    router(redirect, window.location.search, options);
                } else {
                    // update current page
                    const options: RenderPageOptions = {
                        type: 'reload'
                    };
                    router(window.location.pathname, window.location.search, options);
                }
            }).catch(error => {
                console.log(error);
            })
        }
    });
}
