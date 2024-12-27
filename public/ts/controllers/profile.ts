import { Tournament, Profile } from '../lib/types';
import {
    getPoints,
    getPlayers,
    getTournaments,
    getSeasonName
} from '../utils';
import { store } from '../lib/store';

type TemplateData = {
    player_name: string;
    points: number;
    gamesCount: number;
    ranking: number;
    results: Profile[];
    seasonName?: string;
    rebuys?: number;
    status?: 'upcoming' | 'pending' | 'done';
    season_id? : string;
    tenant_id: string | null;
    seasons: any;
}

export default (params: URLSearchParams) => {
    const state = store.getState();
    const season_id = params.get('season_id') ?? undefined;
    const tournaments = getTournaments(state.tournaments, season_id);
    const tournamentsNormalized = tournaments.filter(
        tournament => tournament.status !== 'upcoming')
    const playerId = params.get('player_id');

    if (!playerId) return;

    const enhancedPlayers = getPlayers(tournamentsNormalized);
    const player = enhancedPlayers.find((player) =>
        player.id === playerId);
    const ranking = enhancedPlayers.findIndex(
        player => player.id === playerId
    ) + 1;
    const playerTournaments = tournamentsNormalized.filter(
        tournament => tournament.players.find(
            player => player.id === playerId
        )
    );
    const results: Profile[] = [];

    playerTournaments.forEach((item: Tournament) => {
        const index = item.players.findIndex(
            player => player.id === playerId
        );
        const result: Profile = {
            date: item.date,
            _id: item._id,
            ranking: item.players[index].ranking,
            rebuys: item.players[index].rebuys,
            players: item.players.length,
            points: getPoints(item.players[index], item)
        };
        results.push(result);
    });

    if (!player) return;

    const data: TemplateData = {
        player_name: player.name!,
        points: player.points,
        gamesCount: playerTournaments.length,
        rebuys: player?.rebuys,
        ranking: ranking,
        results: results,
        seasonName: getSeasonName(season_id!, state.seasons),
        seasons: state.seasons,
        tenant_id: params.get('tenant_id')
    };

    if (season_id) {
        data.season_id = season_id
    }

    return data;
};
