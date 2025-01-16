import { store } from '../lib/store';

type TemplateData = {
    season_id? : string;
    event_id: string | null;
    tenant_name: string;
}

export default (params: URLSearchParams) => {
    const state = store.getState();
    let season_id = params.get('season_id') ?? undefined;
    if (!season_id && state.seasons?.length > 0) {
        season_id = state.seasons[state.seasons.length - 1]._id;
    }

    const data: TemplateData = {
        event_id: params.get('event_id'),
        tenant_name: state.tenant.name,
        season_id
    }

    return data;
};
