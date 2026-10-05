/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery } from '@tanstack/react-query';
import { getPremiumStatus } from '../api/premium';
import { useAuth } from '../store/authStore';

// Only fetched for a logged-in user — there's nothing to check for a guest,
// and calling the authenticated-only /premium/status endpoint without a
// session would just 401.
export const usePremiumStatus = () => {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ['premium-status'],
    queryFn: getPremiumStatus,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  return {
    isPremium: query.data?.isPremium ?? false,
    expiresAt: query.data?.expiresAt ?? null,
    isLoading: isAuthenticated && query.isLoading,
    refetch: query.refetch,
  };
};
