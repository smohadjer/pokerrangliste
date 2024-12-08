import {
    Tournament,
    PlayerDB, Player,
    Season,
    RouteParams,
} from './types';

/* since importing from node_modules using a relative path throws error on Render.com
I have copy/pasted dist/handlebars.min.js to ts/lib/ext and renamed it from .js to .cjs
to avoid errors during build */
import { store } from '../lib/store';

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
    if ( tournament.prizes.length === 0) return 0;
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

export const getPlayerName = (id: string) => {
    const state = store.getState();
    const players: PlayerDB[] = state.players;
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

export const getRouteParams = (paramsString: string) => {
    const params = new URLSearchParams(paramsString);
    const temp: RouteParams = {};

    // for browsers not supporting URLSearchParams's size property
    const size = (params.size) ? params.size : params.toString().length;

    if (size > 0) {
        for (const [key, value] of params) {
            temp[key] = value;
        }
    }

    return temp;
};

export const isAuthenticated = async () => {
    const response = await fetch('/api/verifyAuth');
    const isAuthenticated = await response.json();
    return isAuthenticated.valid;
}
