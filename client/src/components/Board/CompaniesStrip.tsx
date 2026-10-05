import React, { useState } from 'react';

import { formatCount } from '../../lib/format';

import type { BoardCompany } from '../../types/board';

/** A company's mark from `public/marks/<slug>.png` in a fixed 22px box, kept empty if the file fails so the track never shifts. */
const CompanyMark: React.FC<{ slug: string }> = ({ slug }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span className="block h-[22px] w-[22px] shrink-0">
      {!failed && (
        <img
          src={`/marks/${slug}.png`}
          alt=""
          width={22}
          height={22}
          decoding="async"
          onError={() => setFailed(true)}
          className="block h-[22px] w-[22px] rounded-[4px]"
        />
      )}
    </span>
  );
};

interface CompaniesStripProps {
  /** Every tracked company, in board order. */
  companies: BoardCompany[];
  /** How many boards are tracked, for the caption. */
  companyCount: number;
}

/**
 * The companies strip: a caption over a slow marquee of every tracked company, the marquee hidden from screen readers.
 * @param props - The tracked companies and how many boards are tracked
 * @returns The strip section
 */
export const CompaniesStrip: React.FC<CompaniesStripProps> = ({ companies, companyCount }) => {
  const items = [...companies, ...companies].map((company, index) => (
    <span key={`${company.slug}-${index}`} className="flex items-center gap-2.5 whitespace-nowrap text-[13.5px] font-medium text-ink-2">
      <CompanyMark slug={company.slug} />
      {company.name}
    </span>
  ));

  return (
    <section className="-mx-5 border-b border-line pb-8 pt-9 md:mx-0">
      <p className="mb-5 px-5 text-center text-[13px] text-ink-3 md:px-0">
        Rampr counts the public job boards of these {formatCount(companyCount)} companies on Greenhouse, Lever, and Ashby.
      </p>
      <div className="strip overflow-hidden" aria-hidden="true">
        <div className="strip-track flex w-max gap-10 will-change-transform">{items}</div>
      </div>
    </section>
  );
};
