import { request } from '@/api/client';
import type {
  CreateCustomerRequest,
  CreateCustomerResponse,
  CustomerTransactionsRequest,
  CustomerTransactionsResponse,
  GetCustomerAnalyticsResponse,
  GetCustomerSummaryResponse,
  ListCustomersRequest,
  ListCustomersResponse,
  TopCustomersRequest,
  TopCustomersResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
} from '@/types/api';
import type { Customer } from '@/types/models';

const BASE = '/api/v1/customers';

export const listCustomers = (params: ListCustomersRequest = {}) =>
  request<ListCustomersResponse>({ url: BASE, method: 'GET', params });

export const getCustomer = (customerId: number | string) =>
  request<Customer>({ url: `${BASE}/${customerId}`, method: 'GET' });

export const createCustomer = (data: CreateCustomerRequest) =>
  request<CreateCustomerResponse>({ url: BASE, method: 'POST', data });

export const updateCustomer = (customerId: number | string, data: UpdateCustomerRequest) =>
  request<UpdateCustomerResponse>({ url: `${BASE}/${customerId}`, method: 'PUT', data });

export const getCustomerTransactions = (customerId: number | string, params: CustomerTransactionsRequest = {}) =>
  request<CustomerTransactionsResponse>({ url: `${BASE}/${customerId}/transactions`, method: 'GET', params });

export const getCustomerSummary = (customerId: number | string) =>
  request<GetCustomerSummaryResponse>({ url: `${BASE}/${customerId}/summary`, method: 'GET' });

export const getTopCustomers = (params: TopCustomersRequest = {}) =>
  request<TopCustomersResponse>({ url: `${BASE}/top`, method: 'GET', params });

export const getCustomerAnalytics = () =>
  request<GetCustomerAnalyticsResponse>({ url: `${BASE}/analytics`, method: 'GET' });
