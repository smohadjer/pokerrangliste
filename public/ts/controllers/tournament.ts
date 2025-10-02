import { Tournament, Player } from '../types';
import {
    deepClone,
    getPrize,
    getBounty,
    getPoints,
    getRebuys,
    getTournaments,
    getPlayerName
} from '../lib/utils';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    // Use the most recent season if none is provided
    const season_id = params.get('season_id') ?? state.seasons[0]?._id;
    const tournaments = getTournaments(state.tournaments, season_id);
    const tournament = tournaments.find((item) => {
        return item._id === params.get('tournament_id')
    })
    if (!tournament) return;

    const cloneTournament: Tournament = deepClone(tournament);

    // if players have same points, list them sorted by their ranking
    if (cloneTournament.players && cloneTournament.players.length > 1) {
        cloneTournament.players.sort((player1: Player, player2: Player) => {
            return player1.ranking - player2.ranking;
        });
    }

    let players: Player[] = cloneTournament.players;
    if (players && players.length > 0) {
        players.map((player: Player) => {
            player.prize = (cloneTournament.status === 'upcoming') ? 0 : getPrize(player, cloneTournament);
            player.bounty = (cloneTournament.status === 'upcoming') ? 0 : getBounty(player, cloneTournament);
            player.points = (cloneTournament.status === 'upcoming') ? 0 : getPoints(player, cloneTournament);
            player.name = getPlayerName(player.id, state.players);
            return player;
        });
    }

    return {
        date: cloneTournament.date,
        playersCount: players?.length ?? 0,
        buyin: cloneTournament.buyin,
        rebuys: getRebuys(cloneTournament),
        players: players,
        hasBounty: cloneTournament.bounties ? 'Yes' : 'No',
        status: cloneTournament.status,
        event_id: params.get('event_id'),
    }
};
