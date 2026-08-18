import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as financeApi from '../api/finance';

export interface PaymentsQueryOptions {
  page: number;
  pageSize: number;
  search?: string;
  payment_type?: string;
  status?: string;
  payment_date_after?: string;
  payment_date_before?: string;
  ordering?: string;
  enabled?: boolean;
}

export interface ReceiptsQueryOptions {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  issued_after?: string;
  issued_before?: string;
  ordering?: string;
  enabled?: boolean;
}

export interface AllocationsQueryOptions {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
  enabled?: boolean;
}

export function useFinanceDashboard(params: { start_date?: string; end_date?: string; enabled?: boolean } = {}) {
  return useQuery<financeApi.PaymentDashboardResponse, Error>({
    queryKey: ['finance', 'dashboard', params.start_date, params.end_date],
    queryFn: () => financeApi.getFinanceDashboard(params),
    staleTime: 1000 * 60,
    retry: 1,
    enabled: params.enabled ?? true,
  });
}

export function usePayments(options: PaymentsQueryOptions) {
  const { page, pageSize, search, payment_type, status, payment_date_after, payment_date_before, ordering, enabled = true } = options;
  return useQuery<financeApi.PaymentListResponse, Error>({
    queryKey: ['finance', 'payments', page, pageSize, search, payment_type, status, payment_date_after, payment_date_before, ordering],
    queryFn: () => financeApi.getPayments({
      page,
      pageSize,
      search,
      payment_type,
      status,
      payment_date_after,
      payment_date_before,
      ordering,
    }),
    staleTime: 1000 * 60,
    retry: 1,
    enabled,
  });
}

export function usePaymentReceipts(options: ReceiptsQueryOptions) {
  const { page, pageSize, search, status, issued_after, issued_before, ordering, enabled = true } = options;
  return useQuery<financeApi.PaymentReceiptListResponse, Error>({
    queryKey: ['finance', 'payment-receipts', page, pageSize, search, status, issued_after, issued_before, ordering],
    queryFn: () => financeApi.getPaymentReceipts({
      page,
      pageSize,
      search,
      status,
      issued_after,
      issued_before,
      ordering,
    }),
    staleTime: 1000 * 60,
    retry: 1,
    enabled,
  });
}

export function usePaymentAllocations(options: AllocationsQueryOptions) {
  const { page, pageSize, search, ordering, enabled = true } = options;
  return useQuery<financeApi.PaymentAllocationListResponse, Error>({
    queryKey: ['finance', 'payment-allocations', page, pageSize, search, ordering],
    queryFn: () => financeApi.getPaymentAllocations({
      page,
      pageSize,
      search,
      ordering,
    }),
    staleTime: 1000 * 60,
    retry: 1,
    enabled,
  });
}

export function usePayment(id?: string) {
  return useQuery<financeApi.Payment, Error>({
    queryKey: ['finance', 'payment', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Payment ID is required');
      }
      return financeApi.getPayment(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useSoftDeletePayment() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id: string) => financeApi.softDeletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payments'] });
      qc.invalidateQueries({ queryKey: ['finance', 'dashboard'] });
    },
  });
}

export function useSoftDeletePaymentAllocation() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id: string) => financeApi.softDeletePaymentAllocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'payment-allocations'] }),
  });
}

export function useSoftDeletePaymentReceipt() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id: string) => financeApi.softDeletePaymentReceipt(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'payment-receipts'] }),
  });
}

export function usePaymentReceipt(id?: string) {
  return useQuery<financeApi.PaymentReceipt, Error>({
    queryKey: ['finance', 'payment-receipt', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Receipt ID is required');
      }
      return financeApi.getPaymentReceipt(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
