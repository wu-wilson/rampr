import React from 'react';

interface RamprMarkProps {
  /** Edge length of the square mark in pixels. */
  size?: number;
  /** Extra classes applied to the wrapper (e.g. spacing). */
  className?: string;
}

/**
 * The rampr logo mark: a green tile with a large quarter-circle notch bitten out of its
 * top-left corner and a small dark-green dot floating in the notch — an upward ramp motif.
 * Built from a radial-gradient so it scales cleanly with `size`; colors come from the brand tokens.
 * @param props - Optional pixel size and extra wrapper classes
 * @returns The logo mark
 */
export const RamprMark: React.FC<RamprMarkProps> = ({ size = 24, className }) => (
  <span
    className={className}
    role="img"
    aria-label="rampr"
    style={{ position: 'relative', display: 'inline-block', width: `${size}px`, height: `${size}px` }}
  >
    <span
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle ${size * 1.107}px at 0 0, transparent 0 ${size * 0.839}px, rgb(var(--brand)) ${size * 0.857}px)`,
      }}
    />
    <span
      style={{
        position: 'absolute',
        left: `${size * 0.286}px`,
        top: `${size * 0.286}px`,
        width: `${size * 0.214}px`,
        height: `${size * 0.214}px`,
        borderRadius: '99px',
        background: 'rgb(var(--brand-dark))',
      }}
    />
  </span>
);
