/**
 * src/pages/PurchaseOrderDetail.tsx
 * Oracle Document sections consumed: 3.2, 5.2, 7.2
 * Last item from Section 11 risks addressed here: Store scoping, PO status tracking
 */
import { useParams, Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  usePurchaseOrderQuery,
  useSendPurchaseOrderMutation,
  useConfirmPurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useGeneratePdfMutation,
  useEmailPurchaseOrderMutation,
} from '@/hooks/purchaseOrders';
import { useSuppliersQuery } from '@/hooks/suppliers';
import type { BadgeProps } from '@/components/ui/Badge';
import type { Supplier } from '@/api/suppliers';
import type { ApiError } from '@/types/api';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { 
  getPurchaseOrderStatusColor, 
  getPurchaseOrderStatusText,
  canEditPurchaseOrder,
  canSendPurchaseOrder,
  canConfirmPurchaseOrder,
  canReceivePurchaseOrder,
  canCancelPurchaseOrder
} from '@/hooks/purchaseOrders';
import { authStore } from '@/stores/authStore';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const purchaseOrderId = id || '';

  // Fetch purchase order
  const { data: purchaseOrder, isLoading, error } = usePurchaseOrderQuery(purchaseOrderId);

  // Fetch suppliers for name lookup
  const { data: suppliers } = useSuppliersQuery({ is_active: true });

  // Mutations for status transitions
  const sendMutation = useSendPurchaseOrderMutation();
  const confirmMutation = useConfirmPurchaseOrderMutation();
  const receiveMutation = useReceivePurchaseOrderMutation();
  const cancelMutation = useCancelPurchaseOrderMutation();
  const generatePdfMutation = useGeneratePdfMutation();
  const emailMutation = useEmailPurchaseOrderMutation();

  // Check permissions
  const _userRole = authStore.getState().user?.role?.toLowerCase();

  // Handlers
  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync(purchaseOrderId);
      alert('Purchase order sent to supplier successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleReceive = async () => {
    if (!purchaseOrder) return;
    
    try {
      await receiveMutation.mutateAsync({ 
        purchaseOrderId, 
        data: { 
          line_items: purchaseOrder.line_items.map(item => ({
            line_item_id: item.line_item_id,
            received_quantity: item.quantity,
            notes: 'Received all items'
          }))
        } 
      });
      alert('Purchase order marked as received');
    } catch {
      // Error handled by mutation
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(purchaseOrderId);
      alert('Purchase order confirmed');
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this purchase order?')) {
      try {
        await cancelMutation.mutateAsync({ purchaseOrderId });
        alert('Purchase order cancelled');
      } catch {
        // Error handled by mutation
      }
    }
  };

  const resolveApiUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
    if (!baseUrl) {
      return path;
    }
    return new URL(path, `${baseUrl}/`).toString();
  };

  const handleDownloadPdf = async () => {
    try {
      const result = await generatePdfMutation.mutateAsync(purchaseOrderId);
      window.open(resolveApiUrl(result.url), '_blank', 'noopener,noreferrer');
    } catch {
      // Error handled by mutation
    }
  };

  const handleEmail = async () => {
    const targetEmail = window.prompt('Enter the email address to send this purchase order to:', supplier?.email || '');
    if (!targetEmail) {
      return;
    }

    try {
      await emailMutation.mutateAsync({ purchaseOrderId, email: targetEmail });
      alert('Purchase order emailed successfully');
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <PageFrame title="Purchase Order Details">
        <div className="space-y-6">
          <SkeletonLoader width="100%" height="200px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Purchase Order Details">
        <ErrorState error={error as unknown as ApiError} />
      </PageFrame>
    );
  }

  if (!purchaseOrder) {
    return (
      <PageFrame title="Purchase Order Details">
        <div>Purchase order not found</div>
      </PageFrame>
    );
  }

  const supplier = suppliers?.suppliers?.find((s: Supplier) => s.supplier_id === purchaseOrder.supplier_id);

  return (
    <PageFrame 
      title={`Purchase Order ${purchaseOrder.purchase_order_id}`}
      actions={
        <div className="flex space-x-2">
          {canEditPurchaseOrder(purchaseOrder.status) && (
            <Link to={`/purchase-orders/${purchaseOrder.purchase_order_id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
          )}
          
          {canSendPurchaseOrder(purchaseOrder.status) && (
            <Button variant="primary" onClick={handleSend} loading={sendMutation.isPending}>
              Send to Supplier
            </Button>
          )}

          {canConfirmPurchaseOrder(purchaseOrder.status) && (
            <Button variant="secondary" onClick={handleConfirm} loading={confirmMutation.isPending}>
              Confirm Order
            </Button>
          )}
          
          {canReceivePurchaseOrder(purchaseOrder.status) && (
            <Button variant="primary" onClick={handleReceive} loading={receiveMutation.isPending}>
              Mark as Received
            </Button>
          )}

          <Button variant="secondary" onClick={handleDownloadPdf} loading={generatePdfMutation.isPending}>
            Download PDF
          </Button>

          <Button variant="secondary" onClick={handleEmail} loading={emailMutation.isPending}>
            Email Supplier
          </Button>
          
          {canCancelPurchaseOrder(purchaseOrder.status) && (
            <Button variant="destructive" onClick={handleCancel} loading={cancelMutation.isPending}>
              Cancel Order
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">PO Number</label>
                <p className="mt-1">{purchaseOrder.purchase_order_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">
                  <Badge variant={getPurchaseOrderStatusColor(purchaseOrder.status) as BadgeProps['variant']}>
                    {getPurchaseOrderStatusText(purchaseOrder.status)}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Order Date</label>
                <p className="mt-1">{formatDate(purchaseOrder.order_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Expected Delivery</label>
                <p className="mt-1">
                  {purchaseOrder.expected_delivery_date 
                    ? formatDate(purchaseOrder.expected_delivery_date) 
                    : 'Not set'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Supplier Name</label>
                <p className="mt-1">{supplier?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Supplier ID</label>
                <p className="mt-1">{purchaseOrder.supplier_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.line_items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.tax_rate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.discount_rate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.total_amount || (item.quantity * item.unit_price * (1 - item.discount_rate / 100) * (1 + item.tax_rate / 100)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(purchaseOrder.total_amount - purchaseOrder.tax_amount + purchaseOrder.discount_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax Amount:</span>
                <span>{formatCurrency(purchaseOrder.tax_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount Amount:</span>
                <span>{formatCurrency(purchaseOrder.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>{formatCurrency(purchaseOrder.final_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {purchaseOrder.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{purchaseOrder.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageFrame>
  );
}
