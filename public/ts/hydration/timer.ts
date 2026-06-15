import { router } from '../lib/router';
import {
    getPendingTimerSpeechCount,
    initTimerSpeech,
    isTimerSpeechReactivationRequired,
    isTimerSpeechUnlocked,
    resetTimerSpeech,
    speakTimerMessage,
    unlockTimerSpeech
} from './timerSpeech';
import {
    hasActiveTimerWakeLock,
    hasTimerWakeLockRequestFailed,
    hasTimerWakeLockSupport,
    initTimerWakeLock,
    releaseTimerWakeLock,
    requestTimerWakeLock,
    resetTimerWakeLock
} from './timerWakeLock';

const fallbackDefaultDuration = 15 * 60;
const fallbackBlinds = [5, 10, 20, 40, 80, 150, 300];
const timerStateKey = 'timerState';
const roundChangedEventName = 'timer:round-change';

type SavedTimerState = {
    selectedTimerId?: string;
    timerId?: string;
    remaining?: number;
    level?: number;
    endTime?: number;
    isRunning?: boolean;
    warningSpeechLevel?: number;
};

type StoredTimerState = {
    leagues?: Record<string, SavedTimerState>;
};

const state = {
    defaultDuration: fallbackDefaultDuration,
    blinds: fallbackBlinds,
    duration: fallbackDefaultDuration,
    remaining: fallbackDefaultDuration,
    level: 1,
    endTime: 0,
    timerIntervalId: undefined as number | undefined,
    lastSavedRunningState: '',
    leagueId: '',
    currentTimerId: '',
    warningSpeechLevel: 0,
    restoredRunningTimer: false,
    needsRunningConfirmation: false
};

const ui = {
    wakeLockMessageDismissed: false
};

const elements = {
    roundDisplay: null as HTMLElement | null,
    blindsDisplay: null as HTMLElement | null,
    nextBlindsDisplay: null as HTMLElement | null,
    display: null as HTMLElement | null,
    wakeLockMessage: null as HTMLElement | null,
    wakeLockMessageText: null as HTMLElement | null,
    wakeLockCloseButton: null as HTMLButtonElement | null,
    wakeLockEnableButton: null as HTMLButtonElement | null,
    blindsStructureModal: null as HTMLElement | null,
    blindsStructureList: null as HTMLElement | null,
    startButton: null as HTMLButtonElement | null,
    startIcon: null as HTMLImageElement | null,
    prevLevelButton: null as HTMLButtonElement | null,
    nextLevelButton: null as HTMLButtonElement | null,
    timerPage: null as HTMLElement | null,
    timerSelector: null as HTMLSelectElement | null
};

