import React, { useMemo, useRef, useState } from 'react';

import { Caption } from '../common/Caption';
import { Reveal } from '../common/Reveal';
import { CompanyRow } from './CompanyRow';
import { TableControls, type SectorOption } from './TableControls';
import { TableHeader } from './TableHeader';

import { useFlipReorder } from '../../hooks/useFlipReorder';
import { useFilterStore } from '../../store/filterStore';

import { formatCount } from '../../lib/format';

import { TABLE_PREVIEW_ROWS } from '../../constants/config';

import { naturalAscending, type BoardCompany, type BoardSort } from '../../types/board';

interface ReleaseTableProps {
  /** Every company on the board. */
  companies: BoardCompany[];
}

/** Order the rows for the active sort. */
function orderRows(rows: BoardCompany[], sort: BoardSort): BoardCompany[] {
  const direction = sort.ascending === naturalAscending(sort.key) ? 1 : -1;
  const byChange =
    (pick: (row: BoardCompany) => number | null) =>
    (a: BoardCompany, b: BoardCompany): number => {
      const x = pick(a);
      const y = pick(b);
      if (x === null || y === null) return Number(x === null) - Number(y === null);
      return (y - x) * direction || b.open - a.open;
    };
  const compare: Record<BoardSort['key'], (a: BoardCompany, b: BoardCompany) => number> = {
    name: (a, b) => a.name.localeCompare(b.name) * direction,
    open: (a, b) => (b.open - a.open) * direction || a.name.localeCompare(b.name),
    d7: byChange((row) => row.delta7d),
    d30: byChange((row) => row.delta30d),
  };
  return [...rows].sort(compare[sort.key]);
}

/**
 * The company table: open postings by company, held locally so the sector select, the search,
 * and the sortable headers reorder rows in place. Shows `TABLE_PREVIEW_ROWS` rows until expanded.
 * @param props - Every company on the board
 * @returns The table section
 */
export const ReleaseTable: React.FC<ReleaseTableProps> = ({ companies }) => {
  const sector = useFilterStore((s) => s.sector);
  const sort = useFilterStore((s) => s.sort);
  const search = useFilterStore((s) => s.search);
  const [expanded, setExpanded] = useState(false);
  const rowsRef = useRef<HTMLDivElement>(null);
  useFlipReorder(rowsRef);

  const sectors = useMemo<SectorOption[]>(() => {
    const seen = new Map<string, string>();
    companies.forEach((company) => seen.set(company.sector, company.sectorLabel));
    return [...seen].map(([slug, label]) => ({ slug, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [companies]);

  const matching = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = companies.filter(
      (company) => (!sector || company.sector === sector) && (!query || company.name.toLowerCase().includes(query)),
    );
    return orderRows(rows, sort);
  }, [companies, sector, search, sort]);

  const shown = expanded ? matching : matching.slice(0, TABLE_PREVIEW_ROWS);

  return (
    <Reveal className="pt-14">
      <Caption title="Open postings by company">
        <TableControls sectors={sectors} />
      </Caption>
      <div className="-mx-5 md:mx-0">
        <TableHeader />
        <div ref={rowsRef} className="relative grid">
          {shown.map((company) => (
            <CompanyRow key={company.slug} company={company} />
          ))}
          {shown.length === 0 && (
            <p className="border-b border-line px-5 py-4 text-[14px] text-ink-3 md:px-4">
              {search || sector ? 'No company matches. ' : 'No boards were read this release. '}
              {search && sector ? 'Clear the search or choose another sector.' : search ? 'Try another name.' : sector ? 'Choose another sector.' : ''}
            </p>
          )}
        </div>
      </div>
      {matching.length > TABLE_PREVIEW_ROWS && (
        <div className="flex justify-center pt-3">
          <button type="button" onClick={() => setExpanded((prev) => !prev)} className="link h-[34px] text-[13px] font-medium">
            {expanded ? `Show the first ${TABLE_PREVIEW_ROWS} companies` : `Show all ${formatCount(matching.length)} companies`}
          </button>
        </div>
      )}
    </Reveal>
  );
};
