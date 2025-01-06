import { RenderOptions, RenderPageOptions, Route, State } from './types.js';
import { controller } from '../controllers/controller.js';
import { getHandlebarsTemplate } from './setHandlebars.js';
import { store } from './store.js';
import { hydrate } from './hydrate.js';

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
    const getEventName = (id: string) => {
        const events = state.events;
        const event = events.find(item => item._id === id);
        return event?.name;
    }

    if (templateData) {
        templateData.isLoggedIn = state.tenant.id ? true : false
        templateData.event_name = getEventName(templateData.event_id);
    }

    const html = template(templateData);

    if (container) {
        container.innerHTML = html;
        container.classList.remove('empty');

        if (renderOptions?.animation) {
            container.classList.add(renderOptions.animation);
        }

        hydrate(options.view, container, options.templateData, state);
    }
};
