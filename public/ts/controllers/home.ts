import { store } from '../lib/store';

type TemplateData = {
    season_id? : string;
    tenant_id? : string;
    tenant_name? : string;
    event_id: string | null;
}

export default (params: URLSearchParams) => {
    const state = store.getState();
    const season_id = params.get('season_id') ?? undefined;

    const data: TemplateData = {
        event_id: params.get('event_id'),
        tenant_name: state.tenant.name,
        tenant_id: state.tenant.id
    }

    if (season_id) {
        data.season_id = season_id
    }

    return data;
};
