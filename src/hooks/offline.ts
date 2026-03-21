import { useQuery } from '@tanstack/react-query';
import * as offlineApi from '@/api/offline';

export const useOfflineSnapshotQuery = () =>
  useQuery({ queryKey: ['offline', 'snapshot'], queryFn: () => offlineApi.getSnapshot(), staleTime: 300_000 });
