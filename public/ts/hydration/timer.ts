import { router } from '../lib/router';

const fallbackDefaultDuration = 15 * 60;
const fallbackBlinds = [5, 10, 20, 40, 80, 150, 300];
const storageKeyPrefix = 'timerState';
const roundChangedEventName = 'timer:round-change';

type WakeLockSentinel = {
    release: () => Promise<void>;
    addEventListener: (type: 'release', listener: () => void) => void;
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
let storageKey = storageKeyPrefix;
let warningSpeechLevel = 0;
let preferredWarningVoice: SpeechSynthesisVoice | null = null;
let wakeLock: WakeLockSentinel | null = null;
let wakeLockListenerInitialized = false;
let wakeLockMessageDismissed = false;
let wakeLockRequestFailed = false;
let speechUnlocked = false;
let restoredRunningTimer = false;
let needsRunningConfirmation = false;
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

    startButton.addEventListener('click', () => {
        if (timerId) {
            stop();
            return;
        }

        unlockSpeech();
        const shouldAnnounceTournamentStart = isTournamentStart();

        if (remaining === 0) {
            remaining = duration;
        }

        endTime = Date.now() + (remaining * 1000);
        setRunningState();
        timerId = window.setInterval(tick, 250);
        syncRunningSideEffects();
        if (shouldAnnounceTournamentStart) {
            speakMessage(`Tournament Starting, Level ${level}`, { interrupt: false });
        }
        tick();
    });

    prevLevelButton.addEventListener('click', prevLevel);
    nextLevelButton.addEventListener('click', () => nextLevel());
    resetRoundButton.addEventListener('click', resetRound);
    resetAllButton.addEventListener('click', resetAll);
    openBlindsStructureButton?.addEventListener('click', openBlindsStructure);
    closeBlindsStructureButton?.addEventListener('click', closeBlindsStructure);
    wakeLockEnableButton?.addEventListener('click', enableTimerFromPopup);
    wakeLockCloseButton?.addEventListener('click', closeWakeLockMessage);
    timerSelector?.addEventListener('change', changeTimer);
    timerPageElement?.addEventListener(roundChangedEventName, event => {
        const round = (event as CustomEvent<{ round: number }>).detail.round;
        speakMessage(`Level ${round}, Blinds changed!`, { interrupt: false });
    });

    restoreState();
    renderBlindsStructure();
    updateDisplay();
    syncRunningSideEffects();
    updateWakeLockSupportMessage();
}

function changeTimer() {
    if (!timerSelector || !timerPageElement?.dataset.timerLeagueId) {
        return;
    }

    resetAll();
    window.localStorage.removeItem(getStorageKey(timerPageElement.dataset.timerLeagueId));

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('league_id', timerPageElement.dataset.timerLeagueId);
    urlParams.set('timer_id', timerSelector.value);
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
    }

    if (roundDisplay) {
        roundDisplay.textContent = `Level ${level}`;
    }

    if (blindsDisplay) {
        blindsDisplay.textContent = getBlindValuesLabel();
    }

    if (nextBlindsDisplay) {
        nextBlindsDisplay.textContent = hasNextLevel() ? `Next blinds: ${getBlindValuesLabel(level + 1)}` : '';
    }

    if (prevLevelButton) {
        prevLevelButton.disabled = level === 1;
    }

    if (nextLevelButton) {
        nextLevelButton.disabled = !hasNextLevel();
    }

    updateWakeLockSupportMessage();
}

function isTournamentStart() {
    return level === 1 && remaining === duration;
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

function stop() {
    if (timerId) {
        window.clearInterval(timerId);
        timerId = undefined;
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

function nextLevel(options: { resetTimer?: boolean } = {}) {
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

    updateDisplay();
    dispatchRoundChanged(previousLevel);
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

    updateDisplay();
    dispatchRoundChanged(previousLevel);
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
}

function setPausedState() {
    if (startIcon) {
        startIcon.src = '/images/play.svg';
    }

    if (startButton) {
        startButton.setAttribute('aria-label', 'Start timer');
    }
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
    return `${smallBlind} / ${bigBlind}`;
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

    if (options.interrupt && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
        window.speechSynthesis.cancel();
        window.setTimeout(() => window.speechSynthesis.speak(utterance), 0);
        return;
    }

    window.speechSynthesis.speak(utterance);
}

function unlockSpeech() {
    if (speechUnlocked) {
        return;
    }

    speechUnlocked = true;
    primeSpeech();
    updateWakeLockSupportMessage();
    flushPendingSpeechMessages();
}

function primeSpeech() {
    if (!window.speechSynthesis) {
        return;
    }

    const utterance = new SpeechSynthesisUtterance(' ');
    const voice = preferredWarningVoice ?? getPreferredWarningVoice();

    utterance.volume = 0;

    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
    }

    window.speechSynthesis.speak(utterance);
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

function dispatchRoundChanged(previousLevel: number) {
    if (previousLevel === level) {
        return;
    }

    timerPageElement?.dispatchEvent(new CustomEvent(roundChangedEventName, {
        detail: {
            previousRound: previousLevel,
            round: level
        }
    }));
}

function saveState() {
    lastSavedRunningState = getRunningStateKey();

    const state = {
        duration,
        remaining,
        level,
        endTime,
        isRunning: Boolean(timerId),
        warningSpeechLevel,
        configKey: getConfigKey()
    };

    window.localStorage.setItem(storageKey, JSON.stringify(state));
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
    const rawState = window.localStorage.getItem(storageKey);
    if (!rawState) {
        return;
    }

    try {
        const state = JSON.parse(rawState);
        if (state.configKey !== getConfigKey()) {
            window.localStorage.removeItem(storageKey);
            duration = defaultDuration;
            remaining = defaultDuration;
            level = 1;
            endTime = 0;
            return;
        }

        duration = sanitizeNumber(state.duration, defaultDuration);
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
        duration = defaultDuration;
        remaining = defaultDuration;
        level = 1;
        endTime = 0;
        window.localStorage.removeItem(storageKey);
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

function setDefaults(container: HTMLElement) {
    timerPageElement = container.querySelector<HTMLElement>('[data-timer-page]');
    storageKey = getStorageKey(timerPageElement?.dataset.timerLeagueId);
    defaultDuration = getPositiveNumber(
        timerPageElement?.dataset.timerDefaultDuration,
        fallbackDefaultDuration);
    blinds = getBlinds(timerPageElement?.dataset.timerSmallBlinds);
    if (!window.localStorage.getItem(storageKey)) {
        duration = defaultDuration;
        remaining = defaultDuration;
        level = 1;
    }
}

function getStorageKey(leagueId?: string) {
    return leagueId
        ? `${storageKeyPrefix}:${leagueId}`
        : storageKeyPrefix;
}

function getPositiveNumber(value: string | undefined, fallback: number) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0
        ? parsedValue
        : fallback;
}

function getConfigKey() {
    return `${defaultDuration}:${blinds.join(',')}`;
}

function getBlinds(value: string | undefined) {
    const parsedBlinds = String(value || '')
        .split(',')
        .map(item => Number(item.trim()))
        .filter(item => Number.isFinite(item) && item > 0);

    return parsedBlinds.length > 0 ? parsedBlinds : fallbackBlinds;
}
