import { request } from '@/api/client';
import type {
  CreditRepayRequest,
  CreditRepayResponse,
  GetCreditAccountResponse,
  ListCreditTransactionsRequest,
  ListCreditTransactionsResponse,
} from '@/types/api';

const BASE = '/api/v1/credit';

export const getCreditAccount = (customerId: number | string) =>
  request<GetCreditAccountResponse>({ url: `${BASE}/customers/${customerId}`, method: 'GET' });

export const getCreditTransactions = (customerId: number | string, params: ListCreditTransactionsRequest = {}) =>
  request<ListCreditTransactionsResponse>({ url: `${BASE}/customers/${customerId}/transactions`, method: 'GET', params });

export const repayCredit = (customerId: number | string, data: CreditRepayRequest) =>
  request<CreditRepayResponse>({ url: `${BASE}/customers/${customerId}/repay`, method: 'POST', data });
