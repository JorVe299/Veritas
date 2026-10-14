import { useEffect, useRef } from 'react';
import { formatCompact, formatCurrency, formatCurrencyCompact, formatMoney } from '../utils/format';

/**
 * Figure that must fit a box it does not control; never clipped: a cut number reads as another
 * Shortened from compactFrom up ("$1.23B"); exact value in the title and for screen readers
 * --fit-chars lets a .u-fit box shrink the type; mono digits make the char count a width
 */
export default function Amount({
    value,
    currency = true,
    compactFrom = Infinity,
    className,
    flash = false,
}) {
    const n = Number(value);
    const known = value !== null && value !== undefined && value !== '' && Number.isFinite(n);
    const compacted = known && Math.abs(n) >= compactFrom;

    const exact = currency ? formatCurrency(value) : (known ? formatMoney(n) : String(value ?? '—'));
    const shown = compacted
        ? (currency ? formatCurrencyCompact(n) : formatCompact(n))
        : (currency ? exact : String(value ?? '—'));

    const box = useRef(null);
    const seen = useRef(null);

    useEffect(() => {
        // flash: the figure confirms a write by marking which way it moved, then decaying
        if (!flash || !known) return;
        const previous = seen.current;
        seen.current = n;
        const node = box.current;
        // First value marks nothing: an initial read is not a change the user made
        if (previous === null || previous === n || !node) return;

        // Dropped, measured, re-set: a CSS animation does not replay while the name holds
        delete node.dataset.flash;
        node.getBoundingClientRect();
        node.dataset.flash = n > previous ? 'up' : 'down';
    }, [flash, known, n]);

    return (
        <span
            ref={box}
            className={className || undefined}
            style={{ '--fit-chars': shown.length }}
            title={compacted ? exact : undefined}
        >
            {compacted ? (
                <>
                    <span aria-hidden="true">{shown}</span>
                    <span className="u-sr">{exact}</span>
                </>
            ) : shown}
        </span>
    );
}
