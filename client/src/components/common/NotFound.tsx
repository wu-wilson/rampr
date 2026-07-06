import React from 'react';
import { Link } from 'react-router-dom';

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
  <div className="flex flex-col items-center justify-center gap-4 px-5 py-24 text-center md:px-10">
    <h2 className="font-display font-bold text-ink text-[20px]">
      {title}
    </h2>
    <p className="max-w-sm text-muted-1 text-[13px] leading-[1.6]">
      {body}
    </p>
    <Link
      to="/"
      className="mt-1 border border-line-4 px-4 py-2 font-mono uppercase text-ink transition-colors hover:border-ink hover:bg-raised/60 text-[12px] tracking-[0.1em]"
      style={{ transitionDuration: `${DURATION.fast}ms` }}
    >
      ← Back to the board
    </Link>
  </div>
);
