import React, { useEffect, useState } from 'react';

import { EmptyState } from '../common/EmptyState';
import { StatusNote } from '../common/StatusNote';
import { FilterBar } from './FilterBar';
import { Leaderboard } from './Leaderboard';
import { LoadMore } from './LoadMore';
import { MarketHeadline } from './MarketHeadline';

import { useBoard } from '../../hooks/useBoard';
import { useFilterStore } from '../../store/filterStore';

import { formatCount, formatPollSchedule } from '../../lib/format';

import { PAGE_SIZE } from '../../constants/config';

/**
 * The Board screen: an editorial hero with the market total, the controls band, and the
 * ranked leaderboard with load-more pagination. Renders designed loading, error, day-zero
 * ("tracking just started"), and no-match empty states — never a blank screen.
 * @returns The Board screen
 */
export const BoardScreen: React.FC = () => {
  const sector = useFilterStore((s) => s.sector);
  const sort = useFilterStore((s) => s.sort);
  const search = useFilterStore((s) => s.search);

  const [pages, setPages] = useState(1);
  // Any filter change resets pagination back to the first page.
  useEffect(() => {
    setPages(1);
  }, [sector, sort, search]);

  const { board, loading, error } = useBoard({
    sector,
    sort,
    search,
    limit: PAGE_SIZE * pages,
  });

  if (!board) {
    return <StatusNote>{loading ? 'Reading the board…' : (error ?? 'Something went wrong.')}</StatusNote>;
  }

  const isDayZero = board.updatedAt === null;
  const shown = board.companies.length;
  const remaining = board.total - shown;

  return (
    <div>
      <MarketHeadline market={board.market} />

      {isDayZero ? (
        <EmptyState
          title="Tracking just started"
          body="rampr hasn't run its first poll yet — open-role counts land here once it does."
          note={formatPollSchedule()}
        />
      ) : (
        <>
          <FilterBar companyCount={board.total} />

          {shown === 0 ? (
            <EmptyState
              title="No companies match"
              body="Nothing on the board fits that search or sector. Clear a filter to widen the field."
            />
          ) : (
            <>
              <Leaderboard companies={board.companies} />
              {remaining > 0 && <LoadMore remaining={remaining} onClick={() => setPages((p) => p + 1)} />}
              <p className="px-5 pb-6 text-center font-mono text-muted-3 md:px-10" style={{ fontSize: '11px' }}>
                showing {formatCount(shown)} of {formatCount(board.total)} companies
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};
