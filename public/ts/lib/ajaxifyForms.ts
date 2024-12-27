import { renderPage } from './renderPage.js';
import { State, Route } from './types.js';
import { store } from '../lib/store';
import fetchData from '../lib/fetchData.js';

export function ajaxifyForms(form: HTMLFormElement) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        if (form && form instanceof HTMLFormElement) {
            form.querySelector('.submit')!.classList.add('loading');
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
                console.log(res);

                if (res.error) {
                    console.error(res.error);
                    form.classList.add('error');
                    const errorElm = form.querySelector('.error');
                    if (errorElm) {
                        errorElm.innerHTML = res.error;
                    }
                    form.querySelector('.submit')!.classList.remove('loading');
                    return;
                } else {
                    form.classList.remove('error');
                }

                if (res.data) {
                    // after successful login tenant is returned
                    if (res.data.tenant) {
                        // fetch app data from server and storing it in state
                        const data: State | undefined = await fetchData(res.data.tenant.id);
                        store.setState(data);
                    }

                    // Update the state with data returned from api
                    store.setState(res.data);
                    console.log('Updated state after call to api:', store.getState());
                }

                form.querySelector('.submit')!.classList.remove('loading');

                if (redirect) {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (res.data && res.data.tenant.id) {
                        urlParams.set('tenant_id', (res.data.tenant.id));
                    }
                    console.log({urlParams})

                    const route: Route = {
                        view: redirect,
                        params: urlParams.toString()
                    };
                    await renderPage(route);

                    let url = redirect;
                    if (route.params.length > 0) {
                      url += '?' + urlParams.toString();
                    }

                    console.log({url})
                    window.history.pushState(route, '', url);
                }
            }).catch(error => {
                console.log(error);
            })
        }
    });
}
