/* since importing from node_modules using a relative path throws error on Render.com
I have copy/pasted dist/handlebars.min.js to ts/lib/ext and renamed it from .js to .cjs
to avoid errors during build */
import Handlebars from './ext/handlebars.min.cjs';

export const getHandlebarsTemplate = async (templateFile: string) => {
    const response = await fetch(templateFile);
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    return template;
};

export const setHandlebars = async () => {
    // setting Handlebars helpers to help with compiling templates
    Handlebars.registerHelper("inc", function(value: string, options) {
        return parseInt(value) + 1;
    });

    Handlebars.registerHelper("reverseIndex", function(v1: number, v2:string, options) {
        return v1 - parseInt(v2);
    });

    Handlebars.registerHelper('ifEquals', function(arg1: string, arg2: string, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('_toInt', function(str) {
        return parseInt(str, 10);
    });

    Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });

    // registering Handlebars partials
    registerPartial('seasonSelector');
    registerPartial('footer');
    registerPartial('adminNav');
    registerPartial('adminHeader');
    registerPartial('tournamentForm');
    registerPartial('logout');
};

async function registerPartial(name: string) {
    const res = await fetch(`/views/partials/${name}.hbs`);
    const text = await res.text();
    const template = Handlebars.compile(text);
    Handlebars.registerPartial(name, template);
}
