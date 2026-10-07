import React from 'react';

import { TRANSITION } from '../../constants/animations';

interface ToggleGlyphProps {
  /** True while the menu is open, which turns the bars into an X. */
  open: boolean;
}

/**
 * The mobile menu toggle's glyph: three bars that morph into an X.
 * @param props - Whether the menu is open
 * @returns The glyph, hidden from assistive tech
 */
export const ToggleGlyph: React.FC<ToggleGlyphProps> = ({ open }) => {
  const bar = 'absolute left-0 h-[1.5px] w-full bg-current origin-center transition-transform';
  return (
    <span className="relative block h-[12px] w-[16px] shrink-0" aria-hidden="true">
      <span className={`${bar} top-0 ${open ? 'translate-y-[5px] rotate-45' : ''}`} style={TRANSITION} />
      <span
        className={`absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-current transition-opacity ${open ? 'opacity-0' : ''}`}
        style={TRANSITION}
      />
      <span className={`${bar} bottom-0 ${open ? '-translate-y-[5px] -rotate-45' : ''}`} style={TRANSITION} />
    </span>
  );
};
