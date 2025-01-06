/*** Only pure functions in this file! ***/
import { Tournament, Player, Season, PlayerDB } from './types';
import { getHandlebarsTemplate } from './setHandlebars.js';
import { store } from './store';

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

export const fetchEvents = async () => {
    try {
        const response = await fetch('/api/events');
        const json = await response.json();
        if (!json) throw ('Failed to fetch events from server!');
        if (json.error) {
            throw(json.message);
        } else {
            store.setState({
                events: json
            })
            return json;
        }
    } catch (e) {
        console.error(` Error: ${e}`);
    }
};
