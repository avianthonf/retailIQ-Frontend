import { useQuery } from '@tanstack/react-query';
import * as decisionsApi from '@/api/decisions';

export const useDecisionsQuery = () =>
  useQuery({ queryKey: ['decisions'], queryFn: () => decisionsApi.getDecisions(), staleTime: 60_000, refetchInterval: 60_000 });
