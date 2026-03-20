/**
 * src/api/transactions.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request } from '@/api/client';
import type {
  BatchTransactionCreateRequest,
  BatchTransactionCreateResponse,
  CreateTransactionRequest,
  CreateTransactionResponse,
  CreateTransactionReturnRequest,
  CreateTransactionReturnResponse,
  GetDailyTransactionSummaryRequest,
  GetDailyTransactionSummaryResponse,
  GetTransactionResponse,
  ListTransactionsRequest,
  ListTransactionsResponse,
} from '@/types/api';

export const createTransaction = (payload: CreateTransactionRequest) => request<CreateTransactionResponse>({ url: '/api/v1/transactions', method: 'POST', data: payload });
export const createTransactionBatch = (payload: BatchTransactionCreateRequest) => request<BatchTransactionCreateResponse>({ url: '/api/v1/transactions/batch', method: 'POST', data: payload });
export const listTransactions = (filters: ListTransactionsRequest) => request<ListTransactionsResponse>({ url: '/api/v1/transactions', method: 'GET', params: filters });
export const getTransactionById = (transactionId: string | number) => request<GetTransactionResponse>({ url: `/api/v1/transactions/${transactionId}`, method: 'GET' });
export const createTransactionReturn = (transactionId: string | number, payload: CreateTransactionReturnRequest) => request<CreateTransactionReturnResponse>({ url: `/api/v1/transactions/${transactionId}/return`, method: 'POST', data: payload });
export const getDailyTransactionSummary = (filters: GetDailyTransactionSummaryRequest = {}) => request<GetDailyTransactionSummaryResponse>({ url: '/api/v1/transactions/summary/daily', method: 'GET', params: filters });
