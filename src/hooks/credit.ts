import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as creditApi from '@/api/credit';
import type { CreditRepayRequest, ListCreditTransactionsRequest } from '@/types/api';

export const useCreditAccountQuery = (customerId: number | string) =>
  useQuery({ queryKey: ['credit', 'account', customerId], queryFn: () => creditApi.getCreditAccount(customerId), staleTime: 60_000, enabled: Boolean(customerId) });

export const useCreditTransactionsQuery = (customerId: number | string, params: ListCreditTransactionsRequest = {}) =>
  useQuery({ queryKey: ['credit', 'transactions', customerId, params], queryFn: () => creditApi.getCreditTransactions(customerId, params), staleTime: 60_000, enabled: Boolean(customerId) });

export const useCreditRepayMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: number | string; data: CreditRepayRequest }) => creditApi.repayCredit(customerId, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['credit', 'account', vars.customerId] });
      qc.invalidateQueries({ queryKey: ['credit', 'transactions', vars.customerId] });
    },
  });
};
