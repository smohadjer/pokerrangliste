import { RenderPageOptions, Route, State } from './types.js';
import { controller } from '../controllers/controller.js';
import { getHandlebarsTemplate } from './setHandlebars.js';
import { store } from './store.js';
import { hydrate } from './hydrate.js';

export const render = async (route: Route, options: RenderPageOptions) => {
    console.log('render', route.view, route.params);
    const view = route.view;
    const urlParams = new URLSearchParams(route.params);
    const dataProvider: Function | undefined = controller[view];
    const templateData = (typeof dataProvider === 'function')
        ? dataProvider(urlParams) : {};
    const state: State = store.getState();
    const isLoggedIn = state.tenant.id ? true : false;
    const event = state.events.find(item => item._id === templateData.event_id);
    const templateFile = `/views${view}.hbs`;
    const container = document.getElementById('results');
    const template = await getHandlebarsTemplate(templateFile);
    const html = template({
        ...templateData,
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
};
