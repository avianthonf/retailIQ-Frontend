/**
 * src/pages/Kyc.tsx
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
import { kycVerifySchema, type KycVerifyFormValues } from '@/types/schemas';
import { useKycProvidersQuery, useKycStatusQuery, useVerifyKycMutation } from '@/hooks/kyc';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function KycPage() {
  const addToast = uiStore((state) => state.addToast);
  const providersQuery = useKycProvidersQuery({ country_code: 'IN' });
  const statusQuery = useKycStatusQuery();
  const mutation = useVerifyKycMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<KycVerifyFormValues>({
    resolver: zodResolver(kycVerifySchema),
    defaultValues: { provider_code: '', id_number: '', country_code: 'IN' },
  });

  if (providersQuery.isError || statusQuery.isError) {
    return <ErrorState error={normalizeApiError(providersQuery.error ?? statusQuery.error)} onRetry={() => { void providersQuery.refetch(); void statusQuery.refetch(); }} />;
  }

  if (providersQuery.isLoading || statusQuery.isLoading) {
    return <PageFrame title="KYC" subtitle="Review providers and verification status."><SkeletonLoader variant="rect" height={320} /></PageFrame>;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await mutation.mutateAsync(values);
      addToast({ title: 'KYC submitted', message: result.status, variant: 'success' });
      void statusQuery.refetch();
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
    <PageFrame title="KYC" subtitle="Review providers and verification status.">
      <section className="card">
        <div className="card__header"><strong>Providers</strong></div>
        <div className="card__body">
          <DataTable
            columns={[
              { key: 'code', header: 'Code', render: (row) => row.code },
              { key: 'name', header: 'Name', render: (row) => row.name },
              { key: 'label', header: 'ID label', render: (row) => row.id_label },
              { key: 'mandatory', header: 'Mandatory', render: (row) => (row.is_mandatory ? 'Yes' : 'No') },
            ]}
            data={providersQuery.data?.providers ?? []}
          />
        </div>
      </section>
      <section className="card">
        <div className="card__header"><strong>Verify KYC</strong></div>
        <div className="card__body">
          <form className="stack" onSubmit={onSubmit} noValidate>
            <label className="field"><span>Provider code</span><input className="input" {...register('provider_code')} />{errors.provider_code ? <span className="muted">{errors.provider_code.message}</span> : null}</label>
            <label className="field"><span>ID number</span><input className="input" {...register('id_number')} />{errors.id_number ? <span className="muted">{errors.id_number.message}</span> : null}</label>
            <label className="field"><span>Country code</span><input className="input" {...register('country_code')} /></label>
            {serverMessage ? <div className="muted">{serverMessage}</div> : null}
            <button className="button" type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting || mutation.isPending ? 'Verifying…' : 'Verify KYC'}</button>
          </form>
        </div>
      </section>
      <section className="card">
        <div className="card__header"><strong>Status</strong></div>
        <div className="card__body">
          <DataTable
            columns={[
              { key: 'provider', header: 'Provider', render: (row) => row.provider_name },
              { key: 'status', header: 'Status', render: (row) => row.status },
              { key: 'country', header: 'Country', render: (row) => row.country_code },
              { key: 'verified', header: 'Verified at', render: (row) => row.verified_at ?? '—' },
            ]}
            data={statusQuery.data?.records ?? []}
          />
        </div>
      </section>
    </PageFrame>
  );
}
