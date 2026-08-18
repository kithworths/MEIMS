import api from './axios';

export type PaymentType = 'Project' | 'Stand' | 'Service' | 'Reversal' | 'Refund';

export interface Payment {
  id: string;
  reference: string;
  payment_type: PaymentType;
  project?: string | null;
  stand?: string | null;
  service_type?: string | null;
  amount: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  external_reference?: string;
  notes?: string;
  status: string;
  original_payment?: string | null;
  payment_date: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  is_active: boolean;
  is_deleted: boolean;
}

export interface PaymentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}

export interface PaymentCreatePayload {
  payment_type: PaymentType;
  project?: string | null;
  stand?: string | null;
  service_type?: string | null;
  amount: number;
  currency: string;
  exchange_rate?: number;
  external_reference?: string;
  notes?: string;
  original_payment?: string | null;
  payment_date?: string;
}

export interface PaymentUpdatePayload {
  notes?: string;
  external_reference?: string;
  is_active?: boolean;
}

export interface PaymentAllocation {
  id: string;
  payment: string;
  target_content_type: string;
  target_object_id: string;
  amount: number;
  allocated_at: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  is_active: boolean;
  is_deleted: boolean;
}

export interface PaymentAllocationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PaymentAllocation[];
}

export interface PaymentAllocationCreatePayload {
  payment: string;
  target_content_type: string;
  target_object_id: string;
  amount: number;
}

export interface PaymentAllocationUpdatePayload {
  amount?: number;
  is_active?: boolean;
}

export interface PaymentReceipt {
  id: string;
  receipt_number: string;
  payment: string;
  issued_at: string;
  status: string;
  pdf_ready_data: Record<string, unknown>;
  original_receipt?: string | null;
  verified_at?: string | null;
  verification_hash: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  is_active: boolean;
  is_deleted: boolean;
}

export interface PaymentReceiptListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PaymentReceipt[];
}

export interface PaymentReceiptCreatePayload {
  payment: string;
  issued_at?: string;
  pdf_ready_data?: Record<string, unknown>;
  original_receipt?: string | null;
}

export interface PaymentReceiptUpdatePayload {
  is_active?: boolean;
}

export interface PaymentDashboardResponse {
  total_revenue: string;
  payment_count: number;
  refund_count: number;
  reversal_count: number;
  daily_revenue: Array<{ date: string; amount: string; count: number }>;
}

function buildQueryParams(params: Record<string, unknown>) {
  const queryParams: Record<string, string | number | boolean> = {};

  if ('pageSize' in params && typeof params.pageSize === 'number') {
    queryParams.page_size = params.pageSize;
  }

  if ('page' in params && typeof params.page === 'number' && params.page > 1) {
    queryParams.offset = (params.page as number - 1) * (params.pageSize as number ?? 20);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (!value || key === 'page' || key === 'pageSize') return;
    queryParams[key] = value as string | number | boolean;
  });

  return queryParams;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getPayments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  payment_type?: string;
  status?: string;
  currency?: string;
  payment_date_after?: string;
  payment_date_before?: string;
  ordering?: string;
}) {
  const response = await api.get<PaymentListResponse>('payments/', {
    params: buildQueryParams(params),
  });

  return response.data;
}

export async function getPayment(id: string) {
  const response = await api.get<Payment>(`payments/${id}/`);
  return response.data;
}

export async function createPayment(payload: PaymentCreatePayload) {
  const response = await api.post<Payment>('payments/', payload);
  return response.data;
}

export async function updatePayment(id: string, payload: PaymentUpdatePayload) {
  const response = await api.patch<Payment>(`payments/${id}/`, payload);
  return response.data;
}

export async function deletePayment(id: string) {
  await api.delete(`payments/${id}/`);
}

export async function softDeletePayment(id: string) {
  const response = await api.post(`payments/${id}/soft_delete/`);
  return response.data;
}

export async function reversePayment(id: string, reason: string) {
  const response = await api.post<{ data: Payment }>(`payments/${id}/reverse/`, { reason });
  return response.data.data;
}

