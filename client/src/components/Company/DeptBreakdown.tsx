import React from 'react';

import { MonoLabel } from '../common/MonoLabel';

import { formatCount } from '../../lib/format';

import type { DeptCount } from '../../types/company';

interface DeptBreakdownProps {
  /** Department breakdown rows, ordered by count. */
  departments: DeptCount[];
}

/**
 * Departments as labeled rows, each with a small horizontal CSS bar scaled to the largest
 * department. Renders the inner content of the breakdowns band's first cell. Snapshot
 * data, always live — never gated.
 * @param props - The department breakdown rows
 * @returns The department breakdown cell
 */
export const DeptBreakdown: React.FC<DeptBreakdownProps> = ({ departments }) => {
  const max = Math.max(1, ...departments.map((d) => d.count));

  return (
    <div>
      <MonoLabel className="mb-3.5 block md:mb-[18px]">By department</MonoLabel>
      <div className="flex flex-col gap-3">
        {departments.map((dept) => (
          <div key={dept.name} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3" style={{ fontSize: '12px' }}>
              <span className="truncate font-semibold text-ink">{dept.name}</span>
              <span className="font-mono tabular-nums text-muted-1">{formatCount(dept.count)}</span>
            </div>
            <div className="h-[7px] bg-line-1 md:h-2">
              <div className="h-[7px] bg-brand md:h-2" style={{ width: `${Math.max(2, (dept.count / max) * 100)}%` }} />
            </div>
          </div>
        ))}
        {departments.length === 0 && (
          <p className="text-muted-3" style={{ fontSize: '12px' }}>
            No departments reported.
          </p>
        )}
      </div>
    </div>
  );
};
