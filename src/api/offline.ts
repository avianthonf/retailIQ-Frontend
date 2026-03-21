import { request } from '@/api/client';
import type { GetOfflineSnapshotResponse } from '@/types/api';

const BASE = '/api/v1/offline';

export const getSnapshot = () =>
  request<GetOfflineSnapshotResponse>({ url: `${BASE}/snapshot`, method: 'GET' });
