/**
 * src/pages/PurchaseOrders.tsx
 * Oracle Document sections consumed: 3.2, 5.2, 7.2
 * Last item from Section 11 risks addressed here: Store scoping, PO status tracking
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import type { BadgeProps } from '@/components/ui/Badge';
import { usePurchaseOrdersQuery, useDeletePurchaseOrderMutation, useSendPurchaseOrderMutation } from '@/hooks/purchaseOrders';
import { useSuppliersQuery } from '@/hooks/suppliers';
import type { PurchaseOrder, ListPurchaseOrdersRequest } from '@/api/purchaseOrders';
import type { Column } from '@/components/ui/DataTable';
import type { Supplier } from '@/api/suppliers';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import { 
  getPurchaseOrderStatusColor, 
  getPurchaseOrderStatusText,
  canDeletePurchaseOrder,
  canEditPurchaseOrder,
  canSendPurchaseOrder
} from '@/hooks/purchaseOrders';
import { authStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);

  // Filters
  const [filters, setFilters] = useState<ListPurchaseOrdersRequest>({
    page: 1,
    limit: 20,
    search: '',
    sort_by: 'order_date',
    sort_order: 'desc',
  });

  // Check permissions - TODO: Implement proper permission check
  const userRole = authStore.getState().user?.role?.toLowerCase();
  const canCreatePO = userRole === 'owner' || userRole === 'manager' || userRole === 'store_owner';

  // Fetch purchase orders
  const { data: purchaseOrdersData, isLoading, error, refetch } = usePurchaseOrdersQuery(filters);

  // Fetch suppliers for filter
  const { data: suppliers } = useSuppliersQuery({ is_active: true });

  // Delete mutation
  const deleteMutation = useDeletePurchaseOrderMutation();

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (key: keyof ListPurchaseOrdersRequest, value: string | number | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Mutations
  const sendMutation = useSendPurchaseOrderMutation();

  // Handle delete
  const handleDelete = async () => {
    if (!selectedPurchaseOrder) return;
    
    try {
      await deleteMutation.mutateAsync(selectedPurchaseOrder.purchase_order_id);
      setDeleteDialogOpen(false);
      setSelectedPurchaseOrder(null);
    } catch {
      // Error handled by mutation
    }
  };

  // Handle send
  const handleSend = async (purchaseOrderId: string) => {
    try {
      await sendMutation.mutateAsync(purchaseOrderId);
      alert('Purchase order sent to supplier successfully');
    } catch {
      // Error handled by mutation
    }
  };

  // Table columns
  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'purchase_order_id',
      header: 'PO Number',
      render: (po: PurchaseOrder) => (
        <Link to={`/purchase-orders/${po.purchase_order_id}`} className="text-blue-600 hover:underline">
          {po.purchase_order_id}
        </Link>
      ),
    },
    {
      key: 'supplier_id',
      header: 'Supplier',
      render: (po: PurchaseOrder) => {
        const supplier = suppliers?.suppliers?.find((s: Supplier) => s.supplier_id === po.supplier_id);
        return supplier?.name || 'Unknown';
      },
    },
    {
      key: 'order_date',
      header: 'Order Date',
      render: (po: PurchaseOrder) => formatDate(po.order_date),
    },
    {
      key: 'expected_delivery_date',
      header: 'Expected Delivery',
      render: (po: PurchaseOrder) => po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (po: PurchaseOrder) => (
        <Badge variant={getPurchaseOrderStatusColor(po.status) as BadgeProps['variant']}>
          {getPurchaseOrderStatusText(po.status)}
        </Badge>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      render: (po: PurchaseOrder) => formatCurrency(po.final_amount),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (po: PurchaseOrder) => (
        <div className="flex space-x-2">
          <Link to={`/purchase-orders/${po.purchase_order_id}`}>
            <Button variant="ghost" size="sm">
              👁️
            </Button>
          </Link>
          
          {canEditPurchaseOrder(po.status) && (
            <Link to={`/purchase-orders/${po.purchase_order_id}/edit`}>
              <Button variant="ghost" size="sm">
                ✏️
              </Button>
            </Link>
          )}
          
          {canSendPurchaseOrder(po.status) && (
            <Button 
              variant="ghost" 
              size="sm" 
              title="Send to Supplier"
              onClick={() => handleSend(po.purchase_order_id)}
              loading={sendMutation.isPending}
            >
              📧
            </Button>
          )}
          
          {canDeletePurchaseOrder(po.status) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                setSelectedPurchaseOrder(po);
                setDeleteDialogOpen(true);
              }}
            >
              🗑️
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <PageFrame title="Purchase Orders">
        <div className="space-y-4">
          <SkeletonLoader width="100%" height="60px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  // Error state
  if (error) {
    return (
      <PageFrame title="Purchase Orders">
        <ErrorState
          error={normalizeApiError(error)}
          onRetry={() => refetch()}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame 
      title="Purchase Orders"
      actions={
        canCreatePO && (
          <Link to="/purchase-orders/create">
            <Button>
              ➕ Create Purchase Order
            </Button>
          </Link>
        )
      }
    >
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <Input
                  placeholder="Search purchase orders..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              ⚙️ Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <select
                  value={filters.supplier_id || ''}
                  onChange={(e) => handleFilterChange('supplier_id', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Suppliers</option>
                  {suppliers?.suppliers?.map((supplier: Supplier) => (
                    <option key={supplier.supplier_id} value={supplier.supplier_id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date From</label>
                <Input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date To</label>
                <Input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sort By</label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="order_date">Order Date</option>
                  <option value="expected_delivery_date">Expected Delivery</option>
                  <option value="total_amount">Total Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <select
                  value={filters.sort_order}
                  onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({purchaseOrdersData?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrdersData?.purchase_orders.length === 0 ? (
            <EmptyState
              title="No purchase orders found"
              body={
                search || filters.status || filters.supplier_id
                  ? 'Try adjusting your search or filters'
                  : 'Create your first purchase order to get started'
              }
              action={
                canCreatePO && !search && !filters.status && !filters.supplier_id ? {
                  label: 'Create Purchase Order',
                  onClick: () => navigate('/purchase-orders/create'),
                } : undefined
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={purchaseOrdersData?.purchase_orders || []}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Purchase Order"
        body={`Are you sure you want to delete purchase order ${selectedPurchaseOrder?.purchase_order_id}? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedPurchaseOrder(null);
        }}
      />
    </PageFrame>
  );
}
