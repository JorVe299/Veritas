import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import Icon from './Icon';

/** Section tab bar with arrow-key navigation; shared by the citizen and server areas */
export default function CitizenTabs({ tabs, activeId, onSelect, label = 'Citizen sections' }) {
    const listRef = useRef(null);

    // The underline is one element behind the strip, so it can travel between tabs
    const place = useCallback(() => {
        const list = listRef.current;
        const active = list?.querySelector('[aria-selected="true"]');
        if (!list || !active) return;
        list.style.setProperty('--tab-x', `${active.offsetLeft}px`);
        list.style.setProperty('--tab-w', `${active.offsetWidth}px`);
    }, []);

    useLayoutEffect(() => {
        place();
        const list = listRef.current;
        const active = list?.querySelector('[aria-selected="true"]');
        if (!list || !active) return;
        // Horizontal only: scrollIntoView would drag the whole page past the billboard
        const hidden = active.offsetLeft < list.scrollLeft
            || active.offsetLeft + active.offsetWidth > list.scrollLeft + list.clientWidth;
        if (hidden) {
            list.scrollLeft = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
        }
    }, [place, activeId, tabs]);

    useEffect(() => {
        const list = listRef.current;
        if (!list || typeof ResizeObserver !== 'function') return undefined;
        const observer = new ResizeObserver(place);
        observer.observe(list);
        return () => observer.disconnect();
    }, [place]);

    const handleKeyDown = (event) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (step === 0) return;

        event.preventDefault();
        const index = tabs.findIndex((tab) => tab.id === activeId);
        const next = tabs[(index + step + tabs.length) % tabs.length];
        onSelect(next.id);
        // Roving tabindex: focus must follow the selection
        listRef.current
            ?.querySelector(`[data-tab="${next.id}"]`)
            ?.focus();
    };

    return (
        <div className="tabs">
            <div
                className="tabs__list"
                role="tablist"
                aria-label={label}
                ref={listRef}
                onKeyDown={handleKeyDown}
            >
                {tabs.map((tab) => {
                    const active = tab.id === activeId;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            data-tab={tab.id}
                            id={`tab-${tab.id}`}
                            aria-selected={active}
                            aria-controls={`tabpanel-${tab.id}`}
                            tabIndex={active ? 0 : -1}
                            className={`tab${active ? ' is-active' : ''}`}
                            onClick={() => onSelect(tab.id)}
                        >
                            <Icon name={tab.icon} size={16} className="tab__icon" />
                            <span className="tab__label">{tab.label}</span>

                            {/* Verified presence only: actions here apply at once */}
                            {tab.live && <span className="tab__live" aria-hidden="true" />}
                            {tab.live && <span className="u-sr">— citizen is on the server</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
