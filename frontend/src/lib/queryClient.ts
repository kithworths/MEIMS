import { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: unknown) => {
        if (failureCount >= 2) {
          return false;
        }

        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as AxiosError;
          return axiosError.response?.status !== 401;
        }

        return true;
      },
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;
