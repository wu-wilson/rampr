import React from 'react';

interface EmphasisProps {
  children: React.ReactNode;
}

/**
 * The figure or name a line of secondary text turns on, set in ink at weight 500.
 * @param props - The emphasized content
 * @returns The emphasized text
 */
export const Emphasis: React.FC<EmphasisProps> = ({ children }) => <b className="font-medium text-ink">{children}</b>;
