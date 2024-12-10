/*** Only pure functions in this file! ***/
import { State, Tournament, Player, PlayerDB, Season, RouteParams} from './lib/types';
import { getHandlebarsTemplate } from './lib/setHandlebars.js';
import { store } from './lib/store';

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

export const enablePasswordToggle = (container: HTMLElement) => {
    const toggle = container.querySelector('#togglePassword');
    const passwordField = container.querySelector('#password');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            const type = passwordField?.getAttribute('type') === 'text' ? 'password' : 'text';
            passwordField?.setAttribute('type', type);
        });
    }
}

// used to populate players and seasons select
export function populateSelect(select: HTMLSelectElement, data: PlayerDB[] | Season[]) {
    let options = '<option selected disabled option="">Select</option>';
    data.forEach(item => {
        options += `<option value="${item._id}">${item.name}</option>`
    });
    select.innerHTML = options;
}

export function populateSelectTournaments(select: HTMLSelectElement, data: Tournament[]) {
    let options = '<option selected disabled option="">Select</option>';
    data.forEach(item => {
        options += `<option value="${item._id}">${item.date} (${item.round})</option>`
    });
    select.innerHTML = options;
}

export async function generateHTML(templateFile: string, data: Tournament) {
    const template = await getHandlebarsTemplate(templateFile);
    const htmlString = template(data);
    const html = new DOMParser().parseFromString(htmlString,
        'text/html').body.children;
    return html;
}

export function initTournamentForm(
    form: HTMLElement,
    state: State,
    data?: Tournament) {
    // populate season dropdown
    const seasonDropdown: HTMLSelectElement = form.querySelector('#season_dropdown')!;
    populateSelect(seasonDropdown, state.seasons);
    if (data && data.season_id) {
        seasonDropdown.value = data.season_id;
    }

    // populate player dropdown
    const playerDropdown: HTMLSelectElement = form.querySelector('#player_dropdown')!;
    populateSelect(playerDropdown, state.players);

    generatePlayerFields(form, data);
}

function generatePlayerFields(
    container: HTMLElement,
    data?: Tournament) {
    const playersElm = container.querySelector('#players')!;
    const playerDropdown: HTMLSelectElement = container.querySelector('#player_dropdown')!;

    // click handler for player delete button
    playersElm.addEventListener('click', (event) => {
        if (event.target instanceof HTMLButtonElement &&
        event.target.classList.contains('button-delete')) {
            const row = event.target.closest('.row-player');
            row?.remove();
        }
    });

    const addPlayer = (player: Player) => {
        const htmlString = getPlayersList(player);
        const htmlElement = new DOMParser().parseFromString(htmlString,
            'text/html').body.children;
        playersElm.append(...htmlElement);
    }

    const addPlayerButton = container.querySelector('#add-player')!;
    if (addPlayerButton) {
        addPlayerButton.addEventListener('click', (event) => {
            if (event.target instanceof HTMLButtonElement) {
                const id = playerDropdown.value;
                if (id === 'Select') return;
                const name = playerDropdown.options[playerDropdown.selectedIndex].text;
                const player: Player = {
                    id,
                    name,
                    ranking: 0,
                    rebuys: 0,
                    prize: 0
                };
                addPlayer(player);
            }
        });
    }

    if (data) {
        for (let i = 0; i<data.players.length; i++) {
            const playerName = getPlayerName(data.players[i].id);
            data.players[i].name = playerName;
            const player = data.players[i];
            addPlayer(player);
        }
    }
}

function getPlayersList(player: Player) {
    let html = `<div class="row-player">
        <div class="row">
            <label><strong>${player.name}</strong></label>
            <input hidden name="players" value="${player.id}"
        </div>`;

    html +=
        `<div class="row">
            <label class="label">Ranking:</label>
            <input name="player_${player.id}_ranking" value="${player.ranking}" type="number" min="0">
        </div>`;

    html +=
        `<div class="row">
            <label class="label">Rebuys:</label>
            <input name="player_${player.id}_rebuys" value="${player.rebuys}" type="number" min="0">
        </div>`;

    html +=
        `<div class="row">
            <label class="label">Prize:</label>
            <input name="player_${player.id}_prize" value="${player.prize}" type="number" min="0">
        </div>
        <div class="row">
            <label></label>
            <button class="button-delete" type="button">Remove</button>
        </div>
    </div>`;

    return html;
}

