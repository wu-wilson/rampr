import React from 'react';

import { useMarket } from '../../hooks/useMarket';
import { useFilterStore } from '../../store/filterStore';

import { DURATION } from '../../constants/animations';

import type { SectorTotal } from '../../types/market';

/** One selectable sector pill; the active pill is inverted to solid ink. */
const Chip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`whitespace-nowrap rounded-full px-3 py-[7px] font-mono transition-colors md:px-[13px] md:py-2 ${
      active
        ? 'bg-ink-strong text-paper'
        : 'border border-line-4 text-muted-1 hover:border-ink hover:text-ink'
    }`}
    style={{ fontSize: '11px', transitionDuration: `${DURATION.fast}ms` }}
  >
    {label}
  </button>
);

/**
 * The inline sector filter row of pills. Sectors are read from the market rollup (always
 * the full curated set) and drive the board's `sector` filter; an "All" pill clears it.
 * Renders nothing until the sector list resolves so the row never flashes a lone "All".
 * @returns The sector chip row
 */
export const SectorChips: React.FC = () => {
  const { market } = useMarket();
  const sector = useFilterStore((s) => s.sector);
  const setSector = useFilterStore((s) => s.setSector);

  if (!market) return null;

  const sectors: SectorTotal[] = market.sectors;

  return (
    <div className="flex flex-wrap gap-2">
      <Chip label="All" active={sector === null} onClick={() => setSector(null)} />
      {sectors.map((entry) => (
        <Chip
          key={entry.slug}
          label={entry.label}
          active={sector === entry.slug}
          onClick={() => setSector(entry.slug)}
        />
      ))}
    </div>
  );
};
