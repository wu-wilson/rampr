import React from 'react';

import { Caption } from '../common/Caption';
import { Change } from '../common/Change';
import { GatedPanel } from '../common/GatedPanel';

import { formatCount, formatDayDate } from '../../lib/format';

import { DAILY_TABLE_ROWS } from '../../constants/config';

import type { SeriesPoint } from '../../lib/series';
import type { Trajectory } from '../../types/company';

/** The daily table's columns: release, postings, change. */
const COLUMNS = 'grid-cols-[minmax(0,1fr)_76px_76px] px-5 md:px-4';

interface DailyTableProps {
  trajectory: Trajectory;
  /** The trajectory as a plain series, oldest first. */
  series: SeriesPoint[];
}

/**
 * The last `DAILY_TABLE_ROWS` releases, latest first, with each count and its change, or the building panel.
 * @param props - The trajectory and the series
 * @returns The table section
 */
export const DailyTable: React.FC<DailyTableProps> = ({ trajectory, series }) => {
  // The floor of 1 keeps the `start + index - 1` lookup in range on a short series; past the gate it never binds.
  const start = Math.max(1, series.length - DAILY_TABLE_ROWS);
  const rows = series
    .slice(start)
    .map((point, index) => ({ point, change: point.value - series[start + index - 1].value }))
    .reverse();

  return (
    <div>
      <Caption title={trajectory.gated ? 'Daily releases' : `Last ${DAILY_TABLE_ROWS} releases`} />
      {trajectory.gated ? (
        <GatedPanel daysTracked={trajectory.daysTracked} label="The daily table" note="Every count is already live." />
      ) : (
        <div className="-mx-5 md:mx-0">
          <div className={`grid h-[38px] items-center gap-3.5 border-y border-line text-[12px] font-medium text-ink-3 ${COLUMNS}`}>
            <span>Release</span>
            <span className="text-right">Postings</span>
            <span className="text-right">Change</span>
          </div>
          {rows.map(({ point, change }, index) => (
            <div
              key={point.date}
              className={`grid h-9 items-center gap-3.5 border-b border-line-2 text-[13.5px] last:border-line ${index === 0 ? 'font-medium' : ''} ${COLUMNS}`}
            >
              <span>{formatDayDate(point.date)}</span>
              <span className="text-right">{formatCount(point.value)}</span>
              <Change delta={change} className="text-right" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
