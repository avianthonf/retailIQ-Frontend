import { request } from '@/api/client';
import type {
  EndSessionResponse,
  GetAllStaffPerformanceResponse,
  GetStaffPerformanceDetailResponse,
  GetStaffSessionResponse,
  StartSessionResponse,
  UpsertStaffTargetRequest,
  UpsertStaffTargetResponse,
} from '@/types/api';

const BASE = '/api/v1/staff';

export const getCurrentSession = () =>
  request<GetStaffSessionResponse>({ url: `${BASE}/sessions/current`, method: 'GET' });

export const startSession = () =>
  request<StartSessionResponse>({ url: `${BASE}/sessions/start`, method: 'POST' });

export const endSession = () =>
  request<EndSessionResponse>({ url: `${BASE}/sessions/end`, method: 'POST' });

export const getAllStaffPerformance = () =>
  request<GetAllStaffPerformanceResponse>({ url: `${BASE}/performance`, method: 'GET' });

export const getStaffPerformanceDetail = (userId: number | string) =>
  request<GetStaffPerformanceDetailResponse>({ url: `${BASE}/performance/${userId}`, method: 'GET' });

export const upsertStaffTarget = (data: UpsertStaffTargetRequest) =>
  request<UpsertStaffTargetResponse>({ url: `${BASE}/targets`, method: 'PUT', data });
