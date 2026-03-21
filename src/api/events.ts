import { request } from '@/api/client';
import type { EventRecord } from '@/types/models';

const BASE = '/api/v1/events';

export const listEvents = (params: { from?: string; to?: string } = {}) =>
  request<EventRecord[]>({ url: BASE, method: 'GET', params });

export const createEvent = (data: {
  event_name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  expected_impact_pct?: number | null;
  is_recurring?: boolean;
  recurrence_rule?: string | null;
}) => request<{ id: string; status: string }>({ url: BASE, method: 'POST', data });

export const updateEvent = (eventId: string, data: Partial<{
  event_name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  expected_impact_pct: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
}>) => request<{ id: string; status: string }>({ url: `${BASE}/${eventId}`, method: 'PUT', data });

export const deleteEvent = (eventId: string) =>
  request<{ status: string }>({ url: `${BASE}/${eventId}`, method: 'DELETE' });

export const getUpcomingEvents = (days = 30) =>
  request<EventRecord[]>({ url: `${BASE}/upcoming`, method: 'GET', params: { days } });

export const getDemandSensing = (productId: number | string) =>
  request<Record<string, unknown>>({ url: `${BASE}/forecasting/demand-sensing/${productId}`, method: 'GET' });
