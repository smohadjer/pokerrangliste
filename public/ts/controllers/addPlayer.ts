import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    return {
        tenant_name: state.tenant.name,
        league_id: params.get('league_id')
    };
};