export function initTimer(container: HTMLElement) {
    setDefaults(container);
    initTimerSpeech({
        isTimerRunning: () => Boolean(state.timerIntervalId),
        onStateChange: updateWakeLockSupportMessage
    });
    initTimerWakeLock({
        isTimerRunning: () => Boolean(state.timerIntervalId),
        onStateChange: updateWakeLockSupportMessage
    });

    elements.roundDisplay = container.querySelector<HTMLElement>('[data-timer-round]');
    elements.blindsDisplay = container.querySelector<HTMLElement>('[data-timer-blinds]');
    elements.nextBlindsDisplay = container.querySelector<HTMLElement>('[data-timer-next-blinds]');
    elements.display = container.querySelector<HTMLElement>('[data-timer-display]');
    elements.wakeLockMessage = container.querySelector<HTMLElement>('[data-timer-wake-lock-message]');
    elements.wakeLockMessageText = container.querySelector<HTMLElement>('[data-timer-wake-lock-text]');
    elements.wakeLockCloseButton = container.querySelector<HTMLButtonElement>('[data-timer-wake-lock-close]');
    elements.wakeLockEnableButton = container.querySelector<HTMLButtonElement>('[data-timer-wake-lock-enable]');
    elements.blindsStructureModal = container.querySelector<HTMLElement>('[data-timer-blinds-structure-modal]');
    elements.blindsStructureList = container.querySelector<HTMLElement>('[data-timer-blinds-structure-list]');
    elements.startButton = container.querySelector<HTMLButtonElement>('[data-timer-start]');
    elements.startIcon = container.querySelector<HTMLImageElement>('[data-timer-start-icon]');
    elements.prevLevelButton = container.querySelector<HTMLButtonElement>('[data-timer-prev-level]');
    elements.nextLevelButton = container.querySelector<HTMLButtonElement>('[data-timer-next-level]');
    elements.timerSelector = container.querySelector<HTMLSelectElement>('#select-timer');
    const resetRoundButton = container.querySelector<HTMLButtonElement>('[data-timer-reset-round]');
    const resetAllButton = container.querySelector<HTMLButtonElement>('[data-timer-reset-all]');
    const openBlindsStructureButton = container.querySelector<HTMLButtonElement>('[data-timer-blinds-structure-open]');
    const closeBlindsStructureButton = container.querySelector<HTMLButtonElement>('[data-timer-blinds-structure-close]');

    if (
        !elements.roundDisplay
        || !elements.blindsDisplay
        || !elements.nextBlindsDisplay
        || !elements.display
        || !elements.startButton
        || !elements.startIcon
        || !elements.prevLevelButton
        || !elements.nextLevelButton
        || !resetRoundButton
        || !resetAllButton
    ) {
        return;
    }

    elements.startButton.addEventListener('click', toggleTimer);
    elements.display.addEventListener('click', toggleTimer);
    elements.display.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        toggleTimer();
    });

    elements.prevLevelButton.addEventListener('click', prevLevel);
    elements.nextLevelButton.addEventListener('click', () => nextLevel({ interruptSpeech: true }));
    resetRoundButton.addEventListener('click', resetRound);
    resetAllButton.addEventListener('click', resetAll);
    openBlindsStructureButton?.addEventListener('click', openBlindsStructure);
    closeBlindsStructureButton?.addEventListener('click', closeBlindsStructure);
    elements.blindsStructureModal?.addEventListener('click', closeBlindsStructureOnBackdrop);
    elements.wakeLockEnableButton?.addEventListener('click', enableTimerFromPopup);
    elements.wakeLockCloseButton?.addEventListener('click', closeWakeLockMessage);
    elements.timerSelector?.addEventListener('change', changeTimer);
    elements.timerPage?.addEventListener(roundChangedEventName, event => {
        const detail = (event as CustomEvent<{ round: number; interruptSpeech?: boolean }>).detail;
        speakTimerMessage(getLevelChangedSpeech(detail.round), { interrupt: Boolean(detail.interruptSpeech) });
    });

    restoreState();
    renderBlindsStructure();
    updateLevelDisplay();
    updateBlindsDisplay();
    updateNextBlindsDisplay();
    updateDisplay();
    syncRunningSideEffects();
    updateWakeLockSupportMessage();
}

function changeTimer() {
    if (!elements.timerSelector || !elements.timerPage?.dataset.timerLeagueId) {
        return;
    }

    const selectedTimerId = elements.timerSelector.value;

    resetAll();
    resetRuntimeState();
    saveLeagueTimerState({
        selectedTimerId,
        timerId: selectedTimerId
    });

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('league_id', state.leagueId);
    urlParams.set('timer_id', selectedTimerId);
    router(window.location.pathname, urlParams.toString(), { type: 'reload' });
}

function updateDisplay() {
    if (state.timerIntervalId) {
        state.remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
    }

    if (elements.display) {
        elements.display.textContent = formatTime(state.remaining);
        elements.display.classList.toggle('timer-display--warning', state.remaining <= 60);
        elements.display.classList.toggle('timer-display--paused', !state.timerIntervalId);
        elements.display.setAttribute('aria-label', state.timerIntervalId ? 'Pause timer' : 'Start timer');
    }

    if (elements.prevLevelButton) {
        elements.prevLevelButton.disabled = state.level === 1;
    }

    if (elements.nextLevelButton) {
        elements.nextLevelButton.disabled = !hasNextLevel();
    }

    updateWakeLockSupportMessage();
}

function updateLevelDisplay() {
    if (elements.roundDisplay) {
        elements.roundDisplay.textContent = `Level ${state.level}`;
    }
}

function updateBlindsDisplay() {
    if (!elements.blindsDisplay) {
        return;
    }

    const blindValuesLabel = getBlindValuesLabel();
    elements.blindsDisplay.textContent = blindValuesLabel;
    elements.blindsDisplay.style.setProperty('--timer-blinds-font-size', getBlindsFontSize(blindValuesLabel));
}

