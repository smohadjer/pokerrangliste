import { getPlayers, getTournaments, getSeasonName, allTimeSeason } from '../lib/utils';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    const season_id = params.get('season_id');
    const tournaments = getTournaments(state.tournaments, season_id);
    const tournamentsNormalized = tournaments.filter((tournament) => tournament.status === 'done')

    return {
        players: getPlayers(tournamentsNormalized),
        seasonName: getSeasonName(season_id, state.seasons),
        seasons: [...state.seasons, allTimeSeason],
        event_id: params.get('event_id'),
    }
};
