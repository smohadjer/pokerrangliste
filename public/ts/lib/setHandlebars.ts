import Handlebars from './ext/handlebars.min.cjs';

export const setHandlebars = async () => {
    // setting Handlebars helpers to help with compiling templates
    Handlebars.registerHelper("inc", function(value: string, options) {
        return parseInt(value) + 1;
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

    // seting Handlebars partials
    const response = await fetch('/views/seasons.hbs');
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    Handlebars.registerPartial('seasonSelector', template);

    const responseFooter = await fetch('/views/footer.hbs');
    const responseFooterText = await responseFooter.text();
    const templateFooter = Handlebars.compile(responseFooterText);
    Handlebars.registerPartial('footer', templateFooter);

    const adminNav = await fetch('/views/admin/nav.hbs');
    const adminNavText = await adminNav.text();
    const templateAdminNav = Handlebars.compile(adminNavText);
    Handlebars.registerPartial('adminNav', templateAdminNav);
};
