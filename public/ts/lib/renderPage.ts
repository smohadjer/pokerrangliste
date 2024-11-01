import { RenderOptions, Route } from './types';
import { renderChart } from './drawChart';
import { initAdmin } from './admin.js';
import { controller } from '../controllers/controller';
import Handlebars from './ext/handlebars.min.cjs';
import { onChangeEventHandler } from './nav.js';

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
    const templateFile = `views/${args.view}.hbs`;
    const container = document.getElementById('results');
    const html = await getHTML(templateFile, args.templateData);

    if (container) {
        container.innerHTML = html;
        container.classList.remove('empty');
        if (args.options) {
            container.classList.add(args.options.animation);
        }

        if (args.view === 'profile') {
            renderChart(args.templateData);
        }

        if (args.view === 'admin') {
            initAdmin(container);
        }

        const seasonSelector =  document.querySelector('#season-selector');
        if (seasonSelector) {
            seasonSelector.addEventListener('change', (event) => {
                if (event.target instanceof HTMLSelectElement) {
                    onChangeEventHandler(event.target);
                }
            });
        }

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

    await render({
        view,
        templateData: pageData,
        options: options,
    });
};
