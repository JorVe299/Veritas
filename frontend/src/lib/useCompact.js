import { useSyncExternalStore } from 'react';

// Mirrors the 900px breakpoint in App.css: the chrome folds into one block below it
const QUERY = '(max-width: 900px)';

const media = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY)
    : null);

function subscribe(onChange) {
    const mq = media();
    if (!mq) return () => {};
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
}

const isCompact = () => media()?.matches ?? false;

/** True while the top bar has to collapse its secondary actions into one menu */
export default function useCompact() {
    return useSyncExternalStore(subscribe, isCompact, () => false);
}
