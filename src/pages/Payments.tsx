/**
 * src/pages/Payments.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { paymentIntentSchema, type PaymentIntentFormValues } from '@/types/schemas';
import { useCreatePaymentIntentMutation, usePaymentProvidersQuery } from '@/hooks/payments';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function PaymentsPage() {
  const addToast = uiStore((state) => state.addToast);
  const query = usePaymentProvidersQuery({ country_code: 'IN' });
  const mutation = useCreatePaymentIntentMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<PaymentIntentFormValues>({
    resolver: zodResolver(paymentIntentSchema),
    defaultValues: { transaction_id: '', provider_code: '' },
  });

  if (query.isError) {
    return <ErrorState error={normalizeApiError(query.error)} onRetry={() => void query.refetch()} />;
  }

  if (query.isLoading) {
    return <PageFrame title="Payments" subtitle="Start payment intents for completed transactions."><SkeletonLoader variant="rect" height={320} /></PageFrame>;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await mutation.mutateAsync(values);
      addToast({ title: 'Payment intent created', message: result.client_secret ? 'Client secret received.' : 'Intent created.', variant: 'success' });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }
      setServerMessage(apiError.message);
    }
  });

  return (
    <PageFrame title="Payments" subtitle="Start payment intents for completed transactions.">
      <section className="card">
        <div className="card__header"><strong>Providers</strong></div>
        <div className="card__body">
          <DataTable
            columns={[
              { key: 'code', header: 'Code', render: (row) => row.code },
              { key: 'name', header: 'Name', render: (row) => row.name },
              { key: 'type', header: 'Type', render: (row) => row.type },
              { key: 'methods', header: 'Methods', render: (row) => row.supported_methods.join(', ') },
            ]}
            data={query.data?.providers ?? []}
          />
        </div>
      </section>
      <section className="card">
        <div className="card__header"><strong>Create payment intent</strong></div>
        <div className="card__body">
          <form className="stack" onSubmit={onSubmit} noValidate>
            <label className="field"><span>Transaction ID</span><input className="input" {...register('transaction_id')} />{errors.transaction_id ? <span className="muted">{errors.transaction_id.message}</span> : null}</label>
            <label className="field"><span>Provider code</span><input className="input" {...register('provider_code')} />{errors.provider_code ? <span className="muted">{errors.provider_code.message}</span> : null}</label>
            {serverMessage ? <div className="muted">{serverMessage}</div> : null}
            <button className="button" type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting || mutation.isPending ? 'Creating…' : 'Create intent'}</button>
          </form>
        </div>
      </section>
    </PageFrame>
  );
}
