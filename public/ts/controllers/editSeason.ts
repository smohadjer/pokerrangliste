import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    let season_id = params.get('season_id') ?? undefined;
    if (!season_id && state.seasons?.length > 0) {
        season_id = state.seasons[state.seasons.length - 1]._id;
    }

    return {
        season_id: season_id,
        tenant_id: params.get('tenant_id')
    };
};
