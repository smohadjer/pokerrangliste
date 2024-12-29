import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    let season_id = params.get('season_id') ?? undefined;
    if (!season_id && state.seasons?.length > 0) {
        season_id = state.seasons[state.seasons.length - 1]._id;
    }

    // set default date to today
    const isoDate = new Date().toISOString().split('T')[0];
    console.log(isoDate)

    return {
        players: state.players,
        seasons: state.seasons,
        season_id: season_id,
        tenant_id: params.get('tenant_id'),
        date: isoDate
    };
};