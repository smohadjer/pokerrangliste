import { store } from '../lib/store';

export default (params: URLSearchParams) => {
    const state = store.getState();
    const league_id = params.get('league_id');
    const league = state.leagues.find(item => item._id === league_id);
    return {
        tenant_name: state.tenant.name,
        league_id,
        league_name: league ? league.name : ''
    };
};
