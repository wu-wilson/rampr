import React from 'react';
import { Link } from 'react-router-dom';

import { MonoLabel } from '../common/MonoLabel';

import { formatDelta } from '../../lib/format';
import { gatingLabel } from '../../lib/gating';

import { DURATION } from '../../constants/animations';

import type { MomentumDirection } from '../../types/common';
import type { Mover, Movers } from '../../types/market';

interface MoversStripProps {
  /** Heating and cooling movers, or a gated placeholder. */
  movers: Movers;
  /** Distinct snapshot dates so far, borrowed from the index for the gated note. */
  daysTracked: number;
}

/**
 * The heating / cooling movers: the companies with the largest positive and negative
 * 7-day deltas, each linking to its company screen. While globally gated — movers derive
 * from the same daily history as the index — each column shows a short "unlocks with the
 * index" note instead of a list.
 * @param props - The movers payload and the tracked-days count for the gated note
 * @returns The two-column movers band
 */
export const MoversStrip: React.FC<MoversStripProps> = ({ movers, daysTracked }) => (
  <div className="-mx-5 grid md:-mx-10 md:grid-cols-2">
    <div className="border-b border-line-2 px-5 py-[22px] md:border-b-0 md:border-r md:px-10 md:py-6">
      <MoverColumn
        title="Heating up · 7d"
        direction="up"
        movers={movers.heating}
        gated={movers.gated}
        daysTracked={daysTracked}
      />
    </div>
    <div className="px-5 py-[22px] md:px-10 md:py-6">
      <MoverColumn
        title="Cooling down · 7d"
        direction="down"
        movers={movers.cooling}
        gated={movers.gated}
        daysTracked={daysTracked}
      />
    </div>
  </div>
);

/** One column of movers, or the gated note when the index has not yet unlocked. */
const MoverColumn: React.FC<{
  title: string;
  direction: MomentumDirection;
  movers: Mover[];
  gated: boolean;
  daysTracked: number;
}> = ({ title, direction, movers, gated, daysTracked }) => {
  const colorClass = direction === 'up' ? 'text-up' : 'text-down';

  return (
    <div>
      <MonoLabel>{title}</MonoLabel>
      {gated ? (
        <p className="mt-3 rounded-sm border border-dashed border-line-4 bg-raised px-4 py-3.5 font-mono text-[10px] text-muted-3 md:mt-3.5 md:px-[18px] md:py-4 md:text-[11px]">
          unlocks with the index — {gatingLabel(daysTracked)} days
        </p>
      ) : (
        <ul className="mt-3 flex flex-col border-t border-line-1 md:mt-3.5">
          {movers.map((mover) => (
            <li key={mover.slug} className="border-b border-line-1">
              <Link
                to={`/company/${mover.slug}`}
                className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-raised/60 md:py-[9px]"
                style={{ transitionDuration: `${DURATION.fast}ms` }}
              >
                <span className="truncate font-display font-semibold text-ink" style={{ fontSize: '12px' }}>
                  {mover.name}
                </span>
                <span
                  className={`font-mono font-semibold tabular-nums ${colorClass}`}
                  style={{ fontSize: '12px' }}
                >
                  {formatDelta(mover.delta)}
                </span>
              </Link>
            </li>
          ))}
          {movers.length === 0 && (
            <li className="border-b border-line-1 px-3 py-2 font-display text-muted-3 md:py-[9px]" style={{ fontSize: '12px' }}>
              No movers in this direction.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
