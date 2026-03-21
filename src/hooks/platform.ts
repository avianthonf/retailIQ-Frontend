import { useQuery } from '@tanstack/react-query';
import { getMaintenanceStatus, getPlatformHealth, getPlatformRoot, pingTeam } from '@/api/platform';

export const usePlatformHealthQuery = () =>
  useQuery({
    queryKey: ['platform', 'health'],
    queryFn: getPlatformHealth,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const usePlatformRootQuery = () =>
  useQuery({
    queryKey: ['platform', 'root'],
    queryFn: getPlatformRoot,
    staleTime: 300_000,
  });

export const useMaintenanceStatusQuery = () =>
  useQuery({
    queryKey: ['platform', 'maintenance'],
    queryFn: getMaintenanceStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const useTeamPingQuery = () =>
  useQuery({
    queryKey: ['platform', 'team-ping'],
    queryFn: pingTeam,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
