import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as einvoicingApi from '@/api/einvoicing';
import type { GenerateEInvoiceRequest } from '@/types/api';

export const useGenerateEInvoiceMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateEInvoiceRequest) => einvoicingApi.generateEInvoice(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['einvoicing'] }); },
  });
};

export const useEInvoiceStatusQuery = (invoiceId: string) =>
  useQuery({ queryKey: ['einvoicing', 'status', invoiceId], queryFn: () => einvoicingApi.getEInvoiceStatus(invoiceId), staleTime: 30_000, enabled: Boolean(invoiceId) });
