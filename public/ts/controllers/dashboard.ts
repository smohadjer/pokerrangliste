import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    return {
        tenant_id: state.tenant.id,
        tenant_name: state.tenant.name
    }
};
