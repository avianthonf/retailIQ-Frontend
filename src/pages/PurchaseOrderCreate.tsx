/**
 * src/pages/PurchaseOrderCreate.tsx
 * Oracle Document sections consumed: 3.2, 5.2, 7.2
 * Last item from Section 11 risks addressed here: Store scoping, PO line items validation
 */
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { PurchaseOrderForm } from '@/components/purchases/PurchaseOrderForm';

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();

  const handleSuccess = (purchaseOrderId: string) => {
    alert(`Purchase Order ${purchaseOrderId} created successfully`);
    navigate(`/purchase-orders/${purchaseOrderId}`);
  };

  const handleCancel = () => {
    navigate('/purchase-orders');
  };

  return (
    <PageFrame title="Create Purchase Order">
      <PurchaseOrderForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </PageFrame>
  );
}
