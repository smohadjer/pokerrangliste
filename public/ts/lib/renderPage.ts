import { RenderPageOptions, Route } from './types.js';
import { renderChart } from './drawChart.js';
import { initAddTournament } from '../admin/add-tournament.js';
import {
    populateSelect
} from '../admin/utils.js';
import { initEditTournament } from '../admin/edit-tournament.js';
import { initLogin } from './login.js';
import { controller } from '../controllers/controller.js';
import { onChangeEventHandler } from './nav.js';
import { ajaxifyForms } from './ajaxifyForms.js';
import { getHandlebarsTemplate } from './setHandlebars.js';
import { State } from '../lib/types';
import { store } from '../lib/store.js';

type RenderOptions = {
    view: string;
    templateData: any;
    options: any;
};

const render = async (options: RenderOptions) => {
    const templateFile = `/views${options.view}.hbs`;
    const container = document.getElementById('results');
    const template = await getHandlebarsTemplate(templateFile);
    const html = template(options.templateData);
    const state: State = store.getState();

    if (container) {
        container.innerHTML = html;
        container.classList.remove('empty');

        if (options.options, container) {
            container.classList.add(options.options.animation);
        }

        runScripts(options.view, container, options.templateData, state);

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
};

export const renderPage = async (route: Route, options: RenderPageOptions = {}) => {
    const view = route.view;
    const fetchTemplateData = controller.hasOwnProperty(view) ? controller[view] : null;
    const pageData = (typeof fetchTemplateData === 'function') ? fetchTemplateData(route.params) : null;

    if (!pageData) {
        console.warn(`No data found for view ${view}!`);
    }

    console.log({view});

    await render({
        view,
        templateData: pageData,
        options: options,
    });
};

function runScripts(
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
    if (view === '/login') {
        initLogin(container);
    }
}
