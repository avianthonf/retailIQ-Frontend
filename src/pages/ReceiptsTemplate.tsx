import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useBarcodesQuery, useRegisterBarcodeMutation } from '@/hooks/barcodes';
import { usePrintReceiptMutation, useReceiptTemplateQuery, useUpdateReceiptTemplateMutation } from '@/hooks/receipts';
import { printReceiptSchema, receiptTemplateSchema, type PrintReceiptFormValues, type ReceiptTemplateFormValues } from '@/types/schemas';
import { extractFieldErrors, normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function ReceiptsTemplatePage() {
  const addToast = uiStore((state) => state.addToast);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [barcodeProductId, setBarcodeProductId] = useState('');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeType, setBarcodeType] = useState('EAN13');

  const templateQuery = useReceiptTemplateQuery();
  const updateTemplateMutation = useUpdateReceiptTemplateMutation();
  const printReceiptMutation = usePrintReceiptMutation();
  const registerBarcodeMutation = useRegisterBarcodeMutation();
  const barcodesQuery = useBarcodesQuery(barcodeProductId || null);

  const templateForm = useForm<ReceiptTemplateFormValues>({
    resolver: zodResolver(receiptTemplateSchema),
    values: {
      header_text: templateQuery.data?.header_text ?? '',
      footer_text: templateQuery.data?.footer_text ?? '',
      show_gstin: templateQuery.data?.show_gstin ?? true,
      paper_width_mm: templateQuery.data?.paper_width_mm ?? 80,
    },
  });

  const printForm = useForm<PrintReceiptFormValues>({
    resolver: zodResolver(printReceiptSchema),
    defaultValues: { transaction_id: '', printer_mac_address: '' },
  });

  if (templateQuery.isError) {
    return (
      <PageFrame title="Receipt Operations">
        <ErrorState error={normalizeApiError(templateQuery.error)} onRetry={() => void templateQuery.refetch()} />
      </PageFrame>
    );
  }

  const onSaveTemplate = templateForm.handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const saved = await updateTemplateMutation.mutateAsync({
        header_text: values.header_text ?? null,
        footer_text: values.footer_text ?? null,
        show_gstin: values.show_gstin,
        paper_width_mm: values.paper_width_mm ?? null,
      });
      addToast({ title: 'Template saved', message: `Receipt width set to ${saved.paper_width_mm ?? 0}mm.`, variant: 'success' });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, templateForm.setError);
        return;
      }
      setServerMessage(apiError.message);
    }
  });

  const onQueuePrint = printForm.handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const job = await printReceiptMutation.mutateAsync(values);
      addToast({ title: 'Print job queued', message: `Job ${job.job_id} is pending.`, variant: 'info' });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, printForm.setError);
        return;
      }
      setServerMessage(apiError.message);
    }
  });

  const onRegisterBarcode = async () => {
    setServerMessage(null);
    if (!barcodeProductId.trim() || !barcodeValue.trim()) {
      addToast({ title: 'Barcode inputs required', message: 'Product ID and barcode value are required.', variant: 'warning' });
      return;
    }

    try {
      await registerBarcodeMutation.mutateAsync({
        product_id: barcodeProductId.trim(),
        barcode_value: barcodeValue.trim(),
        barcode_type: barcodeType.trim() || 'EAN13',
      });
      setBarcodeValue('');
      addToast({ title: 'Barcode registered', message: 'The backend saved the barcode successfully.', variant: 'success' });
      void barcodesQuery.refetch();
    } catch (error) {
      setServerMessage(normalizeApiError(error).message);
    }
  };

  return (
    <PageFrame title="Receipt Operations" subtitle="Manage receipt templates, queue print jobs, and register product barcodes against the backend barcode APIs.">
      {templateQuery.isLoading ? (
        <SkeletonLoader variant="rect" height={320} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Template</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={onSaveTemplate} noValidate>
                  <Input label="Header text" {...templateForm.register('header_text')} />
                  <Input label="Footer text" {...templateForm.register('footer_text')} />
                  <Input label="Paper width (mm)" type="number" {...templateForm.register('paper_width_mm', { valueAsNumber: true })} />
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <input type="checkbox" {...templateForm.register('show_gstin')} />
                    Show GSTIN on receipts
                  </label>
                  <Button type="submit" loading={updateTemplateMutation.isPending}>
                    Save template
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Queue Receipt Print</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={onQueuePrint} noValidate>
                  <Input label="Transaction ID" {...printForm.register('transaction_id')} />
                  <Input label="Printer MAC address" {...printForm.register('printer_mac_address')} />
                  <Button type="submit" variant="secondary" loading={printReceiptMutation.isPending}>
                    Queue print job
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Barcode Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Input label="Product ID" value={barcodeProductId} onChange={(event) => setBarcodeProductId(event.target.value)} placeholder="Enter a product ID" />
                <Input label="Barcode value" value={barcodeValue} onChange={(event) => setBarcodeValue(event.target.value)} placeholder="ABC-12345" />
                <Input label="Barcode type" value={barcodeType} onChange={(event) => setBarcodeType(event.target.value)} placeholder="EAN13" />
                <div className="flex items-end">
                  <Button onClick={() => void onRegisterBarcode()} loading={registerBarcodeMutation.isPending}>
                    Register barcode
                  </Button>
                </div>
              </div>

              {!barcodeProductId ? (
                <EmptyState title="Product ID required" body="Enter a product ID to list and register its barcodes." />
              ) : barcodesQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={220} />
              ) : barcodesQuery.isError ? (
                <ErrorState error={normalizeApiError(barcodesQuery.error)} onRetry={() => void barcodesQuery.refetch()} />
              ) : (
                <DataTable
                  columns={[
                    { key: 'barcode_value', header: 'Barcode', render: (row) => row.barcode_value },
                    { key: 'barcode_type', header: 'Type', render: (row) => row.barcode_type },
                    { key: 'created_at', header: 'Created At', render: (row) => row.created_at ?? '-' },
                  ]}
                  data={barcodesQuery.data ?? []}
                  emptyMessage="No barcodes registered for this product yet."
                />
              )}
            </CardContent>
          </Card>

          {serverMessage ? <div className="text-sm text-red-600">{serverMessage}</div> : null}
        </div>
      )}
    </PageFrame>
  );
}
