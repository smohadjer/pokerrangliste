import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    return {
        tenant_name: state.tenant.name,
        league_id: params.get('league_id'),
        tournament_id: params.get('tournament_id'),
        players: state.players,
        seasons: state.seasons,
    };
};
