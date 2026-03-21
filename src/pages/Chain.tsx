/**
 * src/pages/Chain.tsx
 * Chain Management - Multi-store operations
 */
import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { useChainGroupQuery, useChainDashboardQuery, useTransfersQuery, useTransferSuggestionsQuery } from '@/hooks/chain';
import { authStore } from '@/stores/authStore';
import type { Column } from '@/components/ui/DataTable';
import type { StockTransfer, TransferSuggestion } from '@/api/chain';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function ChainPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stores' | 'transfers' | 'suggestions'>('dashboard');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  // Get user's chain ID from auth store
  const user = authStore.getState().user;
  const chainId = user?.chain_group_id;

  // Queries
  const { data: chainGroup, isLoading: groupLoading, error: groupError } = useChainGroupQuery(chainId || '');
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useChainDashboardQuery(chainId || '');
  const { data: transfers, isLoading: transfersLoading } = useTransfersQuery(chainId || '');
  const { data: suggestions, isLoading: suggestionsLoading } = useTransferSuggestionsQuery(chainId || '');

  // Check if user is a chain owner
  const isChainOwner = user?.chain_role === 'CHAIN_OWNER';

  if (!isChainOwner) {
    return (
      <PageFrame title="Chain Management">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            You don't have permission to access chain management. This feature is available to chain owners only.
          </p>
        </div>
      </PageFrame>
    );
  }

  if (!chainId) {
    return (
      <PageFrame title="Chain Management">
        <EmptyState
          title="No Chain Group"
          body="You haven't created or joined a chain group yet."
        />
      </PageFrame>
    );
  }

  if (groupLoading || dashboardLoading) {
    return (
      <PageFrame title="Chain Management">
        <div className="space-y-6">
          <SkeletonLoader width="100%" height="200px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (groupError || dashboardError) {
    return (
      <PageFrame title="Chain Management">
        <ErrorState error={normalizeApiError((groupError || dashboardError) as unknown as ApiError)} />
      </PageFrame>
    );
  }

  // Transfer table columns
  const transferColumns: Column<StockTransfer>[] = [
    {
      key: 'transfer_id',
      header: 'Transfer ID',
      render: (transfer) => transfer.transfer_id,
    },
    {
      key: 'from_store_id',
      header: 'From Store',
      render: (transfer) => {
        const store = chainGroup?.member_stores.find(s => s.store_id === transfer.from_store_id);
        return store?.store_name || transfer.from_store_id;
      },
    },
    {
      key: 'to_store_id',
      header: 'To Store',
      render: (transfer) => {
        const store = chainGroup?.member_stores.find(s => s.store_id === transfer.to_store_id);
        return store?.store_name || transfer.to_store_id;
      },
    },
    {
      key: 'product_id',
      header: 'Product',
      render: (transfer) => transfer.product_id,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (transfer) => transfer.quantity.toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (transfer) => (
        <Badge variant={transfer.status === 'COMPLETED' ? 'success' : transfer.status === 'CANCELLED' ? 'danger' : 'secondary'}>
          {transfer.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (transfer) => formatDate(transfer.created_at),
    },
  ];

  // Suggestion table columns
  const suggestionColumns: Column<TransferSuggestion>[] = [
    {
      key: 'product_name',
      header: 'Product',
      render: (suggestion) => suggestion.product_name,
    },
    {
      key: 'from_store_id',
      header: 'From Store',
      render: (suggestion) => {
        const store = chainGroup?.member_stores.find(s => s.store_id === suggestion.from_store_id);
        return store?.store_name || suggestion.from_store_id;
      },
    },
    {
      key: 'to_store_id',
      header: 'To Store',
      render: (suggestion) => {
        const store = chainGroup?.member_stores.find(s => s.store_id === suggestion.to_store_id);
        return store?.store_name || suggestion.to_store_id;
      },
    },
    {
      key: 'suggested_quantity',
      header: 'Quantity',
      render: (suggestion) => suggestion.suggested_quantity.toLocaleString(),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (suggestion) => (
        <Badge variant={suggestion.reason === 'STOCKOUT' ? 'danger' : suggestion.reason === 'OVERSTOCK' ? 'secondary' : 'primary'}>
          {suggestion.reason}
        </Badge>
      ),
    },
  ];

  return (
    <PageFrame title={`Chain Management - ${chainGroup?.name || 'Loading...'}`}>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['dashboard', 'stores', 'transfers', 'suggestions'] as const).map((tab) => (
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

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <Card>
            <CardContent className="py-4 text-sm text-gray-600">
              This frontend deployment supports chain dashboards, store visibility, and transfer suggestions. Chain
              administration actions are not exposed here until the corresponding UI flows are implemented.
            </CardContent>
          </Card>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.total_stores}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboard.total_revenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.total_transactions.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Stores */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Stores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.top_performing_stores.map((store, index) => (
                  <div key={store.store_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500">#{index + 1}</span>
                      <span className="font-medium">{store.store_name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(store.revenue)}</div>
                      <div className="text-sm text-gray-500">{store.transactions} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && chainGroup && (
        <Card>
          <CardHeader>
            <CardTitle>Member Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chainGroup.member_stores.map((store) => (
                <div key={store.store_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{store.store_name}</h3>
                    <p className="text-sm text-gray-500">ID: {store.store_id}</p>
                    <p className="text-sm text-gray-500">Joined: {formatDate(store.joined_at)}</p>
                  </div>
                  <Badge variant={store.is_active ? 'success' : 'secondary'}>
                    {store.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfers Tab */}
      {activeTab === 'transfers' && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            {transfersLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : transfers && transfers.length > 0 ? (
              <DataTable
                columns={transferColumns}
                data={transfers}
              />
            ) : (
              <EmptyState
                title="No Transfers"
                body="No stock transfers have been initiated yet."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            {suggestionsLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : suggestions && suggestions.length > 0 ? (
              <DataTable
                columns={suggestionColumns}
                data={suggestions}
              />
            ) : (
              <EmptyState
                title="No Suggestions"
                body="No transfer suggestions are available at the moment."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Transfer Confirmation Dialog */}
      <ConfirmDialog
        open={showTransferDialog}
        title="Confirm Transfer"
        body={`Are you sure you want to transfer stock from ${selectedTransfer?.from_store_id} to ${selectedTransfer?.to_store_id}?`}
        confirmLabel="Confirm Transfer"
        onConfirm={() => {
          setShowTransferDialog(false);
          setSelectedTransfer(null);
        }}
        onCancel={() => {
          setShowTransferDialog(false);
          setSelectedTransfer(null);
        }}
      />
    </PageFrame>
  );
}
