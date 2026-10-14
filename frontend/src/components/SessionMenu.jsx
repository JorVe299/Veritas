import { useEffect, useRef, useState } from 'react';

// Array.from, not split(''): keeps characters outside the BMP intact
function initialsOf(name) {
    const parts = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2);
    const letters = parts.map((part) => Array.from(part)[0] ?? '').join('');
    return letters ? letters.toUpperCase() : '?';
}

/**
 * Signed-in user with an inline sign-out: no dropdown for a single action
 * Compact: the bar has no room for four controls, so they fold behind the avatar
 */
export default function SessionMenu({
    user,
    roleLabel,
    signingOut,
    onSignOut,
    compact = false,
    showPermissions = false,
    onOpenPermissions,
    onOpenPortal,
}) {
    // Null or dead avatar URL (CDN down, image deleted): initials, never a broken image
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const toggleRef = useRef(null);

    const name = user?.globalName || user?.username || 'Signed in';
    // The bar truncates the name; the title carries it in full
    const fullName = user?.username && user.username !== name ? `${name} (${user.username})` : name;
    const avatarUrl = typeof user?.avatarUrl === 'string' && user.avatarUrl.startsWith('https://')
        ? user.avatarUrl
        : null;

    useEffect(() => {
        if (!open) return undefined;
        const onPointer = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key !== 'Escape') return;
            setOpen(false);
            toggleRef.current?.focus();
        };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    // The menu cannot survive a width change: it has no anchor in the wide bar
    const [wasCompact, setWasCompact] = useState(compact);
    if (wasCompact !== compact) {
        setWasCompact(compact);
        setOpen(false);
    }

    const avatar = avatarUrl && !avatarFailed ? (
        <img
            className="session__avatar"
            src={avatarUrl}
            alt=""
            width="28"
            height="28"
            referrerPolicy="no-referrer"
            onError={() => setAvatarFailed(true)}
        />
    ) : (
        <span className="session__avatar session__avatar--mark" aria-hidden="true">
            {initialsOf(name)}
        </span>
    );

    if (compact) {
        const run = (action) => () => {
            setOpen(false);
            action?.();
        };

        return (
            <div className="session session--menu" ref={rootRef}>
                <button
                    type="button"
                    className="session__toggle"
                    ref={toggleRef}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setOpen((was) => !was)}
                >
                    {avatar}
                    <span className="u-sr">{`Account menu — signed in as ${fullName}`}</span>
                </button>

                {open && (
                    <div className="session__pop" role="menu">
                        <div className="session__card">
                            <span className="session__name">{name}</span>
                            {roleLabel && <span className="session__role">{roleLabel}</span>}
                        </div>

                        {onOpenPortal && (
                            <button
                                type="button"
                                role="menuitem"
                                className="session__item"
                                onClick={run(onOpenPortal)}
                            >
                                Veritas ID
                            </button>
                        )}

                        {showPermissions && (
                            <button
                                type="button"
                                role="menuitem"
                                className="session__item"
                                onClick={run(onOpenPermissions)}
                            >
                                Permissions
                            </button>
                        )}

                        <button
                            type="button"
                            role="menuitem"
                            className="session__item"
                            onClick={run(onSignOut)}
                            disabled={signingOut}
                        >
                            {signingOut ? 'Signing out…' : 'Sign out'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="session">
            {avatar}

            {/* Role up front: limits are known before a control turns up disabled */}
            <span className="session__who">
                <span className="session__name" title={fullName}>{name}</span>
                {roleLabel && (
                    <span className="session__role" title={roleLabel}>{roleLabel}</span>
                )}
            </span>

            <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={onSignOut}
                disabled={signingOut}
            >
                {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
        </div>
    );
}
