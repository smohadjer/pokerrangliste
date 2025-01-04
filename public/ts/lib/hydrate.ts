
import { renderChart } from './drawChart.js';
import { initAddTournament } from '../add-tournament.js';
import { initEditTournament } from '../edit-tournament.js';
import { onChangeEventHandler } from './nav.js';
import { ajaxifyForms } from './ajaxifyForms.js';
import { populateSelect, enablePasswordToggle } from '../utils.js';
import { State } from './types';
import { router } from './router.js';

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

export async function hydrate(
    view: string,
    container: HTMLElement,
    templateData: any,
    state: State) {
    if (view === '/profile') {
        renderChart(templateData);
    }
    if (view === '/admin/add-tournament') {
        initAddTournament(container);
    }
    if (view === '/admin/edit-tournament') {
        initEditTournament(container);
    }
    if (view === '/admin/edit-player') {
        const select: HTMLSelectElement = container.querySelector('#player_edit_dropdown')!;
        populateSelect(select, state.players);
    }
    if (view === '/admin/edit-season') {
        const select: HTMLSelectElement = container.querySelector('#season_edit_dropdown')!;
        populateSelect(select, state.seasons);
    }

    if (view === '/tenant') {
        const select: HTMLSelectElement = container.querySelector('#tenant_dropdown')!;
        const tenants = await fetchTenants();
        console.log(tenants)
        populateSelect(select, tenants);
        select.closest('form')?.classList.remove('loading');
        select.addEventListener('change', (event) => {
            select.closest('form')?.classList.add('loading');
            if (event.target instanceof HTMLSelectElement) {
                router('/ranking', `?tenant_id=${select.value}`, {type: 'click'});
            }
        });
    }

    if (view === '/login' || view === '/register') {
        enablePasswordToggle(container);
    }

    // init season select in header
    const seasonSelector =  document.querySelector('header #season-selector');
    if (seasonSelector) {
        seasonSelector.addEventListener('change', (event) => {
            if (event.target instanceof HTMLSelectElement) {
                onChangeEventHandler(event.target);
            }
        });
    }

    // set all forms to use fetch
    document.querySelectorAll('.form-ajax').forEach((form) => {
        if (form instanceof HTMLFormElement) {
            ajaxifyForms(form);
        }
    })

    document.getElementById('results')?.addEventListener('animationend', (event) => {
        console.log('animaiton end');
        const container = event.target as HTMLElement;
        container.classList.remove('slideInRTL');
        container.classList.remove('slideInLTR');
        container.classList.remove('fadeIn');
    })
}
