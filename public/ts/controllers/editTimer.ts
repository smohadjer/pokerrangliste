import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    const league_id = params.get('league_id');

    return {
        tenant_name: state.tenant.name,
        league_id,
        timer_id: params.get('timer_id')
    };
};
