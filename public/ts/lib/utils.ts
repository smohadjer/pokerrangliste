import {
    Tournament,
    PlayerDB, Player,
    Season,
    State
} from './types';
import { controller } from '../controllers/controller';
import drawChart from './drawChart';

/* since importing from node_modules using a relative path throws error on Render.com
I have copy/pasted dist/handlebars.min.js to ts/lib/ext and renamed it from .js to .cjs
to avoid errors during build */
import Handlebars from './ext/handlebars.min.cjs';

export const setHandlebars = async() => {
    // setting Handlebars helpers to help with compiling templates
    Handlebars.registerHelper("inc", function(value, options) {
        return parseInt(value) + 1;
    });
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    const response = await fetch('/views/seasons.hbs');
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    Handlebars.registerPartial('seasonSelector', template);
};

const getHTML = async (templateFile, templateData) => {
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

const sortByDate = (tournaments) => {
    tournaments.sort((item1, item2) => {
      const date1 = new Date(item1.date).valueOf();
      const date2 = new Date(item2.date).valueOf();
      return date2 - date1;
    });
    return tournaments;
};

interface Args {
    templateFile: string;
    templateData: any;
    container: HTMLElement;
    options: any;
}

const render = async (args: Args) => {
    const html = await getHTML(args.templateFile, args.templateData);
    args.container.innerHTML = html;
    args.container.classList.remove('empty');

    if (args.options) {
        args.container.classList.add(args.options.animation);
    }
};

export const getRebuys = (tournament) => {
    let rebuys = 0;
    tournament.players.forEach((player) => {
        rebuys += player.rebuys;
    });
    return rebuys;
};

export const getPoints = (player, tournament: Tournament) => {
    const rebuys = player.rebuys * tournament.buyin;
    const prize = getPrize(player, tournament);
    const bounty = getBounty(player, tournament);
    const points = prize + bounty - tournament.buyin - rebuys;
    return points;
};

export const getPrize = (player, tournament) => {
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

export const getPlayers = (tournaments: Tournament[], playersList) => {
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
                foundPlayer.games += clone.games;
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

export const getTournaments = (tournaments, season_id) => {
    let clone: Tournament[] = deepClone(tournaments);
    if (season_id !== 'all-time') {
        clone = clone.filter((tour) => {
            return tour.season_id === season_id;
        });
    }
    clone = sortByDate(clone);
    return clone;
};

export const renderPage = async (state: State, options?) => {
    const view = state.view ? state.view : state.defaultView;
    const pageData = controller[view](state);
    // const headerOptions: Args = {
    //     templateFile: 'views/header.hbs',
    //     templateData: {
    //         season_id: state.season_id,
    //         seasons: state.data!.seasons,
    //         view: view
    //     },
    //     container: document.querySelector('#season-selector')!,
    //     options: options
    // };
    const footerOptions = {
        templateFile: 'views/footer.hbs',
        templateData: {
            season_id: state.season_id,
            view: view
        },
        container: document.querySelector('footer')!,
        options: options
    };
    const mainOptions: Args = {
        templateFile: `views/${view}.hbs`,
        templateData: pageData,
        container: document.getElementById('results')!,
        options: options
    }

    await Promise.all([
        //render(headerOptions),
        render(footerOptions),
        render(mainOptions)
    ]);

    if (view === 'profile') {
        const data = pageData.results.reverse();
        data.forEach((item, index) => {
            if (index === 0) {
                item.sum = item.points;
            } else {
                item.sum = data[index-1].sum + item.points;
            }
        })
        drawChart(document.getElementById('chart'), data);
    }
};

