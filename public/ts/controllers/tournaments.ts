import { getTournaments, getPlayerName } from '../lib/utils';
import { store } from '../lib/store';
import { Tournament } from '../types';

type TemplateData = {
    tournaments: Tournament[];
    season_id? : string;
    seasons: any;
    event_id: string | null;
}

export default (params: URLSearchParams) => {
    const state = store.getState();
    const season_id = params.get('season_id') ?? undefined;
    const tournaments = getTournaments(state.tournaments, season_id);
    const optimizedData = tournaments.map((item) => {
        if (item.status === 'done') {
            item.firstPlace = getPlayerName(item.players[0]?.id);
            item.secondPlace = getPlayerName(item.players[1]?.id);
        }
        return item;
    });

    const data: TemplateData = {
        tournaments: optimizedData,
        seasons: state.seasons,
        event_id: params.get('event_id'),
    }

    if (season_id) {
        data.season_id = season_id
    }

    return data;
};
