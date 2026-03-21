import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import { useCreditAccountQuery, useCreditTransactionsQuery, useCreditRepayMutation } from '@/hooks/credit';

interface CreditTxn { id: string; type: string; amount: number; date: string; notes: string | null }

export default function CreditPage() {
  const [customerId, setCustomerId] = useState('');
  const [activeId, setActiveId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  const accountQuery = useCreditAccountQuery(activeId);
  const txnQuery = useCreditTransactionsQuery(activeId);
  const repayMutation = useCreditRepayMutation();

  const account = accountQuery.data;
  const transactions = ((Array.isArray(txnQuery.data) ? txnQuery.data : txnQuery.data?.data ?? []) as unknown) as CreditTxn[];

  const handleLookup = () => {
    if (customerId) setActiveId(customerId);
  };

  const handleRepay = () => {
    if (!activeId || !repayAmount) return;
    repayMutation.mutate({ customerId: activeId, data: { amount: Number(repayAmount) } }, {
      onSuccess: () => setRepayAmount(''),
    });
  };

  return (
    <PageFrame title="Credit Management" subtitle="Track customer credit accounts, balances, and repayments.">
      {/* Lookup */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Customer Credit Lookup</CardTitle></CardHeader>
        <CardContent>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Input placeholder="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ maxWidth: 200 }} />
            <Button onClick={handleLookup} disabled={!customerId}>Lookup</Button>
          </div>
        </CardContent>
      </Card>

      {activeId && (
        <>
          {/* Account summary */}
          {accountQuery.isLoading ? <SkeletonLoader variant="rect" height={150} /> : accountQuery.isError ? (
            <ErrorState error={normalizeApiError(accountQuery.error)} onRetry={() => void accountQuery.refetch()} />
          ) : !account ? (
            <EmptyState title="No credit account" body="This customer does not have a credit account." />
          ) : (
            <div className="grid grid--3" style={{ marginBottom: '1.5rem' }}>
              <Card>
                <CardHeader><CardTitle>Credit Limit</CardTitle></CardHeader>
                <CardContent><h2 style={{ marginBottom: 0 }}>₹{(account.credit_limit ?? 0).toLocaleString()}</h2></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Outstanding Balance</CardTitle></CardHeader>
                <CardContent>
                  <h2 style={{ marginBottom: 0 }}>₹{(account.balance ?? 0).toLocaleString()}</h2>
                  {account.status === 'overdue' && <Badge variant="danger">Overdue</Badge>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Available Credit</CardTitle></CardHeader>
                <CardContent><h2 style={{ marginBottom: 0 }}>₹{((account.credit_limit ?? 0) - (account.balance ?? 0)).toLocaleString()}</h2></CardContent>
              </Card>
            </div>
          )}

          {/* Repay */}
          {account && (
            <Card className="mb-6">
              <CardHeader><CardTitle>Record Repayment</CardTitle></CardHeader>
              <CardContent>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Input type="number" placeholder="Amount (₹)" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} style={{ maxWidth: 200 }} />
                  <Button onClick={handleRepay} disabled={repayMutation.isPending || !repayAmount}>
                    {repayMutation.isPending ? 'Processing...' : 'Record Payment'}
                  </Button>
                </div>
                {repayMutation.isError && <p className="text-danger" style={{ marginTop: '0.5rem' }}>{normalizeApiError(repayMutation.error).message}</p>}
                {repayMutation.isSuccess && <p style={{ marginTop: '0.5rem', color: '#16a34a' }}>Payment recorded successfully.</p>}
              </CardContent>
            </Card>
          )}

          {/* Transaction history */}
          <Card>
            <CardHeader><CardTitle>Credit Transactions</CardTitle></CardHeader>
            <CardContent>
              {txnQuery.isLoading ? <SkeletonLoader variant="rect" height={200} /> : transactions.length === 0 ? (
                <EmptyState title="No transactions" body="No credit transactions found for this customer." />
              ) : (
                <DataTable<CreditTxn>
                  columns={[
                    { key: 'date', header: 'Date', render: (row: CreditTxn) => new Date(row.date).toLocaleDateString() },
                    { key: 'type', header: 'Type', render: (row: CreditTxn) => (
                      <Badge variant={row.type === 'repayment' ? 'success' : 'warning'}>{row.type}</Badge>
                    )},
                    { key: 'amount', header: 'Amount', render: (row: CreditTxn) => `₹${row.amount.toLocaleString()}` },
                    { key: 'notes', header: 'Notes', render: (row: CreditTxn) => row.notes ?? '—' },
                  ]}
                  data={transactions}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageFrame>
  );
}
