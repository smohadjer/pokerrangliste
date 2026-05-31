import { allTimeSeason } from '../lib/utils';
import { store } from '../lib/store';

const defaultDuration = 15 * 60;
const defaultBlinds = [5, 10, 20, 40, 80, 150, 300];
const initialRound = 1;
const timerStateKey = 'timerState';

export default (params: URLSearchParams) => {
    const state = store.getState();
    const league_id = params.get('league_id');
    const timer_id = params.get('timer_id');
    const league = state.leagues.find(item => item._id === league_id);
    const rememberedTimerId = getRememberedTimerId(league_id);
    const selectedTimerId = getSelectedTimerId(
        [timer_id, rememberedTimerId, league?.default_timer_id],
        state.timers);
    const timerSettings = state.timers.find(timer => getObjectId(timer._id) === selectedTimerId)
        || state.timers.find(timer => (
            timer.tenant_id === league?.tenant_id && timer.name === league?.name
        ));
    const duration = getDuration(timerSettings?.duration);
    const blinds = getBlinds(timerSettings?.small_blinds);
    const initialSmallBlind = getSmallBlind(blinds, initialRound);

    return {
        seasons: [...state.seasons, allTimeSeason],
        league_id,
        timer: {
            id: getObjectId(timerSettings?._id),
            name: timerSettings?.name,
            duration,
            initialRound,
            initialTime: formatTime(duration),
            smallBlinds: blinds.join(','),
            initialBlinds: getBlindsLabel(initialSmallBlind)
        },
        timers: state.timers.map(timer => ({
            id: getObjectId(timer._id),
            name: timer.name ?? 'Timer',
            selected: getObjectId(timer._id) === getObjectId(timerSettings?._id)
        })).filter(timer => timer.id)
    };
};

function getBlindsLabel(smallBlind: number) {
    return `${smallBlind} / ${smallBlind * 2}`;
}

function getSmallBlind(blinds: number[], round: number) {
    return blinds[round - 1] ?? blinds[blinds.length - 1] ?? defaultBlinds[0];
}

function getBlinds(blinds?: number[]) {
    return Array.isArray(blinds) && blinds.length > 0
        ? blinds.filter(item => Number.isFinite(item) && item > 0)
        : defaultBlinds;
}

function getDuration(duration?: number) {
    return duration && duration > 0 ? duration : defaultDuration;
}

function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function getObjectId(id: unknown) {
    if (!id) {
        return '';
    }

    if (typeof id === 'object' && '$oid' in id) {
        return String(id.$oid);
    }

    return String(id);
}

function getRememberedTimerId(leagueId: string | null) {
    if (!leagueId) {
        return '';
    }

    try {
        const state = JSON.parse(window.localStorage.getItem(timerStateKey) || '{}');
        return state?.leagues?.[leagueId]?.selectedTimerId
            || window.localStorage.getItem(`selectedTimer:${leagueId}`)
            || '';
    } catch {
        return window.localStorage.getItem(`selectedTimer:${leagueId}`) || '';
    }
}

function getSelectedTimerId(timerIds: Array<string | undefined | null>, timers: Array<{ _id?: unknown }>) {
    const validTimerIds = new Set(timers.map(timer => getObjectId(timer._id)));
    return timerIds.find(timerId => timerId && validTimerIds.has(timerId)) || '';
}