function updateNextBlindsDisplay() {
    if (elements.nextBlindsDisplay) {
        elements.nextBlindsDisplay.textContent = hasNextLevel() ? `Next level: ${getBlindValuesLabel(state.level + 1)}` : '';
    }
}

function isTournamentStart() {
    return state.level === 1 && state.remaining === state.duration;
}

function toggleTimer() {
    if (state.timerIntervalId) {
        stop();
        return;
    }

    const shouldAnnounceTournamentStart = isTournamentStart();
    unlockTimerSpeech();

    if (state.remaining === 0) {
        state.remaining = state.duration;
    }

    state.endTime = Date.now() + (state.remaining * 1000);
    setRunningState();
    state.timerIntervalId = window.setInterval(tick, 250);
    syncRunningSideEffects();
    if (shouldAnnounceTournamentStart) {
        speakTimerMessage(getTournamentStartSpeech(), { interrupt: false });
    }
    tick();
}

function renderBlindsStructure() {
    if (!elements.blindsStructureList) {
        return;
    }

    elements.blindsStructureList.replaceChildren();
    const table = document.createElement('table');
    table.className = 'timer-blinds-structure__table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Level', 'SB', 'BB'].forEach(label => {
        const header = document.createElement('th');
        header.textContent = label;
        headerRow.append(header);
    });
    thead.append(headerRow);

    const tbody = document.createElement('tbody');
    state.blinds.forEach((smallBlind, index) => {
        const row = document.createElement('tr');
        row.className = 'timer-blinds-structure__row';

        const round = document.createElement('td');
        round.textContent = String(index + 1);

        const smallBlindValue = document.createElement('td');
        smallBlindValue.textContent = String(smallBlind);

        const bigBlindValue = document.createElement('td');
        bigBlindValue.textContent = String(smallBlind * 2);

        row.append(round, smallBlindValue, bigBlindValue);
        tbody.append(row);
    });

    table.append(thead, tbody);
    elements.blindsStructureList.append(table);
}

function openBlindsStructure() {
    renderBlindsStructure();

    if (elements.blindsStructureModal) {
        elements.blindsStructureModal.hidden = false;
    }
}

function closeBlindsStructure() {
    if (elements.blindsStructureModal) {
        elements.blindsStructureModal.hidden = true;
    }
}

function closeBlindsStructureOnBackdrop(event: MouseEvent) {
    if (event.target === elements.blindsStructureModal) {
        closeBlindsStructure();
    }
}

function stop() {
    if (state.timerIntervalId) {
        clearTimerInterval();
    }

    setPausedState();
    void releaseTimerWakeLock();
    state.restoredRunningTimer = false;
    state.needsRunningConfirmation = false;
    resetTimerSpeech();
    resetTimerWakeLock();
    updateWakeLockSupportMessage();
    updateDisplay();
    saveState();
}

function clearTimerInterval() {
    if (!state.timerIntervalId) {
        return;
    }

    window.clearInterval(state.timerIntervalId);
    state.timerIntervalId = undefined;
}

function syncRunningSideEffects() {
    updateWakeLockSupportMessage();

    if (!state.timerIntervalId) {
        return;
    }

    setRunningState();
    void requestTimerWakeLock();
    updateWakeLockSupportMessage();
}

function tick() {
    const previousRemaining = state.remaining;
    state.remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
    speakWarningIfNeeded(previousRemaining);

    if (state.remaining === 0) {
        nextLevel({ resetTimer: true });
        return;
    }

    updateDisplay();
    saveRunningState();
}

function nextLevel(options: { resetTimer?: boolean; interruptSpeech?: boolean } = {}) {
    const wasRunning = Boolean(state.timerIntervalId);

    if (!hasNextLevel()) {
        if (options.resetTimer) {
            state.remaining = state.duration;
            state.warningSpeechLevel = 0;

            if (wasRunning) {
                state.endTime = Date.now() + (state.duration * 1000);
                setRunningState();
            }
        }

        updateDisplay();
        saveState();
        return;
    }

    const previousLevel = state.level;
    state.level++;

    if (options.resetTimer) {
        state.remaining = state.duration;
        state.warningSpeechLevel = 0;
    }

    if (wasRunning && options.resetTimer) {
        state.endTime = Date.now() + (state.duration * 1000);
        setRunningState();
    }

    updateLevelDisplay();
    updateBlindsDisplay();
    updateNextBlindsDisplay();
    updateDisplay();
    dispatchRoundChanged(previousLevel, { interruptSpeech: options.interruptSpeech });
    saveState();
}

