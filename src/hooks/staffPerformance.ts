import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as staffApi from '@/api/staffPerformance';
import type { UpsertStaffTargetRequest } from '@/types/api';

export const useCurrentSessionQuery = () =>
  useQuery({ queryKey: ['staff', 'session'], queryFn: () => staffApi.getCurrentSession(), staleTime: 30_000 });

export const useStartSessionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => staffApi.startSession(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'session'] }); },
  });
};

export const useEndSessionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => staffApi.endSession(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'session'] }); },
  });
};

export const useAllStaffPerformanceQuery = () =>
  useQuery({ queryKey: ['staff', 'performance'], queryFn: () => staffApi.getAllStaffPerformance(), staleTime: 60_000 });

export const useStaffPerformanceDetailQuery = (userId: number | string) =>
  useQuery({ queryKey: ['staff', 'performance', userId], queryFn: () => staffApi.getStaffPerformanceDetail(userId), staleTime: 60_000, enabled: Boolean(userId) });

export const useUpsertStaffTargetMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertStaffTargetRequest) => staffApi.upsertStaffTarget(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'performance'] }); },
  });
};
