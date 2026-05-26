import { store } from '../lib/store';

const defaultDuration = 15 * 60;
const defaultSmallBlinds = [5, 10, 20, 40, 80, 150, 300];

export default (params: URLSearchParams) => {
    const state = store.getState();
    return {
        tenant_name: state.tenant.name,
        league_id: params.get('league_id'),
        name: '',
        duration: defaultDuration,
        durationMinutes: Math.floor(defaultDuration / 60),
        small_blinds: defaultSmallBlinds.join(', ')
    };
};