function prevLevel() {
    if (state.level === 1) {
        return;
    }

    const wasRunning = Boolean(state.timerIntervalId);
    const previousLevel = state.level;
    state.level--;
    state.warningSpeechLevel = 0;

    if (wasRunning) {
        setRunningState();
    }

    updateLevelDisplay();
    updateBlindsDisplay();
    updateNextBlindsDisplay();
    updateDisplay();
    dispatchRoundChanged(previousLevel, { interruptSpeech: true });
    saveState();
}

function resetRound() {
    stop();
    state.remaining = state.duration;
    state.warningSpeechLevel = 0;
    updateDisplay();
    saveState();
}

function resetAll() {
    stop();
    state.duration = state.defaultDuration;
    state.remaining = state.duration;
    state.level = 1;
    state.warningSpeechLevel = 0;
    updateLevelDisplay();
    updateBlindsDisplay();
    updateNextBlindsDisplay();
    updateDisplay();
    saveState();
}

function setRunningState() {
    if (elements.startIcon) {
        elements.startIcon.src = '/images/pause.svg';
    }

    if (elements.startButton) {
        elements.startButton.setAttribute('aria-label', 'Pause timer');
    }

    document.body.classList.add('fullscreen');
}

function setPausedState() {
    if (elements.startIcon) {
        elements.startIcon.src = '/images/play.svg';
    }

    if (elements.startButton) {
        elements.startButton.setAttribute('aria-label', 'Start timer');
    }

    document.body.classList.remove('fullscreen');
}

function updateWakeLockSupportMessage() {
    if (!elements.wakeLockMessage) {
        return;
    }

    const supportsWakeLock = hasTimerWakeLockSupport();
    const needsAudioGesture = Boolean(
        state.timerIntervalId
        && (!isTimerSpeechUnlocked() || isTimerSpeechReactivationRequired())
        && (state.restoredRunningTimer || getPendingTimerSpeechCount() > 0 || isTimerSpeechReactivationRequired())
    );
    const needsWakeLockGesture = Boolean(
        state.timerIntervalId
        && supportsWakeLock
        && !hasActiveTimerWakeLock()
        && hasTimerWakeLockRequestFailed()
    );
    const shouldShow = !ui.wakeLockMessageDismissed && (state.needsRunningConfirmation || !supportsWakeLock || needsWakeLockGesture || needsAudioGesture);

    elements.wakeLockMessage.hidden = !shouldShow;

    if (elements.wakeLockMessageText) {
        elements.wakeLockMessageText.textContent = getTimerPermissionMessage(supportsWakeLock, needsAudioGesture, needsWakeLockGesture);
    }

    if (elements.wakeLockEnableButton) {
        const hasAction = state.needsRunningConfirmation || needsAudioGesture || (supportsWakeLock && Boolean(state.timerIntervalId && !hasActiveTimerWakeLock()));
        elements.wakeLockEnableButton.hidden = !hasAction;
        elements.wakeLockEnableButton.textContent = getTimerPermissionButtonLabel(supportsWakeLock, needsAudioGesture, needsWakeLockGesture);
    }

    if (elements.wakeLockCloseButton) {
        elements.wakeLockCloseButton.textContent = state.needsRunningConfirmation ? 'Stop timer' : 'Close';
    }
}

function getTimerPermissionMessage(supportsWakeLock: boolean, needsAudioGesture: boolean, needsWakeLockGesture: boolean) {
    if (state.needsRunningConfirmation) {
        return 'The timer is still running. Do you want to keep it running?';
    }

    if (needsAudioGesture && supportsWakeLock) {
        return 'Tap Enable timer so announcements can play and this screen can stay awake while the timer is running.';
    }

    if (needsAudioGesture) {
        return 'Tap Enable sound so timer announcements can play. Your browser cannot keep this screen awake, so disable auto-lock or screen timeout in your device settings while using the timer.';
    }

    if (needsWakeLockGesture) {
        return 'Tap Keep screen awake so this timer can keep your screen on while it is running.';
    }

    return 'Your browser cannot keep this screen awake. Disable auto-lock or screen timeout in your device settings while using the timer.';
}

