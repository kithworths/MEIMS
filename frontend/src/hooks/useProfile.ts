import { useQuery } from '@tanstack/react-query';
import { fetchProfile, type AuthUser } from '../api/auth';

export function useProfile() {
  return useQuery<AuthUser, Error>({
    queryKey: ['auth', 'profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
