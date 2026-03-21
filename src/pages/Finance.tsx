/**
 * src/pages/Finance.tsx
 * Finance Dashboard - KYC, Credit, Loans, Treasury
 */
import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Input as _Input } from '@/components/ui/Input';
import { 
  useKYCQuery, 
  useCreditScoreQuery, 
  useCreditLedgerQuery,
  useLoanApplicationsQuery,
  useFinancialAccountsQuery,
  useTreasuryBalanceQuery,
  useTreasuryTransactionsQuery,
  useRepayCreditMutation
} from '@/hooks/finance';
import { authStore } from '@/stores/authStore';
import type { Column } from '@/components/ui/DataTable';
import type { LoanApplication, FinancialAccount, TreasuryTransaction } from '@/api/finance';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'credit' | 'loans' | 'treasury'>('overview');
  const [showRepayDialog, setShowRepayDialog] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');

  // Check if user is owner
  const user = authStore.getState().user;
  const isOwner = user?.role === 'owner';

  // Queries (must be before any conditional return per React hooks rules)
  const { data: kyc, isLoading: kycLoading, error: kycError } = useKYCQuery();
  const { data: creditScore, isLoading: creditScoreLoading } = useCreditScoreQuery();
  const { data: creditLedger, isLoading: creditLedgerLoading } = useCreditLedgerQuery();
  const { data: loanApplications, isLoading: loansLoading } = useLoanApplicationsQuery();
  const { data: accounts, isLoading: accountsLoading } = useFinancialAccountsQuery();
  const { data: treasuryBalance, isLoading: treasuryLoading } = useTreasuryBalanceQuery();
  const { data: treasuryTransactions } = useTreasuryTransactionsQuery();

  // Mutations
  const repayMutation = useRepayCreditMutation();

  if (!isOwner) {
    return (
      <PageFrame title="Finance">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            You don't have permission to access finance features. This feature is available to store owners only.
          </p>
        </div>
      </PageFrame>
    );
  }

  // Handlers
  const handleRepayCredit = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) return;
    
    try {
      await repayMutation.mutateAsync(parseFloat(repayAmount));
      setShowRepayDialog(false);
      setRepayAmount('');
      alert('Credit repaid successfully');
    } catch {
      // Error handled by mutation
    }
  };

  // Transaction columns
  const transactionColumns: Column<TreasuryTransaction>[] = [
    {
      key: 'id',
      header: 'Transaction ID',
      render: (transaction) => transaction.id.slice(0, 8) + '...',
    },
    {
      key: 'type',
      header: 'Type',
      render: (transaction) => (
        <Badge variant={transaction.type.includes('IN') ? 'success' : transaction.type.includes('OUT') ? 'danger' : 'secondary'}>
          {transaction.type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (transaction) => formatCurrency(transaction.amount),
    },
    {
      key: 'description',
      header: 'Description',
      render: (transaction) => transaction.description,
    },
    {
      key: 'status',
      header: 'Status',
      render: (transaction) => (
        <Badge variant={transaction.status === 'COMPLETED' ? 'success' : transaction.status === 'FAILED' ? 'danger' : 'secondary'}>
          {transaction.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (transaction) => formatDate(transaction.created_at),
    },
  ];

  // Loan application columns
  const loanColumns: Column<LoanApplication>[] = [
    {
      key: 'id',
      header: 'Application ID',
      render: (loan) => loan.id.slice(0, 8) + '...',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (loan) => formatCurrency(loan.amount),
    },
    {
      key: 'tenure_months',
      header: 'Tenure',
      render: (loan) => `${loan.tenure_months} months`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (loan) => (
        <Badge variant={
          loan.status === 'APPROVED' ? 'success' : 
          loan.status === 'REJECTED' ? 'danger' : 
          loan.status === 'DISBURSED' ? 'primary' : 'secondary'
        }>
          {loan.status}
        </Badge>
      ),
    },
    {
      key: 'submitted_at',
      header: 'Applied On',
      render: (loan) => formatDate(loan.submitted_at),
    },
  ];

  // Account columns
  const accountColumns: Column<FinancialAccount>[] = [
    {
      key: 'name',
      header: 'Account Name',
      render: (account) => account.name,
    },
    {
      key: 'type',
      header: 'Type',
      render: (account) => account.type,
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (account) => formatCurrency(account.balance),
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (account) => account.currency,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (account) => (
        <Badge variant={account.is_active ? 'success' : 'secondary'}>
          {account.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (kycLoading || creditScoreLoading || creditLedgerLoading || treasuryLoading) {
    return (
      <PageFrame title="Finance">
        <div className="space-y-6">
          <SkeletonLoader width="100%" height="200px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (kycError) {
    return (
      <PageFrame title="Finance">
        <ErrorState error={normalizeApiError(kycError as unknown as ApiError)} />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Finance">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'kyc', 'credit', 'loans', 'treasury'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Credit Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(creditLedger?.balance || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Available Credit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(creditLedger?.available_credit || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Credit Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{creditScore?.score || '-'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Treasury Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(treasuryBalance?.total_balance || 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* KYC Status */}
          <Card>
            <CardHeader>
              <CardTitle>KYC Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Verification Status</p>
                  <div className="flex items-center mt-1">
                    <Badge variant={
                      kyc?.status === 'VERIFIED' ? 'success' : 
                      kyc?.status === 'REJECTED' || kyc?.status === 'FAILED' ? 'danger' : 'secondary'
                    }>
                      {kyc?.status || 'NOT_SUBMITTED'}
                    </Badge>
                    {kyc?.verified_at && (
                      <span className="ml-2 text-sm text-gray-500">
                        on {formatDate(kyc.verified_at)}
                      </span>
                    )}
                  </div>
                </div>
                {(!kyc || kyc.status === 'PENDING') && (
                  <Button variant="primary">
                    {!kyc ? 'Start KYC Process' : 'Complete KYC'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KYC Tab */}
      {activeTab === 'kyc' && kyc && (
        <Card>
          <CardHeader>
            <CardTitle>KYC Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-medium">{kyc.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={
                    kyc.status === 'VERIFIED' ? 'success' : 
                    kyc.status === 'REJECTED' || kyc.status === 'FAILED' ? 'danger' : 'secondary'
                  }>
                    {kyc.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="font-medium">{formatDate(kyc.submitted_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference ID</p>
                  <p className="font-medium">{kyc.reference_id}</p>
                </div>
              </div>
              {kyc.rejection_reason && (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Rejection Reason:</strong> {kyc.rejection_reason}
                  </p>
                </div>
              )}
              {(!kyc || kyc.status === 'PENDING') && (
                <div className="pt-4">
                  <Button variant="primary">
                    {!kyc ? 'Start KYC Process' : 'Resubmit Documents'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Tab */}
      {activeTab === 'credit' && creditLedger && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="text-lg font-bold">{formatCurrency(creditLedger.balance)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Credit</p>
                  <p className="text-lg font-bold">{formatCurrency(creditLedger.available_credit)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credit Limit</p>
                  <p className="text-lg font-bold">{formatCurrency(creditLedger.total_credit_limit)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Charges</p>
                  <p className="text-lg font-bold">{formatCurrency(creditLedger.pending_charges)}</p>
                </div>
              </div>
              {creditLedger.balance < 0 && (
                <div className="mt-4">
                  <Button 
                    variant="primary" 
                    onClick={() => setShowRepayDialog(true)}
                    loading={repayMutation.isPending}
                  >
                    Repay Credit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Add credit transactions table */}
              <EmptyState
                title="Transaction History"
                body="Credit transaction history will be displayed here."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <Card>
          <CardHeader>
            <CardTitle>Loan Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {loansLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : loanApplications && loanApplications.length > 0 ? (
              <DataTable
                columns={loanColumns}
                data={loanApplications}
              />
            ) : (
              <EmptyState
                title="No Loan Applications"
                body="You haven't applied for any loans yet."
                action={{
                  label: 'Apply for Loan',
                  onClick: () => {
                    // TODO: Implement loan application flow
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Treasury Tab */}
      {activeTab === 'treasury' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Treasury Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {treasuryBalance && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Balance</p>
                    <p className="text-lg font-bold">{formatCurrency(treasuryBalance.total_balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available</p>
                    <p className="text-lg font-bold">{formatCurrency(treasuryBalance.available_balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reserved</p>
                    <p className="text-lg font-bold">{formatCurrency(treasuryBalance.reserved_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending Transfers</p>
                    <p className="text-lg font-bold">{formatCurrency(treasuryBalance.pending_transfers)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <SkeletonLoader width="100%" height="300px" variant="rect" />
              ) : accounts && accounts.length > 0 ? (
                <DataTable
                  columns={accountColumns}
                  data={accounts}
                />
              ) : (
                <EmptyState
                  title="No Accounts"
                  body="No financial accounts found."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {treasuryTransactions && treasuryTransactions.length > 0 ? (
                <DataTable
                  columns={transactionColumns}
                  data={treasuryTransactions}
                />
              ) : (
                <EmptyState
                  title="No Transactions"
                  body="No treasury transactions found."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Repay Credit Dialog */}
      <ConfirmDialog
        open={showRepayDialog}
        title="Repay Credit"
        body="Enter the amount you want to repay:"
        confirmLabel={repayMutation.isPending ? 'Processing...' : 'Repay'}
        onConfirm={handleRepayCredit}
        onCancel={() => {
          setShowRepayDialog(false);
          setRepayAmount('');
        }}
      />
    </PageFrame>
  );
}
