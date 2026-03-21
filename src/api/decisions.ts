import { request } from '@/api/client';
import type { GetDecisionsResponse } from '@/types/api';

const BASE = '/api/v1/decisions';

export const getDecisions = () =>
  request<GetDecisionsResponse>({ url: `${BASE}/`, method: 'GET' });