function getTimerPermissionButtonLabel(supportsWakeLock: boolean, needsAudioGesture: boolean, needsWakeLockGesture: boolean) {
    if (state.needsRunningConfirmation) {
        return 'Keep running';
    }

    if (needsAudioGesture && supportsWakeLock) {
        return 'Enable timer';
    }

    return needsAudioGesture ? 'Enable sound' : 'Keep screen awake';
}

function closeWakeLockMessage() {
    if (state.needsRunningConfirmation) {
        state.needsRunningConfirmation = false;
        stop();
        return;
    }

    ui.wakeLockMessageDismissed = true;
    if (elements.wakeLockMessage) {
        elements.wakeLockMessage.hidden = true;
    }
}

async function enableTimerFromPopup() {
    ui.wakeLockMessageDismissed = false;
    state.needsRunningConfirmation = false;
    unlockTimerSpeech();

    if (state.timerIntervalId && hasTimerWakeLockSupport()) {
        await requestTimerWakeLock();
    }

    updateWakeLockSupportMessage();
}

function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function getBlindValuesLabel(round = state.level) {
    const smallBlind = getSmallBlind(round);
    const bigBlind = smallBlind * 2;
    return `${smallBlind}/${bigBlind}`;
}

function getBlindsFontSize(label: string) {
    const length = label.replace(/\s/g, '').length;

    if (length >= 11) {
        return '2.4rem';
    }

    if (length >= 9) {
        return '2.8rem';
    }

    if (length >= 7) {
        return '3.3rem';
    }

    return '4rem';
}

function getLevelChangedSpeech(round: number) {
    const smallBlind = getSmallBlind(round);
    const bigBlind = smallBlind * 2;
    return `Level ${round}, blinds ${smallBlind} and ${bigBlind}`;
}

function getTournamentStartSpeech() {
    return `Tournament Starting, ${getLevelChangedSpeech(state.level)}`;
}

function getSmallBlind(round = state.level) {
    return state.blinds[round - 1] ?? state.blinds[state.blinds.length - 1] ?? fallbackBlinds[0];
}

function speakWarningIfNeeded(previousRemaining: number) {
    if (
        state.remaining !== 60
        || previousRemaining < 60
        || state.warningSpeechLevel === state.level
    ) {
        return;
    }

    state.warningSpeechLevel = state.level;
    speakTimerMessage('One minute remaining', { interrupt: true });
    saveState();
}

function hasNextLevel() {
    return state.level < getMaxLevel();
}

function getMaxLevel() {
    return Math.max(1, state.blinds.length);
}

function dispatchRoundChanged(previousLevel: number, options: { interruptSpeech?: boolean } = {}) {
    if (previousLevel === state.level) {
        return;
    }

    elements.timerPage?.dispatchEvent(new CustomEvent(roundChangedEventName, {
        detail: {
            previousRound: previousLevel,
            round: state.level,
            interruptSpeech: options.interruptSpeech
        }
    }));
}

function saveState() {
    state.lastSavedRunningState = getRunningStateKey();

    saveLeagueTimerState({
        selectedTimerId: state.currentTimerId,
        timerId: state.currentTimerId,
        remaining: state.remaining,
        level: state.level,
        endTime: state.endTime,
        isRunning: Boolean(state.timerIntervalId),
        warningSpeechLevel: state.warningSpeechLevel
    });
}

function saveRunningState() {
    const runningState = getRunningStateKey();
    if (runningState === state.lastSavedRunningState) {
        return;
    }

    saveState();
}

function getRunningStateKey() {
    return `${state.level}:${state.remaining}:${state.endTime}:${Boolean(state.timerIntervalId)}`;
}

function restoreState() {
    const savedState = loadLeagueTimerState();
    if (!savedState || savedState.timerId !== state.currentTimerId) {
        return;
    }

    try {
        state.level = sanitizeLevel(savedState.level);
        state.warningSpeechLevel = sanitizeNumber(savedState.warningSpeechLevel, 0);

        if (savedState.isRunning && typeof savedState.endTime === 'number') {
            state.endTime = savedState.endTime;
            state.remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
            state.restoredRunningTimer = true;
            state.needsRunningConfirmation = true;

            if (state.remaining === 0) {
                catchUpRunningTimer();
            }

            if (!state.timerIntervalId) {
                state.timerIntervalId = window.setInterval(tick, 250);
            }

            return;
        }

        state.remaining = sanitizeNumber(savedState.remaining, state.duration);
    } catch {
        resetRuntimeState();
        state.duration = state.defaultDuration;
        state.remaining = state.defaultDuration;
        state.level = 1;
        state.endTime = 0;
        removeLeagueTimerState();
    }
}

