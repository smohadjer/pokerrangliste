import { RenderPageOptions, Route, State } from '../types.js';
import { controller } from '../controllers/controller.js';
import { store } from './store.js';
import { renderChart } from '../hydration/drawChart.js';
import { initAddTournament } from '../hydration/add-tournament.js';
import { initEditTournament } from '../hydration/edit-tournament.js';
import { initDuplicateTournament } from '../hydration/duplicate-tournament.js';
import { initSeasonSelector } from '../hydration/seasonSelector.js';
import { populateSelect, enablePasswordToggle } from './utils.js';
import { getHandlebarsTemplate } from './handlebars';
import { hydrateEvents } from '../hydration/events.js';

export const render = async (route: Route, options: RenderPageOptions) => {
    const view = route.view;
    const urlParams = new URLSearchParams(route.params);
    const dataProvider: Function | undefined = controller[view];
    const templateData = (typeof dataProvider === 'function')
        ? dataProvider(urlParams) : {};
    const state: State = store.getState();
    // Use the most recent season if none is provided
    const season_id = urlParams.get('season_id') ?? state.seasons[0]?._id;
    const isLoggedIn = state.tenant.id ? true : false;
    const event = state.events.find(item => item._id === templateData?.event_id);
    const templateFile = `/views${view}.hbs`;
    const container = document.getElementById('results');
    const template = await getHandlebarsTemplate(templateFile);
    if (typeof template === 'function') {
        const html = template({
            ...templateData,
            season_id,
            isLoggedIn,
            event_name: event?.name
        });

        if (container) {
            container.innerHTML = html;
            container.classList.remove('empty');
            if (options?.animation) {
                container.classList.add(options.animation);
            }
            hydrate(view, container, templateData, state);
        }
    } else {
        console.error(`${templateFile} not found or parsed properly!`);
    }
};

function hydrate(
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

    if (view === '/admin/duplicate-tournament') {
        initDuplicateTournament(container);
    }

    if (view === '/admin/edit-player') {
        const select: HTMLSelectElement = container.querySelector('#player_edit_dropdown')!;
        populateSelect(select, state.players);
    }

    if (view === '/admin/edit-season') {
        const select: HTMLSelectElement = container.querySelector('#season_edit_dropdown')!;
        populateSelect(select, state.seasons);
    }

    if (view === '/home') {
        hydrateEvents(container);
    }

    if (view === '/login' || view === '/register') {
        enablePasswordToggle(container);
    }

    const seasonSelector: HTMLSelectElement | null =  document.querySelector('header #season-selector');
    if (seasonSelector) {
        initSeasonSelector(seasonSelector);
    }
}

