import {Tournament, Player } from '../types';
import { getPlayerName, generateHTML } from '../lib/utils.js';
import { store } from '../lib/store';

const addPlayer = async (container: Element, player: Player) => {
    const htmlElement = await generateHTML('/views/components/player.hbs', player);
    const row = htmlElement[0].querySelector('.row-player');
    if(row) container.prepend(row);
};

const removePlayer = (container: Element, playerId: string) => {
    const input = container.querySelector(`input[value='${playerId}'`);
    const row = input?.closest('tr');
    row?.remove();
};

export async function generatePlayerFields(
    container: HTMLElement,
    playerDropdown: HTMLElement,
    tournamentData?: Tournament) {
    const playersElm = container.querySelector('#players')!;
    const countElm = container.querySelector('#players-count')!;

    const updatePlayersCount = () => {
        const count = playersElm.children.length;
        countElm.innerHTML = `(${count})`;
    }

    playerDropdown.addEventListener('change', (event) => {
        if (event.target instanceof HTMLInputElement) {
            const checked = event.target.checked;
            const playerId = event.target.value;

            if (checked) {
                const labels = event.target.labels;
                const name = (labels && labels.length > 0) ? labels[0].textContent.trim() : '';
                const player: Player = {
                    id: playerId,
                    name,
                    ranking: 0,
                    rebuys: 0,
                    prize: 0,
                    points: 0,
                    bounty: 0,
                    wins: 0,
                    runnerups: 0,
                };
                addPlayer(playersElm, player).then(() => {
                    updatePlayersCount();
                });
            } else {
                removePlayer(playersElm, playerId);
                updatePlayersCount();
            }
        }
    });

    const players = tournamentData?.players && [...tournamentData.players];
    if (players) {
        for (let i = 0; i<players.length; i++) {
            players[i].name = getPlayerName(players[i].id, store.getState().players);
            await addPlayer(playersElm, players[i]).then(() => {
                updatePlayersCount();
            });
        }
    }
}

