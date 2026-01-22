import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    return {
        league_id: params.get('league_id'),
        tenant_name: state.tenant.name,
        tenant_id: state.tenant.id
    }
};
