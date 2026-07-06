import { useEffect, useState } from 'react';

import { ApiError, apiGet, toUserMessage } from '../lib/api';

import type { CompanyResponse } from '../types/company';

/** Result of {@link useCompany}. */
interface UseCompanyResult {
  company: CompanyResponse | null;
  loading: boolean;
  error: string | null;
  /** True when the slug is unknown (HTTP 404); drives the not-found screen. */
  notFound: boolean;
}

/**
 * Fetch a company's detail from `GET /api/companies/:slug`, refetching when the slug
 * changes. A 404 is surfaced distinctly as `notFound` so the route can render the
 * not-found screen instead of a generic error. Guards against out-of-order responses
 * with a cancelled flag on route switches.
 * @param slug - The company slug from the route
 * @returns The company payload (null until resolved) plus loading/error/not-found state
 */
export function useCompany(slug: string): UseCompanyResult {
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCompany(): Promise<void> {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const data = await apiGet<CompanyResponse>(`/api/companies/${encodeURIComponent(slug)}`);
        if (!cancelled) setCompany(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(toUserMessage(err, 'Couldn’t load this company.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCompany();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { company, loading, error, notFound };
}
