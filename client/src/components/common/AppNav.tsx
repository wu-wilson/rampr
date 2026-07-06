import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { RamprMark } from './RamprMark';

import { useMeta } from '../../hooks/useMeta';

import { DURATION } from '../../constants/animations';

/** The three primary routes, in nav order. */
const LINKS: Array<{ to: string; label: string }> = [
  { to: '/', label: 'Board' },
  { to: '/market', label: 'Market' },
  { to: '/about', label: 'About' },
];

/**
 * A desktop primary nav link: Archivo, active in bold ink with a small green dot, inactive
 * in medium muted. `end` restricts the Board match to exactly "/".
 */
const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      `inline-flex items-center gap-1.5 font-display transition-colors hover:text-ink ${
        isActive ? 'font-extrabold text-ink' : 'font-medium text-muted-2'
      }`
    }
    style={{ fontSize: '13px', transitionDuration: `${DURATION.fast}ms` }}
  >
    {({ isActive }: { isActive: boolean }) => (
      <>
        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />}
        {label}
      </>
    )}
  </NavLink>
);

/**
 * A row in the open mobile drawer: a status dot (filled green when current, hollow
 * otherwise) beside the label, with a "CURRENT" tag on the active route.
 */
const DrawerLink: React.FC<{ to: string; label: string; onClick: () => void }> = ({ to, label, onClick }) => (
  <NavLink
    to={to}
    end={to === '/'}
    onClick={onClick}
    className="flex items-center justify-between border-b border-line-1 px-5 py-[13px]"
  >
    {({ isActive }: { isActive: boolean }) => (
      <>
        <span className="flex items-center gap-2.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-brand' : 'border border-line-4'}`}
            aria-hidden="true"
          />
          <span className={`font-display font-bold ${isActive ? 'text-ink' : 'text-muted-1'}`} style={{ fontSize: '15px' }}>
            {label}
          </span>
        </span>
        {isActive && (
          <span className="font-mono uppercase tracking-[0.1em] text-muted-3" style={{ fontSize: '9px' }}>
            Current
          </span>
        )}
      </>
    )}
  </NavLink>
);

/**
 * The persistent top navigation: the rampr mark + wordmark and the three route links
 * grouped at the left, with a desktop-only "updated daily · 06:00 UTC" cadence stamp at the
 * right. Below 760px the links collapse behind a `☰ menu` toggle that becomes `✕ close` and
 * drops a compact drawer of the three routes.
 * @returns The top nav header
 */
export const AppNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { meta } = useMeta();
  const close = () => setOpen(false);

  // Cadence stamp; once the first poll has run it names the exact snapshot date.
  const stamp = meta?.updatedAt ? `updated ${meta.updatedAt} · 06:00 UTC` : 'updated daily · 06:00 UTC';

  return (
    <header>
      <div className="flex items-center justify-between border-b border-line-2 px-5 py-4 md:px-10 md:py-[18px]">
        <div className="flex items-center gap-7">
          <Link to="/" onClick={close} className="flex items-center gap-2 text-ink" aria-label="rampr — home">
            <RamprMark size={24} />
            <span className="font-display font-extrabold text-[19px] md:text-[21px]" style={{ letterSpacing: '-0.02em' }}>
              rampr
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((link) => (
              <NavItem key={link.to} to={link.to} label={link.label} />
            ))}
          </nav>
        </div>

        <span className="hidden font-mono text-muted-2 md:inline" style={{ fontSize: '11px' }}>
          {stamp}
        </span>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          className="font-mono text-muted-1 transition-colors hover:text-ink md:hidden"
          style={{ fontSize: '12px', transitionDuration: `${DURATION.fast}ms` }}
        >
          {open ? '✕ close' : '☰ menu'}
        </button>
      </div>

      {open && (
        <div className="flex flex-col md:hidden">
          {LINKS.map((link) => (
            <DrawerLink key={link.to} to={link.to} label={link.label} onClick={close} />
          ))}
        </div>
      )}
    </header>
  );
};
