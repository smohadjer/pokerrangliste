import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();

    // set default date to today
    const isoDate = new Date().toISOString().split('T')[0];

    return {
        tenant_name: state.tenant.name,
        players: state.players,
        seasons: state.seasons,
        event_id: params.get('event_id'),
        date: isoDate
    };
};
