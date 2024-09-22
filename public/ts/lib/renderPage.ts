import {
    State,
    RenderOptions,
    CharData,
} from './types';
import drawChart from './drawChart';
import { controller } from '../controllers/controller';
import Handlebars from './ext/handlebars.min.cjs';

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

    // add chart on profile page
    if (args.view === 'profile') {
        const chartData: CharData[] = args.templateData.results.reverse();
        chartData.forEach((item, index) => {
            if (index === 0) {
                item.sum = item.points;
            } else {
                item.sum = chartData[index-1].sum + item.points;
            }
        })
        drawChart(document.getElementById('chart'), chartData);
    }
};

export const renderPage = async (state: State, options?: RenderOptions) => {
    const view = state.view;
    const fetchData = controller.hasOwnProperty(view) ? controller[view] : null;
    const pageData = (typeof fetchData === 'function') ? fetchData(state) : null;

    if (!pageData) {
        console.error(`No data found for view ${view}!`);
        return;
    }

    render({
        view,
        templateData: pageData,
        options: options,
    });
};
