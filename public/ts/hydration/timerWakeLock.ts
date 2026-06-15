type WakeLockSentinel = {
    release: () => Promise<void>;
    addEventListener: (type: 'release', listener: () => void) => void;
};

type TimerWakeLockConfig = {
    isTimerRunning: () => boolean;
    onStateChange: () => void;
};

let wakeLock: WakeLockSentinel | null = null;
let wakeLockRequestFailed = false;
let lifecycleListenerInitialized = false;
let timerWakeLockConfig: TimerWakeLockConfig | null = null;

export function initTimerWakeLock(config: TimerWakeLockConfig) {
    timerWakeLockConfig = config;
    initLifecycleListeners();
}

export async function requestTimerWakeLock() {
    if (wakeLock) {
        wakeLockRequestFailed = false;
        notifyStateChange();
        return true;
    }

    if (!hasTimerWakeLockSupport()) {
        wakeLockRequestFailed = true;
        notifyStateChange();
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
            if (timerWakeLockConfig?.isTimerRunning()) {
                notifyStateChange();
            }
        });
        notifyStateChange();
        return true;
    } catch {
        wakeLock = null;
        wakeLockRequestFailed = true;
        notifyStateChange();
        return false;
    }
}

export async function releaseTimerWakeLock() {
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

    notifyStateChange();
}

export function resetTimerWakeLock() {
    wakeLockRequestFailed = false;
}

export function hasTimerWakeLockSupport() {
    return 'wakeLock' in navigator;
}

export function hasActiveTimerWakeLock() {
    return Boolean(wakeLock);
}

export function hasTimerWakeLockRequestFailed() {
    return wakeLockRequestFailed;
}

function initLifecycleListeners() {
    if (lifecycleListenerInitialized) {
        return;
    }

    lifecycleListenerInitialized = true;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && timerWakeLockConfig?.isTimerRunning()) {
            void requestTimerWakeLock();
        }
    });
    window.addEventListener('pageshow', () => {
        if (timerWakeLockConfig?.isTimerRunning()) {
            void requestTimerWakeLock();
        }
    });
}

function notifyStateChange() {
    timerWakeLockConfig?.onStateChange();
}
