import { renderPage } from './renderPage.js';
import { State, Route, RouteParams } from './types.js';
import { store } from '../lib/store';

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
                form.querySelector('.submit')!.classList.remove('loading');
                if (res.error) {
                    console.error(res.error);
                    form.classList.add('error');
                    const errorElm = form.querySelector('.error');
                    if (errorElm) {
                        errorElm.innerHTML = res.error;
                    }
                    return;
                } else {
                    form.classList.remove('error');
                }

                // if response returns data, update the state with it
                if (res.data) {
                    store.setState(res.data);
                    // after successful login tenanat_id is returned
                    if (res.data.tenant_id) {
                        store.setState({
                            authenticated: true
                        });
                    }
                    console.log(store.getState())
                }

                if (redirect) {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (res.data && res.data.tenant_id) {
                        urlParams.set('tenant_id', (res.data.tenant_id));
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
            })
        }
    });
}
