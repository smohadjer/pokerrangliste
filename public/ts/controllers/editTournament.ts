import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    return {
        tenant_name: state.tenant.name,
        event_id: params.get('event_id'),
        players: state.players,
        seasons: state.seasons,
    };
};
