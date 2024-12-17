import {
    getPlayers,
    getTournaments,
    getSeasonName
} from '../utils';
import { RouteParams } from '../lib/types';
import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    console.log(typeof params)
    const state = store.getState();
    let season_id = params.get('season_id') ?? undefined;
    if (!season_id && state.seasons?.length > 0) {
        season_id = state.seasons[state.seasons.length - 1]._id;
    }
    const tournaments = getTournaments(state.tournaments, season_id!);
    const tournamentsNormalized = tournaments.filter((tournament) => tournament.status === 'done')

    return {
        players: getPlayers(tournamentsNormalized),
        season_id: season_id,
        seasonName:  getSeasonName(season_id!, state.seasons),
        seasons: state.seasons,
        tenant_id: params.get('tenant_id')
    };
};
