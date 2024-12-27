import { Tournament, Player, RouteParams } from '../lib/types';
import {
    deepClone,
    getPrize,
    getBounty,
    getPoints,
    getRebuys,
    getTournaments,
} from '../utils';
import { store } from '../lib/store';
import getPlayerName from '../components/getPlayerName';

type TemplateData = {
    date: string;
    playersCount: number;
    buyin: number;
    rebuys: number;
    players: Player[];
    hasBounty: string;
    status?: 'upcoming' | 'pending' | 'done';
    season_id? : string;
    tenant_id: string | null;
}

export default (params: URLSearchParams) => {
    const state = store.getState();
    const season_id = params.get('season_id') ?? undefined;
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
            player.name = getPlayerName(player.id);
            return player;
        });
    }

    const data: TemplateData = {
        date: cloneTournament.date,
        playersCount: players?.length ?? 0,
        buyin: cloneTournament.buyin,
        rebuys: getRebuys(cloneTournament),
        players: players,
        hasBounty: cloneTournament.bounties ? 'Yes' : 'No',
        status: cloneTournament.status,
        tenant_id: params.get('tenant_id'),
    }

    if (season_id) {
        data.season_id = season_id
    }

    return data;
};
