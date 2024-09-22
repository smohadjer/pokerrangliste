import {
    Tournament,
    PlayerDB, Player,
    Season,
    State,
    RenderOptions,
    Profile,
    CharData,
} from './types';
import { controller } from '../controllers/controller';
import drawChart from './drawChart';

/* since importing from node_modules using a relative path throws error on Render.com
I have copy/pasted dist/handlebars.min.js to ts/lib/ext and renamed it from .js to .cjs
to avoid errors during build */
import Handlebars from './ext/handlebars.min.cjs';

type Args = {
    view: string;
    templateData: any;
    container: HTMLElement;
    options: any;
}

export const setHandlebars = async() => {
    // setting Handlebars helpers to help with compiling templates
    Handlebars.registerHelper("inc", function(value: string, options) {
        return parseInt(value) + 1;
    });
    Handlebars.registerHelper('ifEquals', function(arg1: string, arg2: string, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    const response = await fetch('/views/seasons.hbs');
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    Handlebars.registerPartial('seasonSelector', template);

    const responseFooter = await fetch('/views/footer.hbs');
    const responseFooterText = await responseFooter.text();
    const templateFooter = Handlebars.compile(responseFooterText);
    Handlebars.registerPartial('footer', templateFooter);
};

const getHTML = async (templateFile: string, templateData) => {
    const response = await fetch(templateFile);
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    const html = template(templateData);
    return html;
};

export const getSeasonName = (season_id: string, seasons: Season[]) => {
    if (season_id === 'all-time') {
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

const render = async (args: Args) => {
    const templateFile = `views/${args.view}.hbs`;
    const html = await getHTML(templateFile, args.templateData);
    args.container.innerHTML = html;
    args.container.classList.remove('empty');

    if (args.options) {
        args.container.classList.add(args.options.animation);
    }

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

export const getRebuys = (tournament: Tournament) => {
    let rebuys = 0;
    tournament.players.forEach((player) => {
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
    const prize = (player.ranking <= tournament.prizes.length)
    ? tournament.prizes[player.ranking - 1] : 0;
    return prize;
};

export const getBounty = (player: Player, tournament: Tournament) => {
    if (!tournament.bounties) {
        return 0;
    }
    const bountyWinner = tournament.bounties.find((item) =>
        item.id === player.id);
    return bountyWinner ? bountyWinner.prize : 0;
};

export const getPlayerName = (id: string, players: PlayerDB[]) => {
    const player = players.find(player => player._id === id);
    return player?.name;
}

// Deep cloning arrays and objects with support for older browsers
export const deepClone = (arrayOrObject) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(arrayOrObject);
    } else {
        return JSON.parse(JSON.stringify(arrayOrObject));
    }
 }

export const getPlayers = (tournaments: Tournament[], playersList: PlayerDB[]) => {
    const players: Player[] = [];
    tournaments.forEach((tournament) => {
        tournament.players.forEach((item) => {
            const clone = {...item};
            clone.points = getPoints(clone, tournament);
            clone.bounty = getBounty(clone, tournament);
            clone.prize = getPrize(clone, tournament);
            clone.games = 1;
            clone.name = getPlayerName(clone.id, playersList)

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

export const getTournaments = (tournaments: Tournament[], season_id: string) => {
    let clone: Tournament[] = deepClone(tournaments);
    if (season_id !== 'all-time') {
        clone = clone.filter((tour) => {
            return tour.season_id === season_id;
        });
    }
    clone = sortByDate(clone);
    return clone;
};

export const renderPage = async (state: State, options?: RenderOptions) => {
    const view = state.view;
    const fetchData = controller.hasOwnProperty(view) ? controller[view] : null;
    const pageData = (typeof fetchData === 'function') ? fetchData(state) : null;

    if (!pageData) {
        console.error(`No data found for view ${view}!`);
        return;
    }

    const mainOptions: Args = {
        view,
        templateData: pageData,
        container: document.getElementById('results')!,
        options: options,
    }

    render(mainOptions);
};

