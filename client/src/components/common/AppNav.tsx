import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { RamprMark } from './RamprMark';

import { useMeta } from '../../hooks/useMeta';

import { formatPollTimeLocal, formatUpdatedAtLocal } from '../../lib/format';

import { DURATION, EASING } from '../../constants/animations';

/** The three primary routes, in nav order. */
const LINKS: Array<{ to: string; label: string }> = [
  { to: '/', label: 'Board' },
  { to: '/market', label: 'Market' },
  { to: '/about', label: 'About' },
];

/**
 * A desktop primary nav link: Archivo. The active route is bold ink with a green underline that
 * scales out from center; others are medium muted and darken on hover. An invisible bold ghost holds
 * the active width so selecting a tab never reflows the row. `end` restricts the Board match to "/".
 */
const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink to={to} end={to === '/'} className="relative grid place-items-center font-display text-[14px]">
    {({ isActive }: { isActive: boolean }) => (
      <>
        <span className="invisible col-start-1 row-start-1 font-bold" aria-hidden="true">
          {label}
        </span>
        <span
          className={`col-start-1 row-start-1 transition-colors hover:text-ink ${
            isActive ? 'font-bold text-ink' : 'font-medium text-muted-2'
          }`}
          style={{ transitionDuration: `${DURATION.fast}ms` }}
        >
          {label}
        </span>
        {/* Green underline that scales out from center when the tab becomes active. */}
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-brand origin-center transition-transform ${
            isActive ? 'scale-x-100' : 'scale-x-0'
          }`}
          style={{ transitionDuration: `${DURATION.normal}ms`, transitionTimingFunction: EASING }}
        />
      </>
    )}
  </NavLink>
);

/**
 * A row in the open mobile drawer: the current route bold ink with a green underline and a "CURRENT"
 * tag, other routes medium muted. A full-width tap target.
 */
const DrawerLink: React.FC<{ to: string; label: string; onClick: () => void }> = ({ to, label, onClick }) => (
  <NavLink
    to={to}
    end={to === '/'}
    onClick={onClick}
    className="flex items-center justify-between border-b border-line-1 px-5 py-3"
  >
    {({ isActive }: { isActive: boolean }) => (
      <>
        <span
          className={`font-display text-[15px] ${
            isActive
              ? 'font-bold text-ink underline decoration-brand decoration-2 underline-offset-[5px]'
              : 'font-medium text-muted-1'
          }`}
        >
          {label}
        </span>
        {isActive && (
          <span className="font-mono uppercase tracking-[0.1em] text-muted-3 text-[10px]">
            Current
          </span>
        )}
      </>
    )}
  </NavLink>
);

/**
 * The mobile menu toggle: three bars that smoothly morph between a hamburger and an X — the top and
 * bottom bars rotate to the diagonals and meet at center while the middle bar fades out.
 */
const ToggleGlyph: React.FC<{ open: boolean }> = ({ open }) => {
  const bar = 'absolute left-0 h-[1.5px] w-full rounded-full bg-current origin-center transition-transform';
  const motion = { transitionDuration: `${DURATION.normal}ms`, transitionTimingFunction: EASING };
  return (
    <span className="relative block h-[12px] w-[16px] shrink-0" aria-hidden="true">
      <span className={`${bar} top-0 ${open ? 'translate-y-[5px] rotate-45' : ''}`} style={motion} />
      <span
        className={`absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rounded-full bg-current transition-opacity ${
          open ? 'opacity-0' : ''
        }`}
        style={motion}
      />
      <span className={`${bar} bottom-0 ${open ? '-translate-y-[5px] -rotate-45' : ''}`} style={motion} />
    </span>
  );
};

/**
 * The persistent top navigation: the rampr mark + wordmark and the three route links
 * grouped at the left, with a desktop-only cadence stamp — the latest snapshot's moment, or
 * the daily poll time before the first poll, in the viewer's local timezone — at the right.
 * Below 760px the links collapse behind a hamburger-icon toggle (an X when open)
 * that drops a compact drawer of the three routes.
 * @returns The top nav header
 */
export const AppNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { meta } = useMeta();
  const close = () => setOpen(false);

  // Cadence stamp, all in the viewer's local zone: the latest snapshot's moment once a poll
  // has run, or the daily poll time before day zero.
  const stamp = meta?.updatedAt
    ? `updated ${formatUpdatedAtLocal(meta.updatedAt)}`
    : `updated daily · ${formatPollTimeLocal()}`;

  return (
    <header>
      <div className="flex items-center justify-between border-b border-line-2 px-5 py-4 md:px-10 md:py-[18px]">
        <div className="flex items-center gap-7">
          <Link to="/" onClick={close} className="flex items-center gap-2 text-ink" aria-label="Rampr — home">
            <RamprMark size={24} />
            <span className="font-display font-extrabold text-[19px] md:text-[21px] tracking-[-0.02em]">
              Rampr
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((link) => (
              <NavItem key={link.to} to={link.to} label={link.label} />
            ))}
          </nav>
        </div>

        <span className="hidden font-mono text-muted-2 md:inline text-[12px]">
          {stamp}
        </span>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          className="text-muted-1 transition-colors hover:text-ink md:hidden"
          style={{ transitionDuration: `${DURATION.fast}ms` }}
        >
          <ToggleGlyph open={open} />
        </button>
      </div>

      {/* Stays mounted and collapses via grid-rows (0fr → 1fr) so it animates open AND closed;
          visibility flips only after the collapse finishes, keeping hidden links out of focus/AT order. */}
      <div
        className={`grid md:hidden ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] invisible'}`}
        style={{
          transition: open
            ? `grid-template-rows ${DURATION.normal}ms ${EASING}`
            : `grid-template-rows ${DURATION.normal}ms ${EASING}, visibility 0s ${DURATION.normal}ms`,
        }}
      >
        <div className="flex flex-col overflow-hidden">
          {LINKS.map((link) => (
            <DrawerLink key={link.to} to={link.to} label={link.label} onClick={close} />
          ))}
        </div>
      </div>
    </header>
  );
};
