import { renderPage } from './renderPage.js';
import { Route } from './types.js';
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
                }

                if (redirect) {
                    const route: Route = {
                        view: redirect,
                        params: {}
                    };
                    await renderPage(route);
                    window.history.pushState(route, '', route.view);
                }
            })
        }
    });
}
