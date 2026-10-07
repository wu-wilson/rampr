import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { Emphasis } from './Emphasis';
import { Rail } from './Rail';
import { StepMark } from './StepMark';
import { ToggleGlyph } from './ToggleGlyph';

import { useMeta } from '../../hooks/useMeta';

import { formatLongDate } from '../../lib/format';

import { DURATION, EASING, TRANSITION } from '../../constants/animations';

import type { Meta } from '../../types/meta';

/** The three primary routes, in nav order. `/about` carries the Method label. */
const LINKS: Array<{ to: string; label: string }> = [
  { to: '/', label: 'Board' },
  { to: '/market', label: 'Market' },
  { to: '/about', label: 'Method' },
];

/** The release stamp: the number with its long date, or a lone stand-in on day zero or after a failed load (the screen explains either), or null while loading. */
function stampFor(meta: Meta | null, failed: boolean): { short: string; long: string | null } | null {
  if (!meta) return failed ? { short: 'Release unavailable', long: null } : null;
  if (meta.updatedAt === null || meta.releaseNumber === null) return { short: 'Before the first release', long: null };
  return { short: `Release ${meta.releaseNumber}`, long: formatLongDate(meta.updatedAt) };
}

interface NavItemProps {
  to: string;
  label: string;
}

/** A desktop nav link: secondary ink that darkens on hover, ink when active. */
const NavItem: React.FC<NavItemProps> = ({ to, label }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      `px-2.5 py-[7px] text-[14px] font-medium transition-colors hover:text-ink ${isActive ? 'text-ink' : 'text-ink-2'}`
    }
    style={TRANSITION}
  >
    {label}
  </NavLink>
);

/**
 * The masthead: the mark, the routes (behind a toggle below `md`), and the release stamp.
 * @returns The masthead
 */
export const AppNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { meta, error } = useMeta();
  const stamp = stampFor(meta, error !== null);
  const handleClose = (): void => setOpen(false);

  // The drawer pushes the page down rather than covering it, so any navigation has to collapse it,
  // not just a tap on one of its own links.
  useEffect(handleClose, [pathname]);

  return (
    <header className="border-b border-line">
      <Rail>
        <div className="relative flex h-[68px] items-center justify-between gap-7">
          <Link to="/" onClick={handleClose} className="flex items-center gap-2.5 text-ink transition-colors hover:text-ink-2" style={TRANSITION} aria-label="Rampr, home">
            <StepMark className="-mr-px" />
            <span className="relative top-px text-[21px] font-semibold leading-none tracking-[-0.025em]">Rampr</span>
          </Link>

          <nav aria-label="Primary" className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 gap-1 md:flex">
            {LINKS.map((link) => (
              <NavItem key={link.to} to={link.to} label={link.label} />
            ))}
          </nav>

          <div className="flex items-center gap-5">
            {stamp && (
              <div className="flex items-center gap-4 whitespace-nowrap text-[13px] text-ink-2">
                <Emphasis>{stamp.short}</Emphasis>
                {stamp.long && (
                  <>
                    <span aria-hidden="true" className="hidden h-3 w-px bg-line-3 lg:block" />
                    <span className="hidden lg:inline">{stamp.long}</span>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              className="-mx-3.5 -my-4 px-3.5 py-4 text-ink-2 transition-colors hover:text-ink md:hidden"
              style={TRANSITION}
            >
              <ToggleGlyph open={open} />
            </button>
          </div>
        </div>
      </Rail>

      {/* Stays mounted and collapses via grid-rows (0fr → 1fr) so it animates open and closed;
          visibility flips only after the collapse finishes, keeping hidden links out of focus order. */}
      <div
        className={`grid md:hidden ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] invisible'}`}
        style={{
          transition: open
            ? `grid-template-rows ${DURATION.normal}ms ${EASING}`
            : `grid-template-rows ${DURATION.normal}ms ${EASING}, visibility 0s ${DURATION.normal}ms`,
        }}
      >
        <div className="overflow-hidden">
          <nav aria-label="Primary" className="flex flex-col">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={handleClose}
                className={({ isActive }) =>
                  `border-t border-line-2 py-3 pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))] text-[15px] font-medium transition-colors
                  hover:text-ink focus-visible:outline-offset-[-2px] ${isActive ? 'text-ink' : 'text-ink-2'}`
                }
                style={TRANSITION}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
