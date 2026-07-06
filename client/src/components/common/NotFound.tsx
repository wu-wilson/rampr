import React from 'react';
import { Link } from 'react-router-dom';

import { RamprMark } from './RamprMark';

import { DURATION } from '../../constants/animations';

interface NotFoundProps {
  /** Headline; defaults to a generic page-not-found message. */
  title?: string;
  /** Supporting sentence beneath the headline. */
  body?: string;
}

/**
 * The 404 screen for unknown routes and unknown company slugs. Offers a route back to
 * the Board so the viewer is never stranded.
 * @param props - Optional headline and body overrides
 * @returns The not-found screen
 */
export const NotFound: React.FC<NotFoundProps> = ({
  title = 'Not found',
  body = "That page isn't on the board. It may have moved, or never existed.",
}) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
    <RamprMark size={44} className="opacity-70" />
    <h2 className="font-display font-bold text-ink" style={{ fontSize: '20px' }}>
      {title}
    </h2>
    <p className="max-w-sm text-muted-1" style={{ fontSize: '13px', lineHeight: 1.6 }}>
      {body}
    </p>
    <Link
      to="/"
      className="mt-1 border border-line-4 px-4 py-2 font-mono uppercase text-ink transition-colors hover:border-ink hover:bg-raised"
      style={{ fontSize: '12px', letterSpacing: '0.1em', transitionDuration: `${DURATION.fast}ms` }}
    >
      ← Back to the board
    </Link>
  </div>
);
