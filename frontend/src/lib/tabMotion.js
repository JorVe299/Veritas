/**
 * Which way a switch between two tabs (or areas) travels, for the entry animation
 * 0 when either id is unknown or they match: a plain fade, no sideways move
 */
export function tabDirection(tabs, fromId, toId) {
    const from = tabs.findIndex((tab) => tab.id === fromId);
    const to = tabs.findIndex((tab) => tab.id === toId);
    if (from < 0 || to < 0 || from === to) return 0;
    return to > from ? 1 : -1;
}

/** Ms a sheet keeps its closing class before unmounting; matches .sheet--closing */
export const SHEET_EXIT_MS = 160;

/** Reads the setting at call time: it can change while the panel is open */
export function motionReduced() {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
