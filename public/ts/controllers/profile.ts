import { Tournament, Profile } from '../types';
import {
    getPoints,
    getPlayers,
    getTournaments,
    getSeasonName,
    getPlayerName,
    allTimeSeason
} from '../lib/utils';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    // Use the most recent season if none is provided
    const season_id = params.get('season_id') ?? state.seasons[0]?._id;
    const tournaments = getTournaments(state.tournaments, season_id);
    const tournamentsNormalized = tournaments.filter(
        tournament => tournament.status !== 'upcoming' && tournament.status !== 'pending')
    const playerId = params.get('player_id');

    if (!playerId) return;

    const enhancedPlayers = getPlayers(tournamentsNormalized);
    const player = enhancedPlayers.find((player) =>
        player.id === playerId);
    const playerFound = enhancedPlayers.some((player) => player.id === playerId);
    const ranking = playerFound ? enhancedPlayers.findIndex(
        player => player.id === playerId
    ) + 1 : undefined;
    const playerTournaments = playerFound ? tournamentsNormalized.filter(
        tournament => tournament.players.find(
            player => player.id === playerId
        )
    ) : [];
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

    return {
        player_name: getPlayerName(playerId, state.players),
        points: player?.points,
        gamesCount: playerTournaments.length,
        rebuys: player?.rebuys,
        ranking: ranking,
        results: results,
        seasonName: getSeasonName(season_id!, state.seasons),
        seasons: [...state.seasons, allTimeSeason],
        event_id: params.get('event_id')
    };
};
