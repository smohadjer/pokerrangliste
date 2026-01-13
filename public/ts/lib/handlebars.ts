/* since importing from node_modules using a relative path throws error on Render.com
I have copy/pasted dist/handlebars.min.js to ts/lib/ext and renamed it from .js to .cjs
to avoid errors during build */
import Handlebars from './ext/handlebars.min.cjs';

export const getHandlebarsTemplate = async (templateFile: string) => {
    try {
        const response = await fetch(templateFile);
        if (response.ok) {
            const responseText = await response.text();
            const template = Handlebars.compile(responseText);
            return template;
        } else {
            if (response.status === 404) throw new Error('404, Not found');
            if (response.status === 500) throw new Error('500, internal server error');
            // For any other server error
            throw new Error(response.status.toString());
        }
    } catch(error) {
        console.error(error);
    }
};

export const setHandlebars = async () => {
    // setting Handlebars helpers to help with compiling templates
    Handlebars.registerHelper("inc", function(value: string) {
        return parseInt(value) + 1;
    });

    Handlebars.registerHelper("reverseIndex", function(v1: number, v2:string) {
        return v1 - parseInt(v2);
    });

    Handlebars.registerHelper('ifEquals', function(arg1: string, arg2: string, options: any) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Handlebars.registerHelper('_toInt', function(value: string) {
    //     return parseInt(value, 10);
    // });

    Handlebars.registerHelper('ifCond', function (
        v1: string | number,
        operator: string,
        v2: string | number,
        options: any) {
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
    registerPartial('backLink');
    registerPartial('tournamentForm');
    registerPartial('logout');
};

async function registerPartial(name: string) {
    const res = await fetch(`/views/partials/${name}.hbs`);
    const text = await res.text();
    const template = Handlebars.compile(text);
    Handlebars.registerPartial(name, template);
}
