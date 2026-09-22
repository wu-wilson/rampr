import React from 'react';

import { EmptyState } from '../common/EmptyState';
import { Rail } from '../common/Rail';
import { StatusNote } from '../common/StatusNote';
import { CompaniesStrip } from './CompaniesStrip';
import { HeroBand } from './HeroBand';
import { ReleaseTable } from './ReleaseTable';

import { useBoard } from '../../hooks/useBoard';
import { useFilterUrlSync } from '../../hooks/useFilterUrlSync';
import { useMarket } from '../../hooks/useMarket';

import { formatReleaseTimeLocal, formatReleaseTimeUtc } from '../../lib/format';

/**
 * The Board screen: the hero band (the figure and the hero chart), the companies strip, and the
 * company table, with designed loading, error, and day-zero states. The market index for the
 * hero chart loads alongside the board and fails on its own.
 * @returns The Board screen
 */
export const BoardScreen: React.FC = () => {
  useFilterUrlSync();
  const { board, loading, error } = useBoard();
  const { market, error: marketError } = useMarket();

  if (!board) {
    return <StatusNote>{loading ? 'Reading the release.' : (error ?? 'Something went wrong.')}</StatusNote>;
  }

  if (board.updatedAt === null) {
    return (
      <EmptyState
        title="Before the first release"
        body="Rampr has not counted its first morning yet. The figures land here once it does."
        note={`First release at ${formatReleaseTimeUtc()}, ${formatReleaseTimeLocal()} locally.`}
      />
    );
  }

  return (
    <div className="pb-24">
      <HeroBand market={board.market} index={market?.index ?? null} indexFailed={marketError !== null} />
      <Rail>
        <CompaniesStrip companies={board.companies} companyCount={board.market.companyCount} />
        <ReleaseTable companies={board.companies} />
      </Rail>
    </div>
  );
};
