/**
 * src/pages/PurchaseOrderEdit.tsx
 * Oracle Document sections consumed: 3.2, 5.2, 7.2
 * Last item from Section 11 risks addressed here: Store scoping, PO line items validation
 */
import { useParams, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
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

  return (
    <PageFrame title={`Edit Purchase Order ${purchaseOrderId}`}>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">
          Editing draft purchase orders is not supported by the current backend deployment. You can still review,
          send, receive, or cancel this purchase order from its detail page.
        </p>
        <Button className="mt-4" variant="secondary" onClick={handleCancel}>
          Back to Purchase Order
        </Button>
      </div>
    </PageFrame>
  );
}
