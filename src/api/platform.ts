import { request, requestEnvelope } from '@/api/client';

export interface PlatformHealth {
  status: string;
  version?: string;
}

export interface PlatformRoot {
  name?: string;
  version?: string;
  docs?: string;
  health?: string;
  status?: string;
  message?: string;
}

export interface PlatformMaintenance {
  scheduled_maintenance: unknown[];
  ongoing_incidents: unknown[];
  system_status: string;
  checked_at: string;
}

export interface TeamPing {
  success: boolean;
}

export const getPlatformHealth = () => request<PlatformHealth>({ url: '/health', method: 'GET' });

export const getPlatformRoot = () => request<PlatformRoot>({ url: '/', method: 'GET' });

export const probeWebsocketEndpoint = () => request<string>({ url: '/ws', method: 'GET' });

export async function getMaintenanceStatus() {
  const envelope = await requestEnvelope<PlatformMaintenance>({ url: '/api/v1/ops/maintenance', method: 'GET' });
  return envelope.data;
}

export const pingTeam = () => request<TeamPing>({ url: '/api/v1/team/ping', method: 'GET' });
