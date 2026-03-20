/**
 * src/pages/ReceiptsTemplate.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { printReceiptSchema, receiptTemplateSchema, type PrintReceiptFormValues, type ReceiptTemplateFormValues } from '@/types/schemas';
import { usePrintReceiptMutation, useReceiptTemplateQuery, useUpdateReceiptTemplateMutation } from '@/hooks/receipts';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function ReceiptsTemplatePage() {
  const addToast = uiStore((state) => state.addToast);
  const templateQuery = useReceiptTemplateQuery();
  const updateMutation = useUpdateReceiptTemplateMutation();
  const printMutation = usePrintReceiptMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const templateForm = useForm<ReceiptTemplateFormValues>({
    resolver: zodResolver(receiptTemplateSchema),
    defaultValues: { header_text: '', footer_text: '', show_gstin: true, paper_width_mm: 80 },
  });
  const printForm = useForm<PrintReceiptFormValues>({
    resolver: zodResolver(printReceiptSchema),
    defaultValues: { transaction_id: '', printer_mac_address: '' },
  });

  if (templateQuery.isError) {
    return <ErrorState error={normalizeApiError(templateQuery.error)} onRetry={() => void templateQuery.refetch()} />;
  }

  if (templateQuery.isLoading) {
    return <PageFrame title="Receipt template" subtitle="Configure printed receipt appearance."><SkeletonLoader variant="rect" height={320} /></PageFrame>;
  }

  const onSaveTemplate = templateForm.handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await updateMutation.mutateAsync({
        header_text: values.header_text ?? null,
        footer_text: values.footer_text ?? null,
        show_gstin: values.show_gstin,
        paper_width_mm: values.paper_width_mm ?? null,
      });
      addToast({ title: 'Template saved', message: `Paper width ${result.paper_width_mm ?? 0}.`, variant: 'success' });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, templateForm.setError);
        return;
      }
      setServerMessage(apiError.message);
    }
  });

  const onPrint = printForm.handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await printMutation.mutateAsync(values);
      addToast({ title: 'Print job queued', message: `Job ${result.job_id} is pending.`, variant: 'info' });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, printForm.setError);
        return;
      }
      setServerMessage(apiError.message);
    }
  });

  return (
    <PageFrame title="Receipt template" subtitle="Configure printed receipt appearance and queue prints.">
      <div className="grid grid--2">
        <section className="card"><div className="card__header"><strong>Template</strong></div><div className="card__body"><form className="stack" onSubmit={onSaveTemplate} noValidate>
          <label className="field"><span>Header text</span><input className="input" {...templateForm.register('header_text')} /></label>
          <label className="field"><span>Footer text</span><input className="input" {...templateForm.register('footer_text')} /></label>
          <label className="field"><span>Show GSTIN</span><input type="checkbox" {...templateForm.register('show_gstin')} /></label>
          <label className="field"><span>Paper width mm</span><input className="input" type="number" {...templateForm.register('paper_width_mm', { valueAsNumber: true })} /></label>
          <button className="button" type="submit" disabled={templateForm.formState.isSubmitting || updateMutation.isPending}>Save template</button>
        </form></div></section>
        <section className="card"><div className="card__header"><strong>Print receipt</strong></div><div className="card__body"><form className="stack" onSubmit={onPrint} noValidate>
          <label className="field"><span>Transaction ID</span><input className="input" {...printForm.register('transaction_id')} /></label>
          <label className="field"><span>Printer MAC address</span><input className="input" {...printForm.register('printer_mac_address')} /></label>
          <button className="button button--secondary" type="submit" disabled={printForm.formState.isSubmitting || printMutation.isPending}>Queue print</button>
        </form></div></section>
      </div>
      {serverMessage ? <div className="muted">{serverMessage}</div> : null}
    </PageFrame>
  );
}
