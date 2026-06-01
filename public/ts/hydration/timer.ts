import { router } from '../lib/router';

const fallbackDefaultDuration = 15 * 60;
const fallbackBlinds = [5, 10, 20, 40, 80, 150, 300];
const timerStateKey = 'timerState';
const roundChangedEventName = 'timer:round-change';

type WakeLockSentinel = {
    release: () => Promise<void>;
    addEventListener: (type: 'release', listener: () => void) => void;
};

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

let defaultDuration = fallbackDefaultDuration;
let blinds = fallbackBlinds;
let duration = defaultDuration;
let remaining = defaultDuration;
let level = 1;
let endTime = 0;
let timerId: number | undefined;
let roundDisplay: HTMLElement | null = null;
let blindsDisplay: HTMLElement | null = null;
let nextBlindsDisplay: HTMLElement | null = null;
let display: HTMLElement | null = null;
let wakeLockMessage: HTMLElement | null = null;
let wakeLockMessageText: HTMLElement | null = null;
let wakeLockCloseButton: HTMLButtonElement | null = null;
let wakeLockEnableButton: HTMLButtonElement | null = null;
let blindsStructureModal: HTMLElement | null = null;
let blindsStructureList: HTMLElement | null = null;
let startButton: HTMLButtonElement | null = null;
let startIcon: HTMLImageElement | null = null;
let prevLevelButton: HTMLButtonElement | null = null;
let nextLevelButton: HTMLButtonElement | null = null;
let timerPageElement: HTMLElement | null = null;
let timerSelector: HTMLSelectElement | null = null;
let lastSavedRunningState = '';
let leagueId = '';
let currentTimerId = '';
let warningSpeechLevel = 0;
let preferredWarningVoice: SpeechSynthesisVoice | null = null;
let wakeLock: WakeLockSentinel | null = null;
let wakeLockListenerInitialized = false;
let wakeLockMessageDismissed = false;
let wakeLockRequestFailed = false;
let speechUnlocked = false;
let restoredRunningTimer = false;
let needsRunningConfirmation = false;
let interruptSpeechSequence = 0;
const pendingSpeechMessages: Array<{ message: string; options: { interrupt?: boolean } }> = [];

