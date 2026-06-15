type SpeechOptions = {
    interrupt?: boolean;
};

type TimerSpeechConfig = {
    isTimerRunning: () => boolean;
    onStateChange: () => void;
};

const pendingSpeechMessages: Array<{ message: string; options: SpeechOptions }> = [];

let speechUnlocked = false;
let speechReactivationRequired = false;
let interruptSpeechSequence = 0;
let lifecycleListenerInitialized = false;
let preferredWarningVoice: SpeechSynthesisVoice | null = null;
let timerSpeechConfig: TimerSpeechConfig | null = null;

export function initTimerSpeech(config: TimerSpeechConfig) {
    timerSpeechConfig = config;
    loadPreferredWarningVoice();
    initLifecycleListeners();
}

export function speakTimerMessage(message: string, options: SpeechOptions = {}) {
    if (!window.speechSynthesis) {
        return;
    }

    if (!speechUnlocked || speechReactivationRequired) {
        queueSpeechMessage(message, options);
        notifyStateChange();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    const voice = preferredWarningVoice ?? getPreferredWarningVoice();
    let speechStarted = false;
    let speechSettled = false;

    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
    }

    utterance.onstart = () => {
        speechStarted = true;
        speechReactivationRequired = false;
        notifyStateChange();
    };
    utterance.onend = () => {
        speechSettled = true;
    };
    utterance.onerror = () => {
        speechSettled = true;
        handleSpeechPlaybackFailure(message, options);
    };

    window.speechSynthesis.resume();

    if (options.interrupt && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
        const sequence = ++interruptSpeechSequence;
        window.speechSynthesis.cancel();
        window.setTimeout(() => {
            if (sequence === interruptSpeechSequence) {
                window.speechSynthesis.speak(utterance);
            }
        }, 0);
        return;
    }

    window.speechSynthesis.speak(utterance);
    window.setTimeout(() => {
        if (speechSettled || speechStarted || document.visibilityState !== 'visible') {
            return;
        }

        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            handleSpeechPlaybackFailure(message, options);
        }
    }, 1500);
}

export function unlockTimerSpeech() {
    if (speechUnlocked && !speechReactivationRequired) {
        return;
    }

    speechUnlocked = true;
    speechReactivationRequired = false;

    try {
        window.speechSynthesis?.cancel();
        window.speechSynthesis?.resume();
    } catch {
        // Ignore recovery failures and let queued speech try again.
    }

    notifyStateChange();
    flushPendingSpeechMessages();
}

export function resetTimerSpeech() {
    speechReactivationRequired = false;
    pendingSpeechMessages.splice(0);
}

export function isTimerSpeechUnlocked() {
    return speechUnlocked;
}

export function isTimerSpeechReactivationRequired() {
    return speechReactivationRequired;
}

export function getPendingTimerSpeechCount() {
    return pendingSpeechMessages.length;
}

function initLifecycleListeners() {
    if (lifecycleListenerInitialized) {
        return;
    }

    lifecycleListenerInitialized = true;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            handlePageHidden();
            return;
        }

        if (document.visibilityState === 'visible' && timerSpeechConfig?.isTimerRunning()) {
            handlePageVisible();
        }
    });
    window.addEventListener('pageshow', () => {
        if (timerSpeechConfig?.isTimerRunning()) {
            handlePageVisible();
        }
    });
}

function handlePageHidden() {
    if (!window.speechSynthesis) {
        return;
    }

    try {
        window.speechSynthesis.cancel();
    } catch {
        // Ignore cancellation failures during page suspension.
    }
}

function handlePageVisible() {
    if (!window.speechSynthesis || !timerSpeechConfig?.isTimerRunning()) {
        return;
    }

    preferredWarningVoice = getPreferredWarningVoice();

    try {
        window.speechSynthesis.resume();
    } catch {
        // Ignore resume failures and fall back to prompting on the next announcement.
    }
}

function queueSpeechMessage(message: string, options: SpeechOptions) {
    if (options.interrupt) {
        for (let index = pendingSpeechMessages.length - 1; index >= 0; index--) {
            if (pendingSpeechMessages[index].options.interrupt) {
                pendingSpeechMessages.splice(index, 1);
            }
        }
    }

    pendingSpeechMessages.push({ message, options });
}

function flushPendingSpeechMessages() {
    const messages = pendingSpeechMessages.splice(0);
    messages.forEach(item => speakTimerMessage(item.message, item.options));
}

function handleSpeechPlaybackFailure(message: string, options: SpeechOptions) {
    if (!timerSpeechConfig?.isTimerRunning()) {
        return;
    }

    queueSpeechMessage(message, options);
    speechReactivationRequired = true;
    speechUnlocked = false;

    try {
        window.speechSynthesis.cancel();
    } catch {
        // Ignore cancellation failures while recovering speech playback.
    }

    notifyStateChange();
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

function notifyStateChange() {
    timerSpeechConfig?.onStateChange();
}
