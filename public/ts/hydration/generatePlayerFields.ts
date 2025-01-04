import {Tournament, Player } from '../lib/types';
import { getPlayerName, generateHTML } from '../lib/utils.js';

export async function generatePlayerFields(
    container: HTMLElement,
    playerDropdown: HTMLSelectElement,
    data?: Tournament) {
    const playersElm = container.querySelector('#players')!;
    const countElm = container.querySelector('#players-count')!;

    const updatePlayersCount = () => {
        const count = playersElm.children.length;
        countElm.innerHTML = `(${count})`;
    }

    playerDropdown.addEventListener('change', (event) => {
        console.log(event.target);
        if (event.target instanceof HTMLSelectElement) {
            const id = playerDropdown.value;
            if (id === 'Select') return;
            const name = playerDropdown.options[playerDropdown.selectedIndex].text;
            const player: Player = {
                id,
                name,
                ranking: 0,
                rebuys: 0,
                prize: 0,
                points: 0,
                bounty: 0
            };
            addPlayer(playersElm, player).then(() => {
                updatePlayersCount();
            });

            // disable option for player just added to avoid adding him twice
            disablePlayerInDropdown(player.id);
            playerDropdown.selectedIndex = 0;
        }
    });

    // click handler for player delete button
    container.addEventListener('click', (event) => {
        if (event.target instanceof HTMLButtonElement &&
        event.target.classList.contains('button-delete')) {
            const row = event.target.closest('.row-player');

            if (row) {
                row.remove();
                // enable the player in dropdown so he can be added again
                const input: HTMLInputElement = row.querySelector('input[name=players]')!;
                const playerId = input.value;
                playerDropdown.querySelector(`option[value="${playerId}"]`)?.removeAttribute('disabled');
                updatePlayersCount();
            }
        }
    });

    const disablePlayerInDropdown = (playerId: string) => {
        playerDropdown.querySelector(`option[value="${playerId}"]`)?.setAttribute('disabled', 'disabled');
    };

    if (data && data.players) {
        for (let i = 0; i<data.players?.length; i++) {
            const playerName = getPlayerName(data.players[i].id);
            data.players[i].name = playerName;
            const player = data.players[i];
            await addPlayer(playersElm, player).then(() => {
                updatePlayersCount();
            });

            // disable option for player just added to avoid adding him twice
            disablePlayerInDropdown(player.id);
        }
    }
}

const addPlayer = async (container: Element, player: Player) => {
    const htmlElement = await generateHTML('/views/components/player.hbs', player);
    container.prepend(...htmlElement);
};