export async function refundPayment(id: string, amount: number, reason: string) {
  const response = await api.post<{ data: Payment }>(`payments/${id}/refund/`, { amount, reason });
  return response.data.data;
}

export async function exportPaymentsCsv(params: { search?: string; payment_type?: string; status?: string; payment_date_after?: string; payment_date_before?: string; ordering?: string }) {
  const response = await api.get('payments/export-csv/', {
    params: buildQueryParams(params),
    responseType: 'blob',
  });

  downloadBlob(response.data, 'payments.csv');
}

export async function exportPaymentsExcel(params: { search?: string; payment_type?: string; status?: string; payment_date_after?: string; payment_date_before?: string; ordering?: string }) {
  const response = await api.get('payments/export-excel/', {
    params: buildQueryParams(params),
    responseType: 'blob',
  });

  downloadBlob(response.data, 'payments.xls');
}

export async function getPaymentAllocations(params: { page?: number; pageSize?: number; search?: string; ordering?: string }) {
  const response = await api.get<PaymentAllocationListResponse>('payment-allocations/', {
    params: buildQueryParams(params),
  });

  return response.data;
}

export async function createPaymentAllocation(payload: PaymentAllocationCreatePayload) {
  const response = await api.post<PaymentAllocation>('payment-allocations/', payload);
  return response.data;
}

export async function updatePaymentAllocation(id: string, payload: PaymentAllocationUpdatePayload) {
  const response = await api.patch<PaymentAllocation>(`payment-allocations/${id}/`, payload);
  return response.data;
}

export async function deletePaymentAllocation(id: string) {
  await api.delete(`payment-allocations/${id}/`);
}

export async function softDeletePaymentAllocation(id: string) {
  const response = await api.post(`payment-allocations/${id}/soft_delete/`);
  return response.data;
}

export async function getPaymentReceipts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  issued_after?: string;
  issued_before?: string;
  ordering?: string;
}) {
  const response = await api.get<PaymentReceiptListResponse>('payment-receipts/', {
    params: buildQueryParams(params),
  });

  return response.data;
}

export async function getPaymentReceipt(id: string) {
  const response = await api.get<PaymentReceipt>(`payment-receipts/${id}/`);
  return response.data;
}

export async function createPaymentReceipt(payload: PaymentReceiptCreatePayload) {
  const response = await api.post<PaymentReceipt>('payment-receipts/', payload);
  return response.data;
}

export async function updatePaymentReceipt(id: string, payload: PaymentReceiptUpdatePayload) {
  const response = await api.patch<PaymentReceipt>(`payment-receipts/${id}/`, payload);
  return response.data;
}

export async function deletePaymentReceipt(id: string) {
  await api.delete(`payment-receipts/${id}/`);
}

export async function softDeletePaymentReceipt(id: string) {
  const response = await api.post(`payment-receipts/${id}/soft_delete/`);
  return response.data;
}

export async function reprintPaymentReceipt(id: string) {
  const response = await api.post<{ data: PaymentReceipt }>(`payment-receipts/${id}/reprint/`);
  return response.data.data;
}

export async function verifyPaymentReceipt(id: string, verification_hash: string) {
  const response = await api.post<{ data: PaymentReceipt }>(`payment-receipts/${id}/verify/`, { verification_hash });
  return response.data.data;
}

export async function exportReceiptsCsv(params: { search?: string; status?: string; issued_after?: string; issued_before?: string; ordering?: string }) {
  const response = await api.get('payment-receipts/export-csv/', {
    params: buildQueryParams(params),
    responseType: 'blob',
  });

  downloadBlob(response.data, 'payment_receipts.csv');
}

export async function exportReceiptsExcel(params: { search?: string; status?: string; issued_after?: string; issued_before?: string; ordering?: string }) {
  const response = await api.get('payment-receipts/export-excel/', {
    params: buildQueryParams(params),
    responseType: 'blob',
  });

  downloadBlob(response.data, 'payment_receipts.xls');
}

export async function getFinanceDashboard(params: { start_date?: string; end_date?: string } = {}) {
  const response = await api.get<{ data: PaymentDashboardResponse }>('payments/dashboard/', {
    params: buildQueryParams(params),
  });

  return response.data.data;
}
