import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listBarcodes, registerBarcode, type RegisterBarcodeRequest } from '@/api/barcodes';

export const useBarcodesQuery = (productId: number | string | null) =>
  useQuery({
    queryKey: ['barcodes', productId],
    queryFn: () => listBarcodes(productId as number | string),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });

export const useRegisterBarcodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterBarcodeRequest) => registerBarcode(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barcodes', variables.product_id] });
    },
  });
};
