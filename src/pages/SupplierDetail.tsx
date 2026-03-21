/**
 * src/pages/SupplierDetail.tsx
 * Supplier Detail Page
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { 
  useSupplierQuery
} from '@/hooks/suppliers';
import { usePurchaseOrdersQuery } from '@/hooks/purchaseOrders';
import { authStore } from '@/stores/authStore';
import type { Column } from '@/components/ui/DataTable';
import type { SupplierProduct } from '@/api/suppliers';
import type { PurchaseOrder } from '@/api/purchaseOrders';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');

  // Check if user is owner or staff
  const _user = authStore.getState().user;

  // Queries
  const { data: supplier, isLoading: supplierLoading, error: supplierError } = useSupplierQuery(supplierId!);
  const { data: ordersData, isLoading: ordersLoading } = usePurchaseOrdersQuery({
    supplier_id: supplierId!,
    limit: 10
  });

  // Product columns
  const _productColumns: Column<SupplierProduct>[] = [
    {
      key: 'sku_code',
      header: 'SKU',
      render: (product) => (
        <div>
          <div className="font-medium">{product.sku_code}</div>
          {product.supplier_sku && (
            <div className="text-sm text-gray-500">Supplier: {product.supplier_sku}</div>
          )}
        </div>
      ),
    },
    {
      key: 'product_id',
      header: 'Product ID',
      render: (product) => product.product_id,
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      render: (product) => formatCurrency(product.cost_price),
    },
    {
      key: 'min_order_quantity',
      header: 'Min Order Qty',
      render: (product) => product.min_order_quantity.toLocaleString(),
    },
    {
      key: 'lead_time_days',
      header: 'Lead Time',
      render: (product) => `${product.lead_time_days} days`,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (product) => (
        <Badge variant={product.is_active ? 'success' : 'secondary'}>
          {product.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  // Order columns
  const orderColumns: Column<PurchaseOrder>[] = [
    {
      key: 'purchase_order_id',
      header: 'PO Number',
      render: (order: PurchaseOrder) => (
        <Button
          variant="secondary"
          onClick={() => navigate(`/purchase-orders/${order.purchase_order_id}`)}
        >
          PO-{order.purchase_order_id.slice(-8)}
        </Button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: PurchaseOrder) => (
        <Badge variant={
          order.status === 'RECEIVED' ? 'success' :
          order.status === 'CONFIRMED' ? 'info' :
          order.status === 'REJECTED' ? 'danger' :
          order.status === 'DRAFT' ? 'warning' :
          'secondary'
        }>
          {order.status}
        </Badge>
      ),
    },
    {
      key: 'order_date',
      header: 'Order Date',
      render: (order: PurchaseOrder) => formatDate(order.order_date),
    },
    {
      key: 'expected_delivery_date',
      header: 'Expected Delivery',
      render: (order: PurchaseOrder) => order.expected_delivery_date ? formatDate(order.expected_delivery_date) : '-',
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      render: (order: PurchaseOrder) => formatCurrency(order.total_amount),
    },
    {
      key: 'final_amount',
      header: 'Final Amount',
      render: (order: PurchaseOrder) => formatCurrency(order.final_amount),
    },
  ];

  if (supplierLoading) {
    return (
      <PageFrame title="Supplier Details">
        <div className="space-y-6">
          <SkeletonLoader width="100%" height="200px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (supplierError) {
    return (
      <PageFrame title="Supplier Details">
        <ErrorState error={normalizeApiError(supplierError as unknown as ApiError)} />
      </PageFrame>
    );
  }

  if (!supplier) {
    return (
      <PageFrame title="Supplier Details">
        <EmptyState
          title="Supplier Not Found"
          body="The supplier you're looking for doesn't exist or has been deleted."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={supplier.name}>
      {/* Back button */}
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate('/suppliers')}>
          ← Back to Suppliers
        </Button>
      </div>

      {/* Supplier Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Supplier Information</CardTitle>
            <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
              {supplier.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Contact Person</p>
              <p className="font-medium">{supplier.contact_person}</p>
            </div>
            {supplier.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{supplier.email}</p>
              </div>
            )}
            {supplier.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{supplier.phone}</p>
              </div>
            )}
            {supplier.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{supplier.address}</p>
              </div>
            )}
            {supplier.gst_number && (
              <div>
                <p className="text-sm text-gray-500">GST Number</p>
                <p className="font-medium">{supplier.gst_number}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Supplier Since</p>
              <p className="font-medium">{formatDate(supplier.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'products', 'orders'] as const).map((tab) => (
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
          {ordersLoading ? (
            <SkeletonLoader width="100%" height="200px" variant="rect" />
          ) : ordersData && ordersData.purchase_orders.length > 0 && (
            <>
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ordersData?.purchase_orders.length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(ordersData?.purchase_orders.reduce((sum, order) => sum + order.final_amount, 0) || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Avg Order Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {ordersData?.purchase_orders.length ? 
                        formatCurrency(ordersData.purchase_orders.reduce((sum, order) => sum + order.final_amount, 0) / ordersData.purchase_orders.length) :
                        formatCurrency(0)
                      }
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              {ordersData && ordersData.purchase_orders.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Purchase Orders</CardTitle>
                      <Button
                        variant="secondary"
                        onClick={() => setActiveTab('orders')}
                      >
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ordersData.purchase_orders.slice(0, 5).map((order: PurchaseOrder) => (
                        <div key={order.purchase_order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="secondary"
                              onClick={() => navigate(`/purchase-orders/${order.purchase_order_id}`)}
                            >
                              PO-{order.purchase_order_id.slice(-8)}
                            </Button>
                            <Badge variant={
                              order.status === 'RECEIVED' ? 'success' :
                              order.status === 'CONFIRMED' ? 'info' :
                              order.status === 'REJECTED' ? 'danger' :
                              'warning'
                            }>
                              {order.status}
                            </Badge>
                            <span className="text-sm text-gray-500">{formatDate(order.order_date)}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(order.final_amount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Products</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No Products"
              body="Product listing will be available in a future update."
            />
          </CardContent>
        </Card>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : ordersData && ordersData.purchase_orders.length > 0 ? (
              <DataTable
                columns={orderColumns}
                data={ordersData.purchase_orders}
              />
            ) : (
              <EmptyState
                title="No Orders"
                body="No purchase orders found for this supplier."
              />
            )}
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
