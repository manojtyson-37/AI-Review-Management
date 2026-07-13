import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const useAnalytics = (locationId?: string) => {
  return useQuery({
    queryKey: ['analytics', locationId],
    queryFn: async () => {
      // In Phase 2, we will fetch real data from our Analytics Controller.
      // E.g., /analytics?locationId=xyz or /analytics (aggregate)
      const endpoint = locationId ? `/analytics?locationId=${locationId}` : `/analytics`;
      const response = await apiClient.get(endpoint);
      return response.data;
    },
    // Only run this query if we have a way to authenticate (token)
    // For now we'll just let it run. React Query handles errors.
    retry: false,
  });
};
