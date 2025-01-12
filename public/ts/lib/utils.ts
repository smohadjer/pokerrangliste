/*** Only pure functions in this file! ***/
import { Tournament, Player, Season, PlayerDB } from '../types';
import { store } from './store';
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

export const getSeasonName = (season_id: string, seasons: Season[]) => {
    if (!season_id) {
        return 'All-Time';
    } else {
        return seasons.find(item => item._id == season_id)?.name;
    }
}

const sortByDate = (tournaments: Tournament[]) => {
    tournaments.sort((item1, item2) => {
      const date1 = new Date(item1.date).valueOf();
      const date2 = new Date(item2.date).valueOf();
      return date2 - date1;
    });
    return tournaments;
};

export const getRebuys = (tournament: Tournament) => {
    let rebuys = 0;
    tournament.players?.forEach((player) => {
        rebuys += player.rebuys;
    });
    return rebuys;
};

export const getPoints = (player: Player, tournament: Tournament) => {
    const rebuys = player.rebuys * tournament.buyin;
    const prize = getPrize(player, tournament);
    const bounty = getBounty(player, tournament);
    const points = prize + bounty - tournament.buyin - rebuys;
    return points;
};

export const getPrize = (player: Player, tournament: Tournament) => {
    // only old tournaments have a prizes property
    if (tournament.prizes && tournament.prizes.length) {
        const prize = (player.ranking <= tournament.prizes.length)
        ? tournament.prizes[player.ranking - 1] : 0;
        return prize;
    } else {
        return player.prize;
    }
};

export const getBounty = (player: Player, tournament: Tournament) => {
    if (!tournament.bounties) {
        return 0;
    }
    const bountyWinner = tournament.bounties.find((item) =>
        item.id === player.id);
    return bountyWinner ? bountyWinner.prize : 0;
};

// Deep cloning arrays and objects with support for older browsers
export const deepClone = (item: {} | []) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(item);
    } else {
        return JSON.parse(JSON.stringify(item));
    }
}

export const getPlayers = (tournaments: Tournament[]) => {
    const players: Player[] = [];
    tournaments.forEach((tournament) => {
        tournament.players.forEach((item) => {
            const clone = {...item};
            clone.points = getPoints(clone, tournament);
            clone.bounty = getBounty(clone, tournament);
            clone.prize = getPrize(clone, tournament);
            clone.games = 1;
            clone.name = getPlayerName(clone.id);

            const foundPlayer = players.find(player => player.id === clone.id);

            if (foundPlayer) {
                foundPlayer.points += clone.points;
                foundPlayer.bounty += clone.bounty;
                foundPlayer.prize += clone.prize;
                foundPlayer.rebuys += clone.rebuys;
                if (foundPlayer.games !== undefined) {
                    foundPlayer.games += clone.games;
                }
            } else {
                players.push(clone);
            }
        });
    });
    players.sort((item1, item2) => {
        return item2.points - item1.points;
    });
    return players;
};

export const getTournaments = (tournaments: Tournament[], season_id: string | undefined) => {
    let clone: Tournament[] = deepClone(tournaments);
    if (season_id) {
        clone = clone.filter((tour) => {
            return tour.season_id === season_id;
        });
    }
    clone = sortByDate(clone);
    return clone;
};

export const isAuthenticated = async () => {
    const response = await fetch('/api/verifyAuth');
    const isAuthenticated = await response.json();
    return isAuthenticated;
}

export const enablePasswordToggle = (container: HTMLElement) => {
    const toggle = container.querySelector('#togglePassword');
    const passwordField = container.querySelector('#password');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            const type = passwordField?.getAttribute('type') === 'text' ? 'password' : 'text';
            if (type === 'text') {
                toggle.classList.remove('icon--show');
                toggle.classList.add('icon--hide');
            } else {
                toggle.classList.remove('icon--hide');
                toggle.classList.add('icon--show');
            }
            passwordField?.setAttribute('type', type);
        });
    }
}

type SelectData = {
    _id: string;
    name: string;
}

// used to populate players, seasons and tenant select elements
export function populateSelect(select: HTMLSelectElement, data: SelectData[]) {
    let options = select.innerHTML;
    data.forEach(item => {
        options += `<option value="${item._id}">${item.name}</option>`
    });
    select.innerHTML = options;
}

export function populateSelectTournaments(select: HTMLSelectElement, data: Tournament[]) {
    let options = '<option selected disabled option="">Select</option>';
    data.forEach(item => {
        options += `<option value="${item._id}">${item.date}</option>`
    });
    select.innerHTML = options;
}

export async function generateHTML(templateFile: string, data: any) {
    const template = await getHandlebarsTemplate(templateFile);
    const htmlString = template(data);
    const html = new DOMParser().parseFromString(htmlString,
        'text/html').body.children;
    return html;
}

export const getPlayerName = (playerId: string) => {
    const state = store.getState();
    const players: PlayerDB[] = state.players;
    const player = players.find(player => player._id === playerId);
    return player?.name;
}

export const fetchEvents = async (tenant_id?: string) => {
    try {
        const url = tenant_id
            ? `/api/events?tenant_id=${tenant_id}`
            : '/api/events';
        const response = await fetch(url);
        const json = await response.json();
        if (!json) throw ('Failed to fetch events from server!');
        if (json.error) {
            throw(json.message);
        } else {
            const state = store.getState();
            store.setState({
                ...state,
                events: json
            });
            return json;
        }
    } catch (e) {
        console.error(` Error: ${e}`);
    }
};
