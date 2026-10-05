import React from 'react';

import { useElementSize } from '../../hooks/useElementSize';
import { useRuleWave } from '../../hooks/useRuleWave';

import { RULE_SPACING } from '../../constants/config';

/**
 * The ledger rules behind the hero, one hairline every `RULE_SPACING` px with an overlay the wave fades.
 * @returns The ruled backdrop, filling its positioned parent
 */
export const RulingBackdrop: React.FC = () => {
  const [ref, { height }] = useElementSize<HTMLDivElement>();
  const count = Math.ceil(height / RULE_SPACING);
  useRuleWave(ref, count);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="absolute left-0 right-0 h-px bg-line-2" style={{ top: index * RULE_SPACING }}>
          <span data-rule className="absolute inset-0 bg-wave opacity-0" />
        </span>
      ))}
    </div>
  );
};
