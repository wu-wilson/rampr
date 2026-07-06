import React from 'react';
import { useParams } from 'react-router-dom';

import { Band } from '../common/Band';
import { NotFound } from '../common/NotFound';
import { StatusNote } from '../common/StatusNote';
import { CompanyHeader } from './CompanyHeader';
import { DeptBreakdown } from './DeptBreakdown';
import { LocationList } from './LocationList';
import { TrajectoryChart } from './TrajectoryChart';
import { WorkMixBar } from './WorkMixBar';

import { useCompany } from '../../hooks/useCompany';

/**
 * The Company screen: the header band (open now, momentum, board link), the trajectory
 * band (live bars or the gated panel), and the department / location / work-mix breakdowns
 * band. Renders designed loading, not-found (unknown slug), and error states.
 * @returns The Company screen
 */
export const CompanyScreen: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { company, loading, error, notFound } = useCompany(slug ?? '');

  if (notFound) {
    return (
      <NotFound
        title="Company not tracked"
        body="rampr isn't tracking a company at that address. It may not be on the curated list yet."
      />
    );
  }

  if (!company) {
    return (
      <StatusNote>{loading ? 'Loading the company…' : (error ?? 'Something went wrong.')}</StatusNote>
    );
  }

  return (
    <div>
      <CompanyHeader data={company} />
      <TrajectoryChart trajectory={company.trajectory} />

      <Band>
        <div className="-mx-5 md:-mx-10 md:grid md:grid-cols-3">
          <div className="px-5 py-[22px] md:px-10 md:py-7">
            <DeptBreakdown departments={company.breakdowns.departments} />
          </div>
          <div className="border-t border-line-2 px-5 py-[22px] md:border-l md:border-t-0 md:px-10 md:py-7">
            <LocationList locations={company.breakdowns.locations} />
          </div>
          <div className="border-t border-line-2 px-5 py-[22px] md:border-l md:border-t-0 md:px-10 md:py-7">
            <WorkMixBar workMix={company.breakdowns.workMix} />
          </div>
        </div>
      </Band>
    </div>
  );
};
