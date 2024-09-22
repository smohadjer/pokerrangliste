import { RenderOptions } from './types';
import { renderChart } from './drawChart';
import { controller } from '../controllers/controller';
import Handlebars from './ext/handlebars.min.cjs';
import { store } from './store';

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
    }

    if (args.view === 'profile') {
        renderChart(args.templateData);
    }
};

export const renderPage = async (options?: RenderOptions) => {
    const view = store.getState().view;
    const fetchData = controller.hasOwnProperty(view) ? controller[view] : null;
    const pageData = (typeof fetchData === 'function') ? fetchData() : null;

    if (!pageData) {
        console.error(`No data found for view ${view}!`);
        return;
    }

    await render({
        view,
        templateData: pageData,
        options: options,
    });
};
