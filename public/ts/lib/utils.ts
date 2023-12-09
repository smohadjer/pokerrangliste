import {
    Tournament,
    PlayerDB, Player,
    Season,
    State
} from './definitions';
import { controller } from '../controllers/controller';
declare const Handlebars: any;

// setting Handlebars helpers to help with compiling templates
Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

export const getHTML = async (templateFile, templateData) => {
    const response = await fetch(templateFile);
    const responseText = await response.text();
    const template = Handlebars.compile(responseText);
    const html = template(templateData);
    return html;
};

export const getSeasonName = (season_id: string | undefined, seasons: Season[]) => {
    if (season_id) {
        return seasons.find(item => item._id == season_id)?.name;
    } else {
        return 'All-Time';
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

const render = async (templateFile, templateData, container, options) => {
    console.log(templateData);
    const html = await getHTML(templateFile, templateData);
    container.innerHTML = html;
    container.classList.remove('empty');

    if (options) {
        container.classList.add(options.animation);
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
    if (season_id) {
        clone = clone.filter((tour) => {
            return tour.season_id === season_id;
        });
    }
    clone = sortByDate(clone);
    return clone;
};

export const renderPage = async (state: State, options?) => {
    // render navigation
    await render(
      'views/nav.hbs', { season_id: state.season_id,
        seasons: state.data!.seasons},
      document.querySelector('main nav'),
      options
    );

    await render(
        `views/${state.view}.hbs`,
        controller[state.view].getData(state),
        document.getElementById('results'),
        options
    );
};

