import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import { useGenerateEInvoiceMutation, useEInvoiceStatusQuery } from '@/hooks/einvoicing';

export default function EInvoicingPage() {
  const [transactionId, setTransactionId] = useState('');
  const [countryCode, setCountryCode] = useState('IN');
  const [lookupId, setLookupId] = useState('');
  const [activeInvoiceId, setActiveInvoiceId] = useState('');

  const generateMutation = useGenerateEInvoiceMutation();
  const statusQuery = useEInvoiceStatusQuery(activeInvoiceId);

  const handleGenerate = () => {
    if (!transactionId) return;
    generateMutation.mutate({ transaction_id: transactionId, country_code: countryCode }, {
      onSuccess: (data) => {
        if (data?.invoice_id) setActiveInvoiceId(data.invoice_id);
      },
    });
  };

  const handleLookup = () => {
    if (lookupId) setActiveInvoiceId(lookupId);
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    if (status === 'ACCEPTED') return 'success';
    if (status === 'SUBMITTED') return 'info';
    if (status === 'REJECTED') return 'danger';
    return 'warning';
  };

  return (
    <PageFrame title="E-Invoicing" subtitle="Generate and track e-invoices for compliance.">
      <div className="grid grid--2" style={{ marginBottom: '1.5rem' }}>
        {/* Generate */}
        <Card>
          <CardHeader><CardTitle>Generate E-Invoice</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Input placeholder="Transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="input">
                <option value="IN">India (IN)</option>
                <option value="BR">Brazil (BR)</option>
                <option value="MX">Mexico (MX)</option>
                <option value="ID">Indonesia (ID)</option>
              </select>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending || !transactionId}>
                {generateMutation.isPending ? 'Generating...' : 'Generate E-Invoice'}
              </Button>
              {generateMutation.isError && <p className="text-danger">{normalizeApiError(generateMutation.error).message}</p>}
              {generateMutation.isSuccess && generateMutation.data && (
                <div>
                  <Badge variant="success">Generated</Badge>
                  <p className="muted" style={{ marginTop: '0.25rem' }}>Invoice ID: {generateMutation.data.invoice_id ?? '—'}</p>
                  {generateMutation.data.invoice_number && <p className="muted">Invoice #: {generateMutation.data.invoice_number}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lookup */}
        <Card>
          <CardHeader><CardTitle>Check Invoice Status</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <Input placeholder="Invoice ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
              <Button onClick={handleLookup} disabled={!lookupId}>Lookup</Button>
            </div>
            {activeInvoiceId && (
              statusQuery.isLoading ? <SkeletonLoader variant="rect" height={120} /> : statusQuery.isError ? (
                <ErrorState error={normalizeApiError(statusQuery.error)} onRetry={() => void statusQuery.refetch()} />
              ) : statusQuery.data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="muted">Status:</span>
                    <Badge variant={getStatusVariant(statusQuery.data.status)}>{statusQuery.data.status}</Badge>
                  </div>
                  <div><span className="muted">Invoice ID: </span>{statusQuery.data.invoice_id ?? activeInvoiceId}</div>
                  <div><span className="muted">Transaction: </span>{statusQuery.data.transaction_id}</div>
                  <div><span className="muted">Country: </span>{statusQuery.data.country_code}</div>
                  {statusQuery.data.invoice_number && <div><span className="muted">Invoice #: </span>{statusQuery.data.invoice_number}</div>}
                  {statusQuery.data.authority_ref && <div><span className="muted">Authority Ref: </span>{statusQuery.data.authority_ref}</div>}
                  {statusQuery.data.submitted_at && <div><span className="muted">Submitted: </span>{new Date(statusQuery.data.submitted_at).toLocaleString()}</div>}
                  {statusQuery.data.qr_code_url && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className="muted">QR Code:</span>
                      <img src={statusQuery.data.qr_code_url} alt="E-Invoice QR" style={{ maxWidth: 160, marginTop: '0.25rem', display: 'block' }} />
                    </div>
                  )}
                </div>
              ) : null
            )}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
