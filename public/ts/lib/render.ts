import { RenderPageOptions, Route, State } from '../types.js';
import { controller } from '../controllers/controller.js';
import { store } from './store.js';
import { renderChart } from '../hydration/drawChart.js';
import { initAddTournament } from '../hydration/add-tournament.js';
import { initEditTournament } from '../hydration/edit-tournament.js';
import { initDeleteAndDuplicateTournament } from '../hydration/delete-duplicate-tournament.js';
import { initSeasonSelector } from '../hydration/seasonSelector.js';
import { populateSelect, enablePasswordToggle } from './utils.js';
import { getHandlebarsTemplate } from './handlebars';
import { hydrateLeagues } from '../hydration/leagues.js';

export const render = async (route: Route, options: RenderPageOptions) => {
    const view = route.view;
    const urlParams = new URLSearchParams(route.params);
    const dataProvider: Function | undefined = controller[view];
    const templateData = (typeof dataProvider === 'function')
        ? dataProvider(urlParams) : {};
    const state: State = store.getState();
    const season_id = urlParams.get('season_id');
    const isLoggedIn = state.tenant.id ? true : false;
    const league = state.leagues.find(item => item._id === templateData?.league_id);
    const templateFile = `/views${view}.hbs`;
    const container = document.getElementById('results');
    const template = await getHandlebarsTemplate(templateFile);
    if (typeof template === 'function') {
        const html = template({
            ...templateData,
            season_id,
            isLoggedIn,
            league_name: league?.name
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
        const league = state.leagues.find(item => item._id === templateData.league_id);
        initAddTournament(container, league?.default_season_id);
    }

    if (view === '/admin/edit-tournament') {
        initEditTournament(container, templateData.tournament_id);
    }

    if (view === '/admin/duplicate-tournament'
        || view === '/admin/delete-tournament') {
        initDeleteAndDuplicateTournament(container);
    }

    if (view === '/admin/add-edit-player') {
        const select: HTMLSelectElement = container.querySelector('#player_edit_dropdown')!;
        populateSelect(select, state.players);
    }

    if (view === '/admin/add-edit-season') {
        const select: HTMLSelectElement = container.querySelector('#season_edit_dropdown')!;
        populateSelect(select, state.seasons);
    }

    if (view === '/admin/edit-league') {
        const select: HTMLSelectElement = container.querySelector('#default_season_dropdown')!;
        const league = state.leagues.find(item => item._id === templateData.league_id);
        populateSelect(select, state.seasons, league?.default_season_id);
    }

    if (view === '/home') {
        hydrateLeagues(container, templateData?.league_id);
    }

    if (view === '/login' || view === '/register') {
        enablePasswordToggle(container);
    }

    const seasonSelector: HTMLSelectElement | null =  document.querySelector('header #season-selector');
    if (seasonSelector) {
        initSeasonSelector(seasonSelector);
    }
}

