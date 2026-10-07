import React from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from './EmptyState';

interface NotFoundProps {
  /** Headline; defaults to a generic page-not-found message. */
  title?: string;
  /** Supporting sentence beneath the headline. */
  body?: string;
}

/**
 * The not-found screen for unknown routes and company slugs, with a link back to the board.
 * @param props - Optional headline and body overrides
 * @returns The not-found screen
 */
export const NotFound: React.FC<NotFoundProps> = ({
  title = 'Not found',
  body = 'That page is not part of the release. It may have moved, or never existed.',
}) => (
  <EmptyState title={title} body={body}>
    <Link to="/" className="link mt-px inline-flex h-[34px] items-center text-[13px] font-medium">
      Back to the board
    </Link>
  </EmptyState>
);
