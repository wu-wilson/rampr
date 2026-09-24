import React from 'react';
import { Link } from 'react-router-dom';

import { Change } from '../common/Change';
import { GatedPanel } from '../common/GatedPanel';

import { TRANSITION } from '../../constants/animations';
import { GATING_DAYS } from '../../constants/config';

import type { Mover, Movers } from '../../types/market';

/** A movers table's columns: company (with its sector), 7-day change. */
const COLUMNS = 'grid-cols-[minmax(0,1fr)_70px] px-5 md:px-4';

/** One side of the movers tables: a header and a row per mover, each linking to the company. */
const MoverTable: React.FC<{ title: string; movers: Mover[]; emptyNote: string }> = ({ title, movers, emptyNote }) => (
  <div className="-mx-5 md:mx-0">
    <div className={`grid h-[38px] items-center gap-3.5 border-y border-line text-[12px] font-medium text-ink-3 ${COLUMNS}`}>
      <span>{title}</span>
      <span className="text-right">7 days</span>
    </div>
    {movers.map((mover) => (
      <Link
        key={mover.slug}
        to={`/company/${mover.slug}`}
        className={`grid h-[42px] items-center gap-3.5 border-b border-line-2 text-[14px] transition-colors last:border-line hover:bg-hover ${COLUMNS}`}
        style={TRANSITION}
      >
        <span className="truncate font-medium tracking-[-0.005em]">
          {mover.name}
          <span className="ml-2 text-[12.5px] font-normal text-ink-3">{mover.sectorLabel}</span>
        </span>
        <Change delta={mover.delta} className="text-right" />
      </Link>
    ))}
    {movers.length === 0 && <p className="border-b border-line px-5 py-3 text-[14px] text-ink-3 md:px-4">{emptyNote}</p>}
  </div>
);

interface MoversTablesProps {
  movers: Movers;
  /** Distinct release dates so far, for the gated panel. */
  daysTracked: number;
}

/**
 * The movers tables: the largest rises and the largest falls over seven days, side by side.
 * While globally gated, one building panel stands in for both.
 * @param props - The movers and the release count for the gated panel
 * @returns The two tables, or the gated panel
 */
export const MoversTables: React.FC<MoversTablesProps> = ({ movers, daysTracked }) => {
  if (movers.gated) {
    return <GatedPanel daysTracked={daysTracked} label="The changes table" note={`Each company also needs ${GATING_DAYS} releases of its own to appear.`} />;
  }
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <MoverTable title="Rises" movers={movers.heating} emptyNote="No board rose this week." />
      <MoverTable title="Falls" movers={movers.cooling} emptyNote="No board fell this week." />
    </div>
  );
};
