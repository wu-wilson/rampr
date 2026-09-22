import React from 'react';

import { Rail } from './Rail';

import { GITHUB_URL } from '../../constants/config';

/**
 * The page footer: where the counts come from on the left and the source link on the right, on
 * one hairline, stacking on phones.
 * @returns The footer
 */
export const Footer: React.FC = () => (
  <Rail>
    <footer className="-mx-5 flex flex-col gap-2 border-t border-line px-5 py-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between md:mx-0 md:px-0">
      <span>Rampr reads the public feeds of Greenhouse, Lever, and Ashby boards.</span>
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="link font-medium">
        Source on GitHub
      </a>
    </footer>
  </Rail>
);
