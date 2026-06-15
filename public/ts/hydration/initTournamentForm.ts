import { generatePlayerFields } from './generatePlayerFields';
import { State, Tournament, PlayerDB, Player } from '../types';
import { populateSelect, calculatePayouts } from '../lib/utils';

export async function initTournamentForm(
    formWrapper: HTMLElement,
    state: State,
    data: Tournament | null,
    default_season_id?: string) {
    // populate season dropdown
    const seasonDropdown: HTMLSelectElement = formWrapper.querySelector('#season_dropdown')!;
    populateSelect(seasonDropdown, state.seasons);
    const seasonId = data ? data.season_id : default_season_id;
    if (seasonId) {
        seasonDropdown.value = seasonId
    }

    // populate player selection box
    const playerDropdown: HTMLElement = formWrapper.querySelector('#player_dropdown')!;
    populatePlayers(playerDropdown, state.players, data?.players);

    await generatePlayerFields(formWrapper, playerDropdown, data);

    const form: HTMLFormElement | null = formWrapper.closest('form');
    if (form) {
        const formData = new FormData(form);
        const status = formData.get('status') ?? '';
        UpdateTournamentState(form, status as string);
        initPayoutCalculator(formWrapper, form, data);

        // change handler for tournament status field
        form.addEventListener('change', async (event) => {
            const form = formWrapper.closest('form');
            if (form && event.target instanceof HTMLInputElement &&
                event.target.getAttribute('name') === 'status') {
                UpdateTournamentState(form, event.target.value);
            }
        });
    }
}

function UpdateTournamentState(form: HTMLFormElement, status: string) {
    const playerDropdown = form.querySelector('#player_dropdown');
    const resultsTable = form.querySelector('.table-players');
    const payoutRow = form.querySelector<HTMLElement>('.row--payouts');

    // disable input fields if tournament is complete to avoid changing values by mistake
    if (status === 'done') {
        resultsTable?.querySelectorAll('input').forEach(inputField => {
            inputField.readOnly = true;
        })
    } else {
        resultsTable?.querySelectorAll('input').forEach(inputField => {
            inputField.readOnly = false;
        })
    }

    if (status === 'upcoming') {
        playerDropdown?.classList.remove('disabled');
    } else {
        playerDropdown?.classList.add('disabled');
    }

    if (payoutRow) {
        payoutRow.hidden = status !== 'pending';
    }
}

function populatePlayers(container: HTMLElement, allPlayers: PlayerDB[], tournamentPlayers: Player[] | undefined) {
    let markup = '';
    allPlayers.forEach(item => {
        // the input fields are only for frontend and shouldn't be submitted so we don't
        // set a name attribute on them
        const playerFound = tournamentPlayers?.find(player => player.id === item._id);
        markup += `<label><input type="checkbox" ${playerFound ? 'checked' : ''} value="${item._id}">${item.name}</label>`
    });
    container.innerHTML = markup;
}

function initPayoutCalculator(
    formWrapper: HTMLElement,
    form: HTMLFormElement,
    tournamentData: Tournament | null
) {
    const calculateButton = formWrapper.querySelector<HTMLButtonElement>('#calculate-payouts');
    const hintElm = formWrapper.querySelector<HTMLElement>('#calculate-payouts-hint');
    const rebuysElm = formWrapper.querySelector<HTMLElement>('#tournament-total-rebuys');
    const totalPrizeElm = formWrapper.querySelector<HTMLElement>('#tournament-total-prize');
    const buyinInput = form.querySelector<HTMLInputElement>('input[name="buyin"]');

    if (!calculateButton || !hintElm || !rebuysElm || !totalPrizeElm || !buyinInput || !tournamentData) {
        return;
    }

    const getRankedPlayers = () => {
        const rankingInputs = Array.from(
            form.querySelectorAll<HTMLInputElement>('input[name^="player_"][name$="_ranking"]')
        );

        return rankingInputs
            .map((input) => {
                const ranking = Number(input.value);
                const prizeInputName = input.name.replace('_ranking', '_prize');
                const prizeInput = form.querySelector<HTMLInputElement>(`input[name="${prizeInputName}"]`);
                return {
                    ranking,
                    prizeInput
                };
            })
            .filter((player) => player.prizeInput && Number.isInteger(player.ranking) && player.ranking > 0)
            .sort((a, b) => a.ranking - b.ranking);
    };

    const hasCompleteRankings = () => {
        const rankingInputs = Array.from(
            form.querySelectorAll<HTMLInputElement>('input[name^="player_"][name$="_ranking"]')
        );
        if (rankingInputs.length === 0) {
            return false;
        }

        return rankingInputs.every((input) => {
            const ranking = Number(input.value);
            return Number.isInteger(ranking) && ranking > 0;
        });
    };

    const updatePayoutHint = (prizePool: number, playerCount: number, maxPaidPlaces: number) => {
        const payouts = calculatePayouts(playerCount, prizePool, 0.25, 0.75, 5, maxPaidPlaces);
        calculateButton.disabled = !hasCompleteRankings();
        hintElm.textContent = payouts.length
            ? `(${payouts.map((payout) => payout.amount).join(', ')})`
            : '';
        return payouts;
    };

    const updatePrizeSummary = () => {
        const buyin = Number(buyinInput.value) || 0;
        const rebuys = Array.from(
            form.querySelectorAll<HTMLInputElement>('input[name^="player_"][name$="_rebuys"]')
        ).reduce((sum, input) => sum + (Number(input.value) || 0), 0);
        const playersCount = form.querySelectorAll<HTMLInputElement>('input[name="players"]').length;
        const effectivePlayerCount = playersCount + rebuys;
        const prizePool = buyin * (playersCount + rebuys);

        rebuysElm.textContent = String(rebuys);
        totalPrizeElm.textContent = String(prizePool);
        updatePayoutHint(prizePool, effectivePlayerCount, playersCount);

        return { prizePool, effectivePlayerCount, playersCount };
    };

    updatePrizeSummary();

    form.addEventListener('input', (event) => {
        if (!(event.target instanceof HTMLInputElement)) {
            return;
        }

        if (
            event.target.name === 'buyin' ||
            event.target.name.endsWith('_rebuys') ||
            event.target.name.endsWith('_ranking')
        ) {
            updatePrizeSummary();
        }
    });

    calculateButton.addEventListener('click', () => {
        const summary = updatePrizeSummary();
        const prizeInputs = Array.from(
            form.querySelectorAll<HTMLInputElement>('input[name^="player_"][name$="_prize"]')
        );

        prizeInputs.forEach((input) => {
            input.value = '0';
        });

        const rankedPlayers = getRankedPlayers();
        const payouts = updatePayoutHint(
            summary?.prizePool ?? 0,
            summary?.effectivePlayerCount ?? rankedPlayers.length,
            summary?.playersCount ?? rankedPlayers.length
        );
        payouts.forEach((payout) => {
            const winner = rankedPlayers.find((player) => player.ranking === payout.place);
            if (winner?.prizeInput) {
                winner.prizeInput.value = String(payout.amount);
            }
        });
    });
}
