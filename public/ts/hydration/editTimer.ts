import { store } from '../lib/store';
import { generateHTML } from '../lib/utils';
import { TimerSettings } from '../types';

const defaultDurationMinutes = 15;
const defaultSmallBlinds = [5, 10, 20, 40, 80, 150, 300];

export function initEditTimer(container: HTMLElement) {
    const form = container.querySelector<HTMLFormElement>('form[action="/api/timers"]');
    const timerDropdown = container.querySelector<HTMLSelectElement>('#timer_edit_dropdown');
    const formWrapper = container.querySelector<HTMLElement>('#timer-fieldset');
    const state = store.getState();

    if (!form || !timerDropdown || !formWrapper) {
        return;
    }

    const renderForm = async (timerId: string) => {
        const timer = state.timers.find(item => getTimerId(item) === timerId);
        if (!timer) {
            formWrapper.innerHTML = '';
            return;
        }

        const htmlElement = await generateHTML('/views/partials/timerForm.hbs', getTimerFormData(timer));
        formWrapper.innerHTML = '';
        formWrapper.append(...htmlElement);
    };

    const url = new URL(window.location.href);
    const timerId = url.searchParams.get('timer_id');
    populateTimerSelect(timerDropdown, state.timers, timerId ?? undefined);

    if (timerId) {
        renderForm(timerId);
    }

    timerDropdown.addEventListener('change', () => {
        const timerId = timerDropdown.value;
        renderForm(timerId);
        url.searchParams.set('timer_id', timerId);
        window.history.replaceState({}, '', url.toString());
    });

    form.addEventListener('submit', () => {
        const durationMinutes = form.querySelector<HTMLInputElement>('[data-timer-duration-minutes]');
        const durationSecondsRemainder = form.querySelector<HTMLInputElement>('[data-timer-duration-seconds-remainder]');
        const durationSeconds = form.querySelector<HTMLInputElement>('[data-timer-duration-seconds]');

        if (!durationMinutes || !durationSecondsRemainder || !durationSeconds) {
            return;
        }

        const minutes = Number(durationMinutes.value);
        const seconds = Number(durationSecondsRemainder.value);
        durationSeconds.value = Number.isFinite(minutes) && minutes >= 0 && Number.isFinite(seconds) && seconds >= 0
            ? Math.round((minutes * 60) + seconds).toString()
            : durationSeconds.value;
    });
}

function populateTimerSelect(
    select: HTMLSelectElement,
    timers: TimerSettings[],
    selectedTimerId?: string
) {
    const defaultSelected = selectedTimerId ? '' : 'selected';
    let options = `<option ${defaultSelected} disabled value="">Select</option>`;
    timers.forEach(timer => {
        const timerId = getTimerId(timer);
        if (!timerId) {
            return;
        }

        const selected = selectedTimerId === timerId ? 'selected' : '';
        options += `<option ${selected} value="${timerId}">${timer.name ?? 'Timer'}</option>`;
    });
    select.innerHTML = options;
}

function getTimerId(timer: TimerSettings) {
    if (!timer._id) {
        return '';
    }

    if (typeof timer._id === 'object' && '$oid' in timer._id) {
        return String(timer._id.$oid);
    }

    return String(timer._id);
}

function getTimerFormData(timer: TimerSettings) {
    const duration = getDurationSeconds(timer.duration);
    return {
        name: timer.name ?? '',
        duration,
        durationMinutes: Math.floor(duration / 60),
        durationSecondsRemainder: duration % 60,
        small_blinds: getSmallBlinds(timer.small_blinds).join(', ')
    };
}

function getDurationSeconds(duration?: number) {
    return duration && duration > 0
        ? duration
        : defaultDurationMinutes * 60;
}

function getSmallBlinds(blinds?: number[]) {
    return Array.isArray(blinds) && blinds.length > 0
        ? blinds
        : defaultSmallBlinds;
}
