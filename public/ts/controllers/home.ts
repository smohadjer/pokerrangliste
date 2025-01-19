import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    return {
        event_id: params.get('event_id'),
        tenant_name: state.tenant.name,
        tenant_id: state.tenant.id
    }
};
