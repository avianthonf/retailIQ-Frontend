import { useMemo, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAddStoreToChainMutation, useChainDashboardQuery, useChainGroupQuery, useCreateChainGroupMutation, useTransferSuggestionsQuery, useTransfersQuery } from '@/hooks/chain';
import * as authApi from '@/api/auth';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import { getStoredRefreshToken, setStoredRefreshToken } from '@/utils/tokenStorage';
import type { StockTransfer, TransferSuggestion } from '@/api/chain';

async function refreshChainClaims(chainGroupId: string) {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('Refresh token unavailable. Please sign in again to load chain permissions.');
  }

  const refreshed = await authApi.refreshAccessToken({ refresh_token: refreshToken });
  if (!refreshed.access_token || !refreshed.refresh_token) {
    throw new Error('Could not refresh session after creating the chain group.');
  }

  authStore.getState().setAccessToken(refreshed.access_token);
  setStoredRefreshToken(refreshed.refresh_token);

  const currentUser = authStore.getState().user;
  if (currentUser) {
    authStore.getState().setUser({
      ...currentUser,
      chain_group_id: chainGroupId,
      chain_role: 'CHAIN_OWNER',
    });
  }
}

export default function ChainPage() {
  const addToast = uiStore((state) => state.addToast);
  const user = authStore((state) => state.user);
  const chainId = user?.chain_group_id ?? '';
  const isChainOwner = user?.chain_role === 'CHAIN_OWNER';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'stores' | 'transfers' | 'suggestions'>('dashboard');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [storeIdToAdd, setStoreIdToAdd] = useState('');

  const createGroupMutation = useCreateChainGroupMutation();
  const addStoreMutation = useAddStoreToChainMutation();
  const groupQuery = useChainGroupQuery(chainId);
  const dashboardQuery = useChainDashboardQuery(chainId);
  const transfersQuery = useTransfersQuery(chainId);
  const suggestionsQuery = useTransferSuggestionsQuery(chainId);

  const transferColumns = useMemo<Column<StockTransfer>[]>(
    () => [
      {
        key: 'transfer_id',
        header: 'Transfer',
        render: (row) => row.transfer_id,
      },
      {
        key: 'route',
        header: 'Route',
        render: (row) => `${row.from_store_id} -> ${row.to_store_id}`,
      },
      {
        key: 'product_id',
        header: 'Product',
        render: (row) => row.product_id,
      },
      {
        key: 'quantity',
        header: 'Quantity',
        render: (row) => row.quantity.toLocaleString(),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => row.status,
      },
    ],
    [],
  );

  const suggestionColumns = useMemo<Column<TransferSuggestion>[]>(
    () => [
      {
        key: 'product_name',
        header: 'Product',
        render: (row) => row.product_name,
      },
      {
        key: 'route',
        header: 'Route',
        render: (row) => `${row.from_store_id} -> ${row.to_store_id}`,
      },
      {
        key: 'suggested_quantity',
        header: 'Suggested Qty',
        render: (row) => row.suggested_quantity.toLocaleString(),
      },
      {
        key: 'reason',
        header: 'Reason',
        render: (row) => row.reason,
      },
    ],
    [],
  );

  const onCreateGroup = async () => {
    if (!groupName.trim()) {
      addToast({ title: 'Name required', message: 'Enter a chain group name before continuing.', variant: 'warning' });
      return;
    }

    try {
      const created = await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
      });
      await refreshChainClaims(created.chain_id);
      setGroupName('');
      setGroupDescription('');
      addToast({ title: 'Chain group created', message: `${created.name} is now active for your account.`, variant: 'success' });
    } catch (error) {
      addToast({ title: 'Creation failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const onAddStore = async () => {
    if (!chainId) {
      return;
    }

    if (!storeIdToAdd.trim()) {
      addToast({ title: 'Store ID required', message: 'Enter the store ID to add to this chain.', variant: 'warning' });
      return;
    }

    try {
      await addStoreMutation.mutateAsync({
        chainId,
        data: { store_id: storeIdToAdd.trim() },
      });
      setStoreIdToAdd('');
      addToast({ title: 'Store added', message: 'The store was added to the chain group.', variant: 'success' });
    } catch (error) {
      addToast({ title: 'Store add failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  if (!chainId) {
    return (
      <PageFrame title="Chain Management" subtitle="Create a chain group, then add stores and monitor multi-store performance.">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Create Chain Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Chain group name" value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="RetailIQ North Region" />
              <Input label="Description" value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} placeholder="Optional operational note" />
              <Button onClick={() => void onCreateGroup()} loading={createGroupMutation.isPending}>
                Create group
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>1. The backend creates the chain group and links you as the owner.</p>
              <p>2. Your session is refreshed so chain-only endpoints start working immediately.</p>
              <p>3. You can then add member stores and use the shared dashboard below.</p>
            </CardContent>
          </Card>
        </div>
      </PageFrame>
    );
  }

  if (!isChainOwner) {
    return (
      <PageFrame title="Chain Management">
        <EmptyState title="Chain owner access required" body="This page currently supports chain-owner management flows only." />
      </PageFrame>
    );
  }

  if (groupQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <PageFrame title="Chain Management">
        <SkeletonLoader variant="rect" height={320} />
      </PageFrame>
    );
  }

  if (groupQuery.isError || dashboardQuery.isError) {
    return (
      <PageFrame title="Chain Management">
        <ErrorState error={normalizeApiError(groupQuery.error ?? dashboardQuery.error)} />
      </PageFrame>
    );
  }

  const chainGroup = groupQuery.data;
  const dashboard = dashboardQuery.data;

  return (
    <PageFrame title={chainGroup?.name ?? 'Chain Management'} subtitle="Create chain membership, review performance, and monitor transfer opportunities.">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Store To Chain</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Input
              label="Store ID"
              value={storeIdToAdd}
              onChange={(event) => setStoreIdToAdd(event.target.value)}
              placeholder="Enter an existing store ID"
            />
            <Button onClick={() => void onAddStore()} loading={addStoreMutation.isPending}>
              Add store
            </Button>
          </CardContent>
        </Card>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {(['dashboard', 'stores', 'transfers', 'suggestions'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'dashboard' && dashboard ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Stores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{dashboard.total_stores}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Revenue Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatCurrency(dashboard.total_revenue)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Transactions Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{dashboard.total_transactions.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Stores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.top_performing_stores.length === 0 ? (
                  <EmptyState title="No chain activity yet" body="Add stores to start receiving aggregated chain performance." />
                ) : (
                  dashboard.top_performing_stores.map((store) => (
                    <div key={store.store_id} className="flex items-center justify-between rounded-md border p-4">
                      <div>
                        <div className="font-medium">{store.store_name}</div>
                        <div className="text-sm text-gray-500">Store ID: {store.store_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(store.revenue)}</div>
                        <div className="text-sm text-gray-500">{store.transactions} transactions</div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === 'stores' ? (
          <Card>
            <CardHeader>
              <CardTitle>Member Stores</CardTitle>
            </CardHeader>
            <CardContent>
              {chainGroup && chainGroup.member_stores.length > 0 ? (
                <DataTable
                  columns={[
                    { key: 'store_name', header: 'Store', render: (row) => row.store_name },
                    { key: 'store_id', header: 'Store ID', render: (row) => row.store_id },
                    { key: 'joined_at', header: 'Joined', render: (row) => row.joined_at || 'Recently added' },
                    { key: 'is_active', header: 'Status', render: (row) => (row.is_active ? 'Active' : 'Inactive') },
                  ]}
                  data={chainGroup.member_stores}
                />
              ) : (
                <EmptyState title="No stores yet" body="Use the add-store flow above to build this chain group." />
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'transfers' ? (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Records</CardTitle>
            </CardHeader>
            <CardContent>
              {transfersQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={260} />
              ) : (
                <DataTable columns={transferColumns} data={transfersQuery.data ?? []} emptyMessage="No transfer records yet." />
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'suggestions' ? (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {suggestionsQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={260} />
              ) : (
                <DataTable columns={suggestionColumns} data={suggestionsQuery.data ?? []} emptyMessage="No transfer suggestions are available right now." />
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageFrame>
  );
}
