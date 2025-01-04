import { router } from '../lib/router.js';
import { store } from '../lib/store.js';
import { populateSelect } from '../lib/utils.js';

const fetchTenants = async () => {
    try {
        const response = await fetch(`/api/tenants`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
        });
        const json = await response.json();
        if (!json) throw ('Failed to fetch tenants from server!');
        if (json.error) {
            throw(json.message);
        } else {
            return json;
        }
    } catch (e) {
        console.error(` Error: ${e}`);
    }
};

export const hydrateTenant = async (container: HTMLElement) => {
    const select: HTMLSelectElement = container.querySelector('#tenant_dropdown')!;
    const tenants = await fetchTenants();
    populateSelect(select, tenants);
    select.closest('form')?.classList.remove('loading');
    select.addEventListener('change', (event) => {
        store.setState({ dataIsStale: true });
        select.closest('form')?.classList.add('loading');
        if (event.target instanceof HTMLSelectElement) {
            router('/ranking', `?tenant_id=${select.value}`, {type: 'click'});
        }
    });
}
