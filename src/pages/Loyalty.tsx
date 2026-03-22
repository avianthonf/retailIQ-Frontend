/**
 * src/pages/Loyalty.tsx
 * Loyalty Program Management
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
import { Input } from '@/components/ui/Input';
import {
  useLoyaltyProgramQuery,
  useLoyaltyAccountsQuery,
  useLoyaltyAnalyticsQuery,
  useExpiringPointsQuery,
  useUpdateLoyaltyProgramMutation,
  useCreateTierMutation,
  useUpdateTierMutation,
  useDeleteTierMutation,
  useRedeemPointsMutation,
  useAdjustPointsMutation,
  useEnrollCustomerMutation,
  useUpdateCustomerTierMutation
} from '@/hooks/loyalty';
import { authStore } from '@/stores/authStore';
import type { Column } from '@/components/ui/DataTable';
import type { LoyaltyAccount, LoyaltyTier, LoyaltyTransaction as _LoyaltyTransaction } from '@/api/loyalty';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'program' | 'customers' | 'analytics' | 'tiers'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyAccount | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  // Form states
  const [redeemForm, setRedeemForm] = useState({
    points: '',
    description: '',
  });
  const [adjustForm, setAdjustForm] = useState({
    customer_id: '',
    points: '',
    reason: '',
  });
  const [enrollForm, setEnrollForm] = useState({
    customer_id: '',
  });
  const [tierForm, setTierForm] = useState({
    name: '',
    description: '',
    min_points: 0,
    max_points: undefined as number | undefined,
    benefits: '',
    multiplier: 1,
  });

  // Check if user is owner or staff
  const user = authStore.getState().user;
  const canManage = user?.role === 'owner' || user?.role === 'staff';

  // Queries
  const { data: program, isLoading: programLoading, error: programError } = useLoyaltyProgramQuery();
  const { data: accounts, isLoading: accountsLoading } = useLoyaltyAccountsQuery(
    searchQuery ? { query: searchQuery } : undefined
  );
  const { data: analytics, isLoading: _analyticsLoading } = useLoyaltyAnalyticsQuery();
  const { data: expiringPoints } = useExpiringPointsQuery();

  // Mutations
  const _updateProgramMutation = useUpdateLoyaltyProgramMutation();
  const createTierMutation = useCreateTierMutation();
  const updateTierMutation = useUpdateTierMutation();
  const deleteTierMutation = useDeleteTierMutation();
  const redeemMutation = useRedeemPointsMutation();
  const adjustMutation = useAdjustPointsMutation();
  const enrollMutation = useEnrollCustomerMutation();
  const _updateTierCustomerMutation = useUpdateCustomerTierMutation();

  // Handlers
  const handleRedeemPoints = async () => {
    if (!selectedCustomer || !redeemForm.points) return;
    
    try {
      await redeemMutation.mutateAsync({
        customer_id: selectedCustomer.customer_id,
        points: parseInt(redeemForm.points),
        description: redeemForm.description,
      });
      setShowRedeemDialog(false);
      setRedeemForm({ points: '', description: '' });
      setSelectedCustomer(null);
      alert('Points redeemed successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleAdjustPoints = async () => {
    if (!adjustForm.customer_id || !adjustForm.points) return;
    
    try {
      await adjustMutation.mutateAsync({
        customer_id: adjustForm.customer_id,
        points: parseInt(adjustForm.points),
        reason: adjustForm.reason,
      });
      setShowAdjustDialog(false);
      setAdjustForm({ customer_id: '', points: '', reason: '' });
      alert('Points adjusted successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleEnrollCustomer = async () => {
    if (!enrollForm.customer_id) return;
    
    try {
      await enrollMutation.mutateAsync(enrollForm.customer_id);
      setShowEnrollDialog(false);
      setEnrollForm({ customer_id: '' });
      alert('Customer enrolled successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleCreateTier = async () => {
    try {
      const payload = {
        ...tierForm,
        benefits: tierForm.benefits.split(',').map((benefit) => benefit.trim()).filter(Boolean),
      };
      if (editingTierId) {
        await updateTierMutation.mutateAsync({
          id: editingTierId,
          data: payload,
        });
      } else {
        await createTierMutation.mutateAsync(payload);
      }
      setShowTierDialog(false);
      setEditingTierId(null);
      setTierForm({
        name: '',
        description: '',
        min_points: 0,
        max_points: undefined,
        benefits: '',
        multiplier: 1,
      });
      alert(editingTierId ? 'Tier updated successfully' : 'Tier created successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteTier = async () => {
    if (!deleteTarget) return;
    
    try {
      await deleteTierMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      alert('Tier deleted successfully');
    } catch {
      // Error handled by mutation
    }
  };

  // Customer columns
  const customerColumns: Column<LoyaltyAccount>[] = [
    {
      key: 'customer_name',
      header: 'Customer',
      render: (account) => (
        <div>
          <div className="font-medium">{account.customer_name}</div>
          <div className="text-sm text-gray-500">{account.customer_phone}</div>
        </div>
      ),
    },
    {
      key: 'tier_name',
      header: 'Tier',
      render: (account) => (
        <Badge variant="primary">{account.tier_name}</Badge>
      ),
    },
    {
      key: 'current_points',
      header: 'Current Points',
      render: (account) => account.current_points.toLocaleString(),
    },
    {
      key: 'lifetime_points',
      header: 'Lifetime Points',
      render: (account) => account.lifetime_points.toLocaleString(),
    },
    {
      key: 'last_activity_at',
      header: 'Last Activity',
      render: (account) => formatDate(account.last_activity_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (account) => (
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedCustomer(account);
              setShowRedeemDialog(true);
            }}
          >
            Redeem
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setAdjustForm({ ...adjustForm, customer_id: account.customer_id });
              setShowAdjustDialog(true);
            }}
          >
            Adjust
          </Button>
        </div>
      ),
    },
  ];

  // Tier columns
  const tierColumns: Column<LoyaltyTier>[] = [
    {
      key: 'name',
      header: 'Tier Name',
      render: (tier) => tier.name,
    },
    {
      key: 'min_points',
      header: 'Min Points',
      render: (tier) => tier.min_points.toLocaleString(),
    },
    {
      key: 'max_points',
      header: 'Max Points',
      render: (tier) => tier.max_points ? tier.max_points.toLocaleString() : '∞',
    },
    {
      key: 'multiplier',
      header: 'Multiplier',
      render: (tier) => `${tier.multiplier}x`,
    },
    {
      key: 'benefits',
      header: 'Benefits',
      render: (tier) => (
        <div className="space-y-1">
          {tier.benefits.slice(0, 2).map((benefit, idx) => (
            <div key={idx} className="text-sm text-gray-600">
              • {benefit}
            </div>
          ))}
          {tier.benefits.length > 2 && (
            <div className="text-sm text-gray-500">
              +{tier.benefits.length - 2} more
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tier) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingTierId(tier.id);
              setTierForm({
                name: tier.name,
                description: tier.description,
                min_points: tier.min_points,
                max_points: tier.max_points,
                benefits: tier.benefits.join(', '),
                multiplier: tier.multiplier,
              });
              setShowTierDialog(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteTarget(tier.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (programLoading) {
    return (
      <PageFrame title="Loyalty Program">
        <div className="space-y-6">
          <SkeletonLoader width="100%" height="200px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (programError) {
    return (
      <PageFrame title="Loyalty Program">
        <ErrorState error={normalizeApiError(programError as unknown as ApiError)} />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Loyalty Program">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'program', 'customers', 'analytics', 'tiers'] as const).map((tab) => (
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
      {activeTab === 'overview' && program && analytics && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_customers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.active_customers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Points Issued</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_points_issued.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Points Redeemed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_points_redeemed.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Program Status */}
          <Card>
            <CardHeader>
              <CardTitle>Program Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={program.is_active ? 'success' : 'secondary'}>
                    {program.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Points per Currency</p>
                  <p className="font-medium">{program.points_per_currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Redemption Rate</p>
                  <p className="font-medium">{formatCurrency(program.redemption_rate)} per point</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Number of Tiers</p>
                  <p className="font-medium">{program.tiers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Points */}
          {expiringPoints && expiringPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Points Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringPoints.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.customer_name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {item.points.toLocaleString()} points
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(item.expires_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Program Tab */}
      {activeTab === 'program' && program && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Program Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Program Name</label>
                  <Input value={program.name} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Badge variant={program.is_active ? 'success' : 'secondary'}>
                    {program.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Points per Currency Unit</label>
                  <Input type="number" value={program.points_per_currency} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Redemption Rate</label>
                  <Input value={formatCurrency(program.redemption_rate)} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Redemption Points</label>
                  <Input type="number" value={program.min_redemption_points} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Points Expiry (Months)</label>
                  <Input type="number" value={program.expiry_months} disabled />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <Input value={program.description} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            {canManage && (
              <Button variant="primary" onClick={() => setShowEnrollDialog(true)}>
                Enroll Customer
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Loyalty Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : accounts && accounts.accounts.length > 0 ? (
                <DataTable
                  columns={customerColumns}
                  data={accounts.accounts}
                />
              ) : (
                <EmptyState
                  title="No Customers"
                  body="No loyalty accounts found."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.top_customers.map((customer, idx) => (
                  <div key={customer.customer_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500">#{idx + 1}</span>
                      <div>
                        <div className="font-medium">{customer.customer_name}</div>
                        <div className="text-sm text-gray-500">{customer.tier}</div>
                      </div>
                    </div>
                    <span className="font-medium">{customer.points.toLocaleString()} points</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.tier_distribution.map((tier) => (
                  <div key={tier.tier_name} className="flex items-center justify-between">
                    <span>{tier.tier_name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${tier.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {tier.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tiers Tab */}
      {activeTab === 'tiers' && program && canManage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Loyalty Tiers</CardTitle>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingTierId(null);
                  setTierForm({
                    name: '',
                    description: '',
                    min_points: 0,
                    max_points: undefined,
                    benefits: '',
                    multiplier: 1,
                  });
                  setShowTierDialog(true);
                }}
              >
                Add Tier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {program.tiers.length > 0 ? (
              <DataTable
                columns={tierColumns}
                data={program.tiers}
              />
            ) : (
              <EmptyState
                title="No Tiers"
                body="No loyalty tiers configured."
              />
            )}
          </CardContent>
        </Card>
      )}

      {showRedeemDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold">Redeem Points</h2>
            <p className="text-sm text-gray-600">
              Customer: {selectedCustomer?.customer_name} · Available:{' '}
              {selectedCustomer?.current_points.toLocaleString() ?? 0}
            </p>
            <Input
              label="Points"
              type="number"
              value={redeemForm.points}
              onChange={(event) => setRedeemForm((current) => ({ ...current, points: event.target.value }))}
            />
            <Input
              label="Description"
              value={redeemForm.description}
              onChange={(event) => setRedeemForm((current) => ({ ...current, description: event.target.value }))}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRedeemDialog(false);
                  setRedeemForm({ points: '', description: '' });
                  setSelectedCustomer(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleRedeemPoints} loading={redeemMutation.isPending}>
                Redeem
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAdjustDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold">Adjust Points</h2>
            <Input
              label="Customer ID"
              value={adjustForm.customer_id}
              onChange={(event) => setAdjustForm((current) => ({ ...current, customer_id: event.target.value }))}
            />
            <Input
              label="Points"
              type="number"
              value={adjustForm.points}
              onChange={(event) => setAdjustForm((current) => ({ ...current, points: event.target.value }))}
            />
            <Input
              label="Reason"
              value={adjustForm.reason}
              onChange={(event) => setAdjustForm((current) => ({ ...current, reason: event.target.value }))}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAdjustDialog(false);
                  setAdjustForm({ customer_id: '', points: '', reason: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAdjustPoints} loading={adjustMutation.isPending}>
                Adjust
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEnrollDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold">Enroll Customer</h2>
            <Input
              label="Customer ID"
              value={enrollForm.customer_id}
              onChange={(event) => setEnrollForm({ customer_id: event.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEnrollDialog(false);
                  setEnrollForm({ customer_id: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEnrollCustomer} loading={enrollMutation.isPending}>
                Enroll
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTierDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full space-y-4">
            <h2 className="text-lg font-bold">{editingTierId ? 'Edit Tier' : 'Create Tier'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                value={tierForm.name}
                onChange={(event) => setTierForm((current) => ({ ...current, name: event.target.value }))}
              />
              <Input
                label="Multiplier"
                type="number"
                value={tierForm.multiplier}
                onChange={(event) => setTierForm((current) => ({ ...current, multiplier: Number(event.target.value) || 1 }))}
              />
              <Input
                label="Min Points"
                type="number"
                value={tierForm.min_points}
                onChange={(event) => setTierForm((current) => ({ ...current, min_points: Number(event.target.value) || 0 }))}
              />
              <Input
                label="Max Points"
                type="number"
                value={tierForm.max_points ?? ''}
                onChange={(event) => setTierForm((current) => ({
                  ...current,
                  max_points: event.target.value ? Number(event.target.value) : undefined,
                }))}
              />
            </div>
            <Input
              label="Description"
              value={tierForm.description}
              onChange={(event) => setTierForm((current) => ({ ...current, description: event.target.value }))}
            />
            <Input
              label="Benefits (comma separated)"
              value={tierForm.benefits}
              onChange={(event) => setTierForm((current) => ({ ...current, benefits: event.target.value }))}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTierDialog(false);
                  setEditingTierId(null);
                  setTierForm({
                    name: '',
                    description: '',
                    min_points: 0,
                    max_points: undefined,
                    benefits: '',
                    multiplier: 1,
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTier} loading={createTierMutation.isPending || updateTierMutation.isPending}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tier Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Tier"
        body="Are you sure you want to delete this tier? Customers in this tier will be moved to the default tier."
        confirmLabel="Delete"
        onConfirm={handleDeleteTier}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageFrame>
  );
}