function sanitizeNumber(value: unknown, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeLevel(value: unknown) {
    return Math.min(getMaxLevel(), Math.max(1, sanitizeNumber(value, 1)));
}

function catchUpRunningTimer() {
    const durationMs = state.duration * 1000;
    const elapsedSinceRoundEnd = Date.now() - state.endTime;
    const completedRounds = Math.floor(elapsedSinceRoundEnd / durationMs) + 1;
    const elapsedInCurrentRound = elapsedSinceRoundEnd % durationMs;

    state.level = Math.min(getMaxLevel(), state.level + completedRounds);
    state.remaining = Math.ceil((durationMs - elapsedInCurrentRound) / 1000);
    state.endTime = Date.now() + (state.remaining * 1000);
}

function resetRuntimeState() {
    clearTimerInterval();
    state.endTime = 0;
    state.warningSpeechLevel = 0;
    state.restoredRunningTimer = false;
    state.needsRunningConfirmation = false;
    resetTimerSpeech();
    resetTimerWakeLock();
    state.lastSavedRunningState = '';
    void releaseTimerWakeLock();
}

function setDefaults(container: HTMLElement) {
    removeLegacyTimerStateKeys();
    elements.timerPage = container.querySelector<HTMLElement>('[data-timer-page]');
    state.leagueId = elements.timerPage?.dataset.timerLeagueId || '';
    state.currentTimerId = elements.timerPage?.dataset.timerId || '';
    state.defaultDuration = getPositiveNumber(
        elements.timerPage?.dataset.timerDefaultDuration,
        fallbackDefaultDuration
    );
    state.blinds = getBlinds(elements.timerPage?.dataset.timerSmallBlinds);

    state.duration = state.defaultDuration;
    state.remaining = state.defaultDuration;
    state.level = 1;
    state.endTime = 0;
    state.warningSpeechLevel = 0;
    resetTimerSpeech();
    resetTimerWakeLock();

    const savedState = loadLeagueTimerState();
    if (state.currentTimerId && savedState?.timerId !== state.currentTimerId) {
        saveLeagueTimerState({
            selectedTimerId: state.currentTimerId,
            timerId: state.currentTimerId
        });
    }
}

function loadTimerState() {
    try {
        return JSON.parse(window.localStorage.getItem(timerStateKey) || '{}') as StoredTimerState;
    } catch {
        return {};
    }
}

function loadLeagueTimerState() {
    if (!state.leagueId) {
        return null;
    }

    return loadTimerState().leagues?.[state.leagueId] ?? null;
}

function saveLeagueTimerState(savedState: SavedTimerState) {
    if (!state.leagueId) {
        return;
    }

    const timerState = loadTimerState();
    timerState.leagues = timerState.leagues || {};
    timerState.leagues[state.leagueId] = savedState;
    window.localStorage.setItem(timerStateKey, JSON.stringify(timerState));
}

function removeLeagueTimerState() {
    if (!state.leagueId) {
        return;
    }

    const timerState = loadTimerState();
    if (!timerState.leagues?.[state.leagueId]) {
        return;
    }

    delete timerState.leagues[state.leagueId];
    window.localStorage.setItem(timerStateKey, JSON.stringify(timerState));
}

function removeLegacyTimerStateKeys() {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const key = window.localStorage.key(i);

        if (key && (key === 'selectedTimer' || key.startsWith('selectedTimer:') || key.startsWith('timerState:'))) {
            window.localStorage.removeItem(key);
        }
    }
}

function getPositiveNumber(value: string | undefined, fallback: number) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0
        ? parsedValue
        : fallback;
}

function getBlinds(value: string | undefined) {
    const parsedBlinds = String(value || '')
        .split(',')
        .map(item => Number(item.trim()))
        .filter(item => Number.isFinite(item) && item > 0);

    return parsedBlinds.length > 0 ? parsedBlinds : fallbackBlinds;
}
