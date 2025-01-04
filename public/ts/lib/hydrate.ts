
import { renderChart } from './drawChart.js';
import { initAddTournament } from '../hydration/add-tournament.js';
import { initEditTournament } from '../hydration/edit-tournament.js';
import { onChangeEventHandler } from './nav.js';
import { ajaxifyForms } from './ajaxifyForms.js';
import { populateSelect, enablePasswordToggle } from './utils.js';
import { State } from './types';
import { hydrateTenant } from '../hydration/tenant.js';

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
        hydrateTenant(container);
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
        const container = event.target as HTMLElement;
        container.classList.remove('slideInRTL');
        container.classList.remove('slideInLTR');
        container.classList.remove('fadeIn');
    })
}