export function initTimer(container: HTMLElement) {
    setDefaults(container);
    loadPreferredWarningVoice();
    initWakeLockListener();

    roundDisplay = container.querySelector<HTMLElement>('[data-timer-round]');
    blindsDisplay = container.querySelector<HTMLElement>('[data-timer-blinds]');
    nextBlindsDisplay = container.querySelector<HTMLElement>('[data-timer-next-blinds]');
    display = container.querySelector<HTMLElement>('[data-timer-display]');
    wakeLockMessage = container.querySelector<HTMLElement>('[data-timer-wake-lock-message]');
    wakeLockMessageText = container.querySelector<HTMLElement>('[data-timer-wake-lock-text]');
    wakeLockCloseButton = container.querySelector<HTMLButtonElement>('[data-timer-wake-lock-close]');
    wakeLockEnableButton = container.querySelector<HTMLButtonElement>('[data-timer-wake-lock-enable]');
    blindsStructureModal = container.querySelector<HTMLElement>('[data-timer-blinds-structure-modal]');
    blindsStructureList = container.querySelector<HTMLElement>('[data-timer-blinds-structure-list]');
    startButton = container.querySelector<HTMLButtonElement>('[data-timer-start]');
    startIcon = container.querySelector<HTMLImageElement>('[data-timer-start-icon]');
    prevLevelButton = container.querySelector<HTMLButtonElement>('[data-timer-prev-level]');
    nextLevelButton = container.querySelector<HTMLButtonElement>('[data-timer-next-level]');
    timerSelector = container.querySelector<HTMLSelectElement>('#select-timer');
    const resetRoundButton = container.querySelector<HTMLButtonElement>('[data-timer-reset-round]');
    const resetAllButton = container.querySelector<HTMLButtonElement>('[data-timer-reset-all]');
    const openBlindsStructureButton = container.querySelector<HTMLButtonElement>('[data-timer-blinds-structure-open]');
    const closeBlindsStructureButton = container.querySelector<HTMLButtonElement>('[data-timer-blinds-structure-close]');

    if (!roundDisplay || !blindsDisplay || !nextBlindsDisplay || !display || !startButton || !startIcon || !prevLevelButton || !nextLevelButton || !resetRoundButton || !resetAllButton) {
        return;
    }

    startButton.addEventListener('click', toggleTimer);
    display.addEventListener('click', toggleTimer);
    display.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        toggleTimer();
    });

    prevLevelButton.addEventListener('click', prevLevel);
    nextLevelButton.addEventListener('click', () => nextLevel({ interruptSpeech: true }));
    resetRoundButton.addEventListener('click', resetRound);
    resetAllButton.addEventListener('click', resetAll);
    openBlindsStructureButton?.addEventListener('click', openBlindsStructure);
    closeBlindsStructureButton?.addEventListener('click', closeBlindsStructure);
    blindsStructureModal?.addEventListener('click', closeBlindsStructureOnBackdrop);
    wakeLockEnableButton?.addEventListener('click', enableTimerFromPopup);
    wakeLockCloseButton?.addEventListener('click', closeWakeLockMessage);
    timerSelector?.addEventListener('change', changeTimer);
    timerPageElement?.addEventListener(roundChangedEventName, event => {
        const detail = (event as CustomEvent<{ round: number; interruptSpeech?: boolean }>).detail;
        speakMessage(getLevelChangedSpeech(detail.round), { interrupt: Boolean(detail.interruptSpeech) });
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
    if (!timerSelector || !timerPageElement?.dataset.timerLeagueId) {
        return;
    }

    const selectedTimerId = timerSelector.value;

    resetAll();
    resetRuntimeState();
    saveLeagueTimerState({
        selectedTimerId,
        timerId: selectedTimerId
    });

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('league_id', leagueId);
    urlParams.set('timer_id', selectedTimerId);
    router(window.location.pathname, urlParams.toString(), { type: 'reload' });
}

function updateDisplay() {
    if (timerId) {
        remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    }

    if (display) {
        display.textContent = formatTime(remaining);
        display.classList.toggle('timer-display--warning', remaining <= 60);
        display.classList.toggle('timer-display--paused', !timerId);
        display.setAttribute('aria-label', timerId ? 'Pause timer' : 'Start timer');
    }

    if (prevLevelButton) {
        prevLevelButton.disabled = level === 1;
    }

    if (nextLevelButton) {
        nextLevelButton.disabled = !hasNextLevel();
    }

    updateWakeLockSupportMessage();
}

function updateLevelDisplay() {
    if (roundDisplay) {
        roundDisplay.textContent = `Level ${level}`;
    }
}

function updateBlindsDisplay() {
    if (!blindsDisplay) {
        return;
    }

    const blindValuesLabel = getBlindValuesLabel();
    blindsDisplay.textContent = blindValuesLabel;
    blindsDisplay.style.setProperty('--timer-blinds-font-size', getBlindsFontSize(blindValuesLabel));
}

function updateNextBlindsDisplay() {
    if (nextBlindsDisplay) {
        nextBlindsDisplay.textContent = hasNextLevel() ? `Next level: ${getBlindValuesLabel(level + 1)}` : '';
    }
}

function isTournamentStart() {
    return level === 1 && remaining === duration;
}

function toggleTimer() {
    if (timerId) {
        stop();
        return;
    }

    const shouldAnnounceTournamentStart = isTournamentStart();
    unlockSpeech();

    if (remaining === 0) {
        remaining = duration;
    }

    endTime = Date.now() + (remaining * 1000);
    setRunningState();
    timerId = window.setInterval(tick, 250);
    syncRunningSideEffects();
    if (shouldAnnounceTournamentStart) {
        speakMessage(getTournamentStartSpeech(), { interrupt: false });
    }
    tick();
}

function renderBlindsStructure() {
    if (!blindsStructureList) {
        return;
    }

    blindsStructureList.replaceChildren();
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
    blinds.forEach((smallBlind, index) => {
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
    blindsStructureList.append(table);
}

function openBlindsStructure() {
    renderBlindsStructure();

    if (blindsStructureModal) {
        blindsStructureModal.hidden = false;
    }
}

function closeBlindsStructure() {
    if (blindsStructureModal) {
        blindsStructureModal.hidden = true;
    }
}

function closeBlindsStructureOnBackdrop(event: MouseEvent) {
    if (event.target === blindsStructureModal) {
        closeBlindsStructure();
    }
}

function stop() {
    if (timerId) {
        clearTimerInterval();
    }

    setPausedState();
    releaseWakeLock();
    restoredRunningTimer = false;
    needsRunningConfirmation = false;
    pendingSpeechMessages.splice(0);
    updateWakeLockSupportMessage();
    updateDisplay();
    saveState();
}

function clearTimerInterval() {
    if (!timerId) {
        return;
    }

    window.clearInterval(timerId);
    timerId = undefined;
}

function syncRunningSideEffects() {
    updateWakeLockSupportMessage();

    if (!timerId) {
        return;
    }

    setRunningState();
    void requestWakeLock();
    updateWakeLockSupportMessage();
}

function tick() {
    const previousRemaining = remaining;
    remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    speakWarningIfNeeded(previousRemaining);

    if (remaining === 0) {
        nextLevel({ resetTimer: true });
        return;
    }

    updateDisplay();
    saveRunningState();
}

function nextLevel(options: { resetTimer?: boolean; interruptSpeech?: boolean } = {}) {
    const wasRunning = Boolean(timerId);

    if (!hasNextLevel()) {
        if (options.resetTimer) {
            remaining = duration;
            warningSpeechLevel = 0;

            if (wasRunning) {
                endTime = Date.now() + (duration * 1000);
                setRunningState();
            }
        }

        updateDisplay();
        saveState();
        return;
    }

    const previousLevel = level;
    level++;

    if (options.resetTimer) {
        remaining = duration;
        warningSpeechLevel = 0;
    }

    if (wasRunning && options.resetTimer) {
        endTime = Date.now() + (duration * 1000);
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
    if (level === 1) {
        return;
    }

    const wasRunning = Boolean(timerId);
    const previousLevel = level;
    level--;
    warningSpeechLevel = 0;

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
    remaining = duration;
    warningSpeechLevel = 0;
    updateDisplay();
    saveState();
}

function resetAll() {
    stop();
    duration = defaultDuration;
    remaining = duration;
    level = 1;
    warningSpeechLevel = 0;
    updateLevelDisplay();
    updateBlindsDisplay();
    updateNextBlindsDisplay();
    updateDisplay();
    saveState();
}

function setRunningState() {
    if (startIcon) {
        startIcon.src = '/images/pause.svg';
    }

    if (startButton) {
        startButton.setAttribute('aria-label', 'Pause timer');
    }

    document.body.classList.add('fullscreen');
}

function setPausedState() {
    if (startIcon) {
        startIcon.src = '/images/play.svg';
    }

    if (startButton) {
        startButton.setAttribute('aria-label', 'Start timer');
    }

    document.body.classList.remove('fullscreen');
}

function initWakeLockListener() {
    if (wakeLockListenerInitialized) {
        return;
    }

    wakeLockListenerInitialized = true;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && timerId) {
            void requestWakeLock();
        }
    });
}

function updateWakeLockSupportMessage() {
    if (!wakeLockMessage) {
        return;
    }

    const supportsWakeLock = hasWakeLockSupport();
    const needsAudioGesture = Boolean(timerId && !speechUnlocked && (restoredRunningTimer || pendingSpeechMessages.length > 0));
    const needsWakeLockGesture = Boolean(timerId && supportsWakeLock && !wakeLock && wakeLockRequestFailed);
    const shouldShow = !wakeLockMessageDismissed && (needsRunningConfirmation || !supportsWakeLock || needsWakeLockGesture || needsAudioGesture);

    wakeLockMessage.hidden = !shouldShow;

    if (wakeLockMessageText) {
        wakeLockMessageText.textContent = getTimerPermissionMessage(supportsWakeLock, needsAudioGesture, needsWakeLockGesture);
    }

    if (wakeLockEnableButton) {
        const hasAction = needsRunningConfirmation || needsAudioGesture || (supportsWakeLock && Boolean(timerId && !wakeLock));
        wakeLockEnableButton.hidden = !hasAction;
        wakeLockEnableButton.textContent = getTimerPermissionButtonLabel(supportsWakeLock, needsAudioGesture, needsWakeLockGesture);
    }

    if (wakeLockCloseButton) {
        wakeLockCloseButton.textContent = needsRunningConfirmation ? 'Stop timer' : 'Close';
    }
}

function getTimerPermissionMessage(supportsWakeLock: boolean, needsAudioGesture: boolean, needsWakeLockGesture: boolean) {
    if (needsRunningConfirmation) {
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
    if (needsRunningConfirmation) {
        return 'Keep running';
    }

    if (needsAudioGesture && supportsWakeLock) {
        return 'Enable timer';
    }

    return needsAudioGesture ? 'Enable sound' : 'Keep screen awake';
}

function closeWakeLockMessage() {
    if (needsRunningConfirmation) {
        needsRunningConfirmation = false;
        stop();
        return;
    }

    wakeLockMessageDismissed = true;
    if (wakeLockMessage) {
        wakeLockMessage.hidden = true;
    }
}

async function enableTimerFromPopup() {
    wakeLockMessageDismissed = false;
    needsRunningConfirmation = false;
    unlockSpeech();

    if (timerId && hasWakeLockSupport()) {
        await requestWakeLock();
    }

    updateWakeLockSupportMessage();
}

async function requestWakeLock() {
    if (wakeLock) {
        wakeLockRequestFailed = false;
        updateWakeLockSupportMessage();
        return true;
    }

    if (!hasWakeLockSupport()) {
        wakeLockRequestFailed = true;
        updateWakeLockSupportMessage();
        return false;
    }

    const wakeLockNavigator = navigator as Navigator & {
        wakeLock?: {
            request: (type: 'screen') => Promise<WakeLockSentinel>;
        };
    };

    try {
        wakeLock = await wakeLockNavigator.wakeLock!.request('screen');
        wakeLockRequestFailed = false;
        wakeLock.addEventListener('release', () => {
            wakeLock = null;
            if (timerId) {
                updateWakeLockSupportMessage();
            }
        });
        updateWakeLockSupportMessage();
        return true;
    } catch {
        wakeLock = null;
        wakeLockRequestFailed = true;
        updateWakeLockSupportMessage();
        return false;
    }
}

function hasWakeLockSupport() {
    return 'wakeLock' in navigator;
}

async function releaseWakeLock() {
    if (!wakeLock) {
        return;
    }

    const currentWakeLock = wakeLock;
    wakeLock = null;

    try {
        await currentWakeLock.release();
    } catch {
        // Ignore wake lock release failures; the browser may have already released it.
    }

    updateWakeLockSupportMessage();
}

function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function getBlindValuesLabel(round = level) {
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
    return `Tournament Starting, ${getLevelChangedSpeech(level)}`;
}

function getSmallBlind(round = level) {
    return blinds[round - 1] ?? blinds[blinds.length - 1] ?? fallbackBlinds[0];
}

function speakWarningIfNeeded(previousRemaining: number) {
    if (
        remaining !== 60
        || previousRemaining < 60
        || warningSpeechLevel === level
    ) {
        return;
    }

    warningSpeechLevel = level;
    speakMessage('One minute remaining', { interrupt: true });
    saveState();
}

function speakMessage(message: string, options: { interrupt?: boolean } = {}) {
    if (!window.speechSynthesis) {
        return;
    }

    if (!speechUnlocked) {
        if (options.interrupt) {
            // Keep only the latest interrupting announcement, e.g. rapid level skips.
            for (let index = pendingSpeechMessages.length - 1; index >= 0; index--) {
                if (pendingSpeechMessages[index].options.interrupt) {
                    pendingSpeechMessages.splice(index, 1);
                }
            }
        }

        pendingSpeechMessages.push({ message, options });
        updateWakeLockSupportMessage();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    const voice = preferredWarningVoice ?? getPreferredWarningVoice();

    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
    }

    window.speechSynthesis.resume();

    if (options.interrupt && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
        const sequence = ++interruptSpeechSequence;
        window.speechSynthesis.cancel();
        window.setTimeout(() => {
            // cancel() is asynchronous in some browsers; ignore stale scheduled announcements.
            if (sequence === interruptSpeechSequence) {
                window.speechSynthesis.speak(utterance);
            }
        }, 0);
        return;
    }

    window.speechSynthesis.speak(utterance);
}

function unlockSpeech() {
    if (speechUnlocked) {
        return;
    }

    speechUnlocked = true;
    updateWakeLockSupportMessage();
    flushPendingSpeechMessages();
}

function flushPendingSpeechMessages() {
    const messages = pendingSpeechMessages.splice(0);
    messages.forEach(item => speakMessage(item.message, item.options));
}

function loadPreferredWarningVoice() {
    if (!window.speechSynthesis) {
        return;
    }

    preferredWarningVoice = getPreferredWarningVoice();
    window.speechSynthesis.onvoiceschanged = () => {
        preferredWarningVoice = getPreferredWarningVoice();
    };
}

function getPreferredWarningVoice() {
    const voices = window.speechSynthesis.getVoices();
    const femaleVoiceNames = [
        'samantha',
        'victoria',
        'karen',
        'moira',
        'tessa',
        'fiona',
        'zira',
        'susan',
        'google uk english female',
        'microsoft aria',
        'microsoft jenny'
    ];

    return voices.find(voice => (
        femaleVoiceNames.some(name => voice.name.toLowerCase().includes(name))
    )) ?? voices.find(voice => (
        voice.lang.toLowerCase().startsWith('en')
        && voice.name.toLowerCase().includes('female')
    )) ?? null;
}

function hasNextLevel() {
    return level < getMaxLevel();
}

function getMaxLevel() {
    return Math.max(1, blinds.length);
}

function dispatchRoundChanged(previousLevel: number, options: { interruptSpeech?: boolean } = {}) {
    if (previousLevel === level) {
        return;
    }

    timerPageElement?.dispatchEvent(new CustomEvent(roundChangedEventName, {
        detail: {
            previousRound: previousLevel,
            round: level,
            interruptSpeech: options.interruptSpeech
        }
    }));
}

function saveState() {
    lastSavedRunningState = getRunningStateKey();

    const state = {
        selectedTimerId: currentTimerId,
        timerId: currentTimerId,
        remaining,
        level,
        endTime,
        isRunning: Boolean(timerId),
        warningSpeechLevel
    };

    saveLeagueTimerState(state);
}

function saveRunningState() {
    const runningState = getRunningStateKey();
    if (runningState === lastSavedRunningState) {
        return;
    }

    saveState();
}

function getRunningStateKey() {
    return `${level}:${remaining}:${endTime}:${Boolean(timerId)}`;
}

function restoreState() {
    const state = loadLeagueTimerState();
    if (!state || state.timerId !== currentTimerId) {
        return;
    }

    try {
        level = sanitizeLevel(state.level);
        warningSpeechLevel = sanitizeNumber(state.warningSpeechLevel, 0);

        if (state.isRunning && typeof state.endTime === 'number') {
            endTime = state.endTime;
            remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            restoredRunningTimer = true;
            needsRunningConfirmation = true;

            if (remaining === 0) {
                catchUpRunningTimer();
            }

            if (!timerId) {
                timerId = window.setInterval(tick, 250);
            }

            return;
        }

        remaining = sanitizeNumber(state.remaining, duration);
    } catch {
        resetRuntimeState();
        duration = defaultDuration;
        remaining = defaultDuration;
        level = 1;
        endTime = 0;
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
    const durationMs = duration * 1000;
    const elapsedSinceRoundEnd = Date.now() - endTime;
    const completedRounds = Math.floor(elapsedSinceRoundEnd / durationMs) + 1;
    const elapsedInCurrentRound = elapsedSinceRoundEnd % durationMs;

    level = Math.min(getMaxLevel(), level + completedRounds);
    remaining = Math.ceil((durationMs - elapsedInCurrentRound) / 1000);
    endTime = Date.now() + (remaining * 1000);
}

function resetRuntimeState() {
    clearTimerInterval();
    endTime = 0;
    warningSpeechLevel = 0;
    restoredRunningTimer = false;
    needsRunningConfirmation = false;
    pendingSpeechMessages.splice(0);
    lastSavedRunningState = '';
    void releaseWakeLock();
}

function setDefaults(container: HTMLElement) {
    removeLegacyTimerStateKeys();
    timerPageElement = container.querySelector<HTMLElement>('[data-timer-page]');
    leagueId = timerPageElement?.dataset.timerLeagueId || '';
    currentTimerId = timerPageElement?.dataset.timerId || '';
    defaultDuration = getPositiveNumber(
        timerPageElement?.dataset.timerDefaultDuration,
        fallbackDefaultDuration);
    blinds = getBlinds(timerPageElement?.dataset.timerSmallBlinds);

    duration = defaultDuration;
    remaining = defaultDuration;
    level = 1;
    endTime = 0;
    warningSpeechLevel = 0;

    const savedState = loadLeagueTimerState();
    if (currentTimerId && savedState?.timerId !== currentTimerId) {
        saveLeagueTimerState({
            selectedTimerId: currentTimerId,
            timerId: currentTimerId
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
    if (!leagueId) {
        return null;
    }

    return loadTimerState().leagues?.[leagueId] ?? null;
}

function saveLeagueTimerState(state: SavedTimerState) {
    if (!leagueId) {
        return;
    }

    const timerState = loadTimerState();
    timerState.leagues = timerState.leagues || {};
    timerState.leagues[leagueId] = state;
    window.localStorage.setItem(timerStateKey, JSON.stringify(timerState));
}

function removeLeagueTimerState() {
    if (!leagueId) {
        return;
    }

    const timerState = loadTimerState();
    if (!timerState.leagues?.[leagueId]) {
        return;
    }

    delete timerState.leagues[leagueId];
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
