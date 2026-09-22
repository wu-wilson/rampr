import React from 'react';
import { Link } from 'react-router-dom';

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
  body = 'That page is not part of the release. It may have moved, or never existed.',
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-24 text-center">
    <h1 className="text-[26px] font-light tracking-[-0.02em]">{title}</h1>
    <p className="max-w-[44ch] text-[15px] leading-[1.55] text-ink-2">{body}</p>
    <Link to="/" className="link mt-2 text-[13px] font-medium">
      Back to the board
    </Link>
  </div>
);
