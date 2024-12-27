import { RenderOptions, RenderPageOptions, Route } from './types.js';
import { renderChart } from './drawChart.js';
import { initAddTournament } from '../add-tournament.js';
import { initEditTournament } from '../edit-tournament.js';
import { controller } from '../controllers/controller.js';
import { onChangeEventHandler } from './nav.js';
import { ajaxifyForms } from './ajaxifyForms.js';
import { getHandlebarsTemplate } from './setHandlebars.js';
import { State } from '../lib/types';
import { store } from '../lib/store.js';
import { populateSelect, enablePasswordToggle } from '../utils.js';

export const renderPage = async (route: Route, options: RenderPageOptions) => {
    console.log('renderPage', route.view, route.params);
    const view = route.view;
    const urlParams = new URLSearchParams(route.params);
    const fetchTemplateData = controller.hasOwnProperty(view) ? controller[view] : null;
    const pageData = (typeof fetchTemplateData === 'function') ? fetchTemplateData(urlParams) : null;

    if (!pageData) {
        console.warn(`No data found for view ${view}`);
    }

    await render({
        view,
        templateData: pageData,
        renderOptions: options
    });
};

const render = async (options: RenderOptions) => {
    const {view, templateData, renderOptions} = options;
    const templateFile = `/views${view}.hbs`;
    const container = document.getElementById('results');
    const template = await getHandlebarsTemplate(templateFile);
    const state: State = store.getState();

    if (templateData) {
        templateData.isLoggedIn = state.tenant.id ? true : false
    }

    const html = template(templateData);

    if (container) {
        container.innerHTML = html;
        container.classList.remove('empty');

        if (renderOptions?.animation) {
            container.classList.add(renderOptions.animation);
        }

        hydratePage(options.view, container, options.templateData, state);
    }
};

function hydratePage(
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
