/**
 * src/pages/PurchaseOrderEdit.tsx
 * Oracle Document sections consumed: 3.2, 5.2, 7.2
 * Last item from Section 11 risks addressed here: Store scoping, PO line items validation
 */
import { useParams, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { PurchaseOrderForm } from '@/components/purchases/PurchaseOrderForm';
import { usePurchaseOrderQuery } from '@/hooks/purchaseOrders';
import type { ApiError } from '@/types/api';

export default function PurchaseOrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const purchaseOrderId = id || '';

  // Fetch purchase order
  const { data: purchaseOrder, isLoading, error } = usePurchaseOrderQuery(purchaseOrderId);

  if (isLoading) {
    return (
      <PageFrame title="Edit Purchase Order">
        <div className="flex justify-center">
          <SkeletonLoader width="100%" height="600px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Edit Purchase Order">
        <ErrorState error={error as unknown as ApiError} />
      </PageFrame>
    );
  }

  if (!purchaseOrder) {
    return (
      <PageFrame title="Edit Purchase Order">
        <div>Purchase order not found</div>
      </PageFrame>
    );
  }

  const handleCancel = () => {
    navigate(`/purchase-orders/${purchaseOrderId}`);
  };

  const initialData = {
    supplier_id: purchaseOrder.supplier_id,
    expected_delivery_date: purchaseOrder.expected_delivery_date ?? '',
    notes: purchaseOrder.notes ?? '',
    internal_notes: purchaseOrder.internal_notes ?? '',
    line_items: purchaseOrder.line_items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      discount_rate: item.discount_rate,
      notes: item.notes ?? '',
    })),
  };

  return (
    <PageFrame title={`Edit Purchase Order ${purchaseOrderId}`}>
      <PurchaseOrderForm
        purchaseOrderId={purchaseOrderId}
        initialData={initialData}
        onSuccess={(updatedPurchaseOrderId) => navigate(`/purchase-orders/${updatedPurchaseOrderId}`)}
        onCancel={handleCancel}
      />
    </PageFrame>
  );
}
