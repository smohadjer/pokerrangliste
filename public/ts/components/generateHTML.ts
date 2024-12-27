import { getHandlebarsTemplate } from '../lib/setHandlebars.js';

export async function generateHTML(templateFile: string, data: any) {
    const template = await getHandlebarsTemplate(templateFile);
    const htmlString = template(data);
    const html = new DOMParser().parseFromString(htmlString,
        'text/html').body.children;
    return html;
}
