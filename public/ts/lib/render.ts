import { RenderPageOptions, Route, State } from '../types.js';
import { controller } from '../controllers/controller.js';
import { store } from './store.js';
import { renderChart } from '../hydration/drawChart.js';
import { initAddTournament } from '../hydration/add-tournament.js';
import { initEditTournament } from '../hydration/edit-tournament.js';
import { initDeleteAndDuplicateTournament } from '../hydration/delete-duplicate-tournament.js';
import { initSeasonSelector } from '../hydration/seasonSelector.js';
import { initAddTimer, initDeleteTimer, initEditTimer } from '../hydration/editTimer.js';
import { populateSelect, enablePasswordToggle } from './utils.js';
import { getHandlebarsTemplate } from './handlebars';
import { hydrateLeaguesDropdown } from '../hydration/leagues.js';
import { initTimer } from '../hydration/timer.js';

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

    if (view === '/admin/edit-timer') {
        initEditTimer(container);
    }

    if (view === '/admin/add-timer') {
        initAddTimer(container);
    }

    if (view === '/admin/delete-timer') {
        initDeleteTimer(container);
    }

    if (view === '/admin/duplicate-tournament'
        || view === '/admin/delete-tournament') {
        initDeleteAndDuplicateTournament(container);
    }

    if (view === '/admin/edit-player') {
        const select: HTMLSelectElement = container.querySelector('#player_edit_dropdown')!;
        populateSelect(select, state.players);
    }

    if (view === '/admin/add-player' || view === '/admin/edit-player') {
        showPlayerPhotoFlash(container);
    }

    if (view === '/admin/edit-season') {
        const select: HTMLSelectElement = container.querySelector('#season_edit_dropdown')!;
        populateSelect(select, state.seasons);
    }

    if (view === '/admin/edit-league') {
        const seasonSelect: HTMLSelectElement = container.querySelector('#default_season_dropdown')!;
        const timerSelect: HTMLSelectElement = container.querySelector('#default_timer_dropdown')!;
        const league = state.leagues.find(item => item._id === templateData.league_id);
        populateSelect(seasonSelect, state.seasons, league?.default_season_id);
        populateSelect(timerSelect, state.timers
            .map(timer => ({
                _id: getObjectId(timer._id),
                name: timer.name ?? 'Timer'
            }))
            .filter(timer => timer._id), league?.default_timer_id);
    }

    if (view === '/home' && templateData.hasLeagues) {
        hydrateLeaguesDropdown(container, templateData?.league_id);
    }

    if (view === '/login' || view === '/register') {
        enablePasswordToggle(container);
    }

    if (view === '/timer') {
        initTimer(container);
    }

    const seasonSelector: HTMLSelectElement | null =  document.querySelector('header #season-selector');
    if (seasonSelector) {
        initSeasonSelector(seasonSelector);
    }
}

function getObjectId(id: unknown) {
    if (!id) {
        return '';
    }

    if (typeof id === 'object' && '$oid' in id) {
        return String(id.$oid);
    }

    return String(id);
}

function showPlayerPhotoFlash(container: HTMLElement) {
    const message = window.sessionStorage.getItem('playerPhotoFlash');
    if (!message) {
        return;
    }

    const form = container.querySelector('form');
    const successElm = form?.querySelector('.success');
    if (form instanceof HTMLFormElement && successElm instanceof HTMLElement) {
        form.classList.remove('error');
        form.classList.add('success');
        successElm.textContent = message;
    }

    window.sessionStorage.removeItem('playerPhotoFlash');
}
