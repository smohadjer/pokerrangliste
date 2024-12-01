import { RenderOptions, Route } from './types';
import { renderChart } from './drawChart';
import { initAdmin } from '../admin/admin.js';
import { initPlayer } from '../admin/playerSelector';
import { initSeasonSelector } from '../admin/seasonSelector.js';

import { initLogin } from './login.js';
import { controller } from '../controllers/controller';
import Handlebars from './ext/handlebars.min.cjs';
import { onChangeEventHandler } from './nav.js';
import { ajaxifyForms } from './ajaxifyForms';

type Args = {
    view: string;
    templateData: any;
    options: any;
}

const getHTML = async (templateFile: string, templateData) => {
    const response = await fetch(templateFile);
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    const html = template(templateData);
    return html;
};

const render = async (args: Args) => {
    const templateFile = `/views${args.view}.hbs`;
    const container = document.getElementById('results');
    const html = await getHTML(templateFile, args.templateData);

    if (container) {
        container.innerHTML = html;
        container.classList.remove('empty');
        if (args.options) {
            container.classList.add(args.options.animation);
        }

        if (args.view === '/profile') {
            renderChart(args.templateData);
        }

        if (args.view === '/admin/add-tournament') {
            initAdmin(container);
        }

        if (args.view === '/admin/edit-player') {
            initPlayer(container);
        }

        if (args.view === '/admin/edit-season') {
            // populate season dropdown
            const seasonDropdown: HTMLSelectElement = container.querySelector('#season_edit_dropdown')!;
            initSeasonSelector(seasonDropdown);
        }

        if (args.view === '/login') {
            initLogin(container);
        }

        const seasonSelector =  document.querySelector('#season-selector');
        if (seasonSelector) {
            seasonSelector.addEventListener('change', (event) => {
                if (event.target instanceof HTMLSelectElement) {
                    onChangeEventHandler(event.target);
                }
            });
        }

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

export const renderPage = async (route: Route, options: RenderOptions = {}) => {
    const view = route.view;
    const fetchTemplateData = controller.hasOwnProperty(view) ? controller[view] : null;
    const pageData = (typeof fetchTemplateData === 'function') ? fetchTemplateData(route.params) : null;

    if (!pageData) {
        console.warn(`No data found for view ${view}!`);
    }

    console.log('view: ', view);

    await render({
        view,
        templateData: pageData,
        options: options,
    });
};
