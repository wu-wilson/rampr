import React from 'react';

import { DURATION } from '../../constants/animations';
import { GITHUB_URL } from '../../constants/config';

/**
 * Shared page footer: the data provenance on the left and an underlined "source on GitHub"
 * link on the right, in mono. Stacks on mobile, sits on one row above the 760px breakpoint.
 * @returns The footer row
 */
export const Footer: React.FC = () => (
  <footer className="flex flex-col gap-3 border-t border-line-2 px-5 py-5 font-mono text-muted-3 md:flex-row md:items-center md:justify-between md:px-10">
    <span className="text-[10px] md:text-[11px]">built on public feeds — Greenhouse · Lever · Ashby</span>
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="text-[10px] text-muted-1 underline transition-colors hover:text-ink md:text-[11px]"
      style={{ textUnderlineOffset: '3px', transitionDuration: `${DURATION.fast}ms` }}
    >
      source on GitHub
    </a>
  </footer>
);
