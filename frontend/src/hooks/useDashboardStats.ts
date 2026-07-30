import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, type DashboardStats } from '../services/dashboard';

export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60,
    retry: 1,
  });
}
