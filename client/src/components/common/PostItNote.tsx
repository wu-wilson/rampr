import React from 'react';

/** Slight per-note tilt so notes read as taped up by hand, not printed on a grid. */
const NOTE_TILT = ['-2deg', '1.6deg', '-1.2deg', '2.1deg'];
/** Per-note tape angle, varied so each strip looks torn and stuck on individually. */
const TAPE_TILT = ['-6deg', '5deg', '7deg', '-3.5deg'];

interface PostItNoteProps {
  /** Zero-based position in the cluster, picking the tilt and tape angle so notes look hand-placed. */
  index: number;
  children: React.ReactNode;
  /** Extra classes for the paper surface — typically padding and width. */
  className?: string;
}

/**
 * A warm-paper "post-it": a note lifted off the surface with a soft shadow, tilted a touch by hand,
 * and pinned under a translucent strip of torn tape. Chrome only — callers supply the note body.
 * @param props - The cluster index picking the tilt, the note body, and optional surface classes
 * @returns The taped note
 */
export const PostItNote: React.FC<PostItNoteProps> = ({ index, children, className }) => (
  <div
    className={`relative bg-raised shadow-[0_5px_16px_rgb(var(--ink)/0.11)] ${className ?? ''}`}
    style={{ transform: `rotate(${NOTE_TILT[index % NOTE_TILT.length]})` }}
  >
    <span
      className="pointer-events-none absolute h-[18px] w-14 bg-line-4/60"
      style={{
        left: '50%',
        top: '-8px',
        transform: `translateX(-50%) rotate(${TAPE_TILT[index % TAPE_TILT.length]})`,
        // Torn ends: fine zigzag on the short (left/right) edges (shallow teeth), roll edges straight.
        clipPath:
          'polygon(0% 0%, 100% 0%, 95% 12.5%, 100% 25%, 95% 37.5%, 100% 50%, 95% 62.5%, 100% 75%, 95% 87.5%, 100% 100%, 0% 100%, 5% 87.5%, 0% 75%, 5% 62.5%, 0% 50%, 5% 37.5%, 0% 25%, 5% 12.5%)',
      }}
      aria-hidden="true"
    />
    {children}
  </div>
);
