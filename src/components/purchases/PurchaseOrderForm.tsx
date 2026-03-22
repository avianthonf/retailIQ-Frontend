/**
 * src/components/purchases/PurchaseOrderForm.tsx
 * Oracle Document sections consumed: 3.2, 5.2, 7.2
 * Last item from Section 11 risks addressed here: Store scoping, PO line items validation
 */
import React from 'react';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useCreatePurchaseOrderMutation, useUpdatePurchaseOrderMutation } from '@/hooks/purchaseOrders';
import { useSuppliersQuery } from '@/hooks/suppliers';
// import { useProductsQuery } from '@/hooks/inventory';
import type { Supplier } from '@/api/suppliers';
// import type { Product } from '@/types/models';
import { formatCurrency } from '@/utils/numbers';
import { toApiDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

// Validation schema
const lineItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  tax_rate: z.number().min(0).max(100).default(0),
  discount_rate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type FormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  purchaseOrderId?: string;
  initialData?: Partial<FormData>;
  onSuccess?: (purchaseOrderId: string) => void;
  onCancel?: () => void;
}

export function PurchaseOrderForm({ purchaseOrderId, initialData, onSuccess, onCancel }: PurchaseOrderFormProps) {
  const navigate = useNavigate();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [_productSearch, _setProductSearch] = useState('');
  const { control, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: initialData || {
      line_items: [{ quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'line_items',
  });

  // Fetch suppliers
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliersQuery({ is_active: true });

  // Fetch products (not used currently)
  // const { data: products, isLoading: productsLoading } = useProductsQuery({
  //   is_active: true,
  // });

  // Create PO mutation
  const createMutation = useCreatePurchaseOrderMutation();
  const updateMutation = useUpdatePurchaseOrderMutation();
  const saveMutation = purchaseOrderId ? updateMutation : createMutation;

  // Watch for changes
  const watchedLineItems = watch('line_items');
  const watchedSupplierId = watch('supplier_id');

  // Update selected supplier
  useEffect(() => {
    if (suppliers && suppliers.suppliers && watchedSupplierId) {
      const supplier = suppliers.suppliers.find((s: Supplier) => s.supplier_id === watchedSupplierId);
      setSelectedSupplier(supplier || null);
    }
  }, [watchedSupplierId, suppliers]);

  // Calculate totals
  const calculateTotals = () => {
    return watchedLineItems.reduce(
      (acc, item) => {
        const subtotal = item.quantity * item.unit_price;
        const taxAmount = subtotal * (item.tax_rate / 100);
        const discountAmount = subtotal * (item.discount_rate / 100);
        const total = subtotal + taxAmount - discountAmount;

        return {
          subtotal: acc.subtotal + subtotal,
          taxAmount: acc.taxAmount + taxAmount,
          discountAmount: acc.discountAmount + discountAmount,
          total: acc.total + total,
        };
      },
      { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 }
    );
  };

  const totals = calculateTotals();

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      const result = purchaseOrderId
        ? await updateMutation.mutateAsync({
            purchaseOrderId,
            data,
          })
        : await createMutation.mutateAsync(data);
      onSuccess?.(result.purchase_order_id);
      if (!onSuccess) {
        navigate(`/purchase-orders/${result.purchase_order_id}`);
      }
    } catch {
      // Error is handled by the mutation
    }
  };

  // Add line item
  const addLineItem = () => {
    append({ product_id: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 });
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    remove(index);
  };

  // Product columns for search (not used currently)
  // const productColumns: Column<Product>[] = [
  //   {
  //     key: 'name',
  //     header: 'Product',
  //     render: (product: Product) => (
  //       <div>
  //         <div className="font-medium">{product.name}</div>
  //         <div className="text-sm text-gray-500">{product.sku_code}</div>
  //       </div>
  //     ),
  //   },
  //   {
  //     key: 'stock_quantity',
  //     header: 'Current Stock',
  //     render: (product: Product) => product.current_stock.toLocaleString(),
  //   },
  //   {
  //     key: 'unit_cost',
  //     header: 'Unit Cost',
  //     render: (product: Product) => formatCurrency(product.cost_price),
  //   },
  // ];

  if (suppliersLoading) {
    return <SkeletonLoader width="100%" height="400px" variant="rect" />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error State */}
      {saveMutation.error && (
        <ErrorState
          error={normalizeApiError(saveMutation.error as unknown as ApiError)}
          onRetry={() => saveMutation.reset()}
        />
      )}

      {/* Supplier Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Supplier *</label>
            <Controller
              name="supplier_id"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a supplier</option>
                  {suppliers?.suppliers?.map((supplier: Supplier) => (
                    <option key={supplier.supplier_id} value={supplier.supplier_id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.supplier_id && (
              <p className="text-sm text-red-600 mt-1">{errors.supplier_id.message}</p>
            )}
          </div>

          {selectedSupplier && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Contact:</span>
                <p className="font-medium">{selectedSupplier.contact_person}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium">{selectedSupplier.email || 'N/A'}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expected Delivery Date</label>
              <Controller
                name="expected_delivery_date"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    min={toApiDate(new Date())}
                  />
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes for supplier..."
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Internal Notes</label>
            <Controller
              name="internal_notes"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Internal notes..."
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Line Items</CardTitle>
            <button type="button" onClick={addLineItem} className="button button--secondary">
              + Add Item
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="button button--ghost text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Product *</label>
                    <Controller
                      name={`line_items.${index}.product_id`}
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                          <input
                            {...field}
                            type="text"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search products..."
                            onChange={(e) => {
                              _setProductSearch(e.target.value);
                              field.onChange(e.target.value);
                            }}
                          />
                        </div>
                      )}
                    />
                    {errors.line_items?.[index]?.product_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.line_items[index]?.product_id?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity *</label>
                    <Controller
                      name={`line_items.${index}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      )}
                    />
                    {errors.line_items?.[index]?.quantity && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.line_items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Unit Price *</label>
                    <Controller
                      name={`line_items.${index}.unit_price`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          step={0.01}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                    {errors.line_items?.[index]?.unit_price && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.line_items[index]?.unit_price?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                    <Controller
                      name={`line_items.${index}.tax_rate`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Rate (%)</label>
                    <Controller
                      name={`line_items.${index}.discount_rate`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <Controller
                      name={`line_items.${index}.notes`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Optional notes..." />
                      )}
                    />
                  </div>
                </div>

                {/* Line item total */}
                <div className="text-right text-sm">
                  <span className="text-gray-500">Item Total: </span>
                  <span className="font-medium">
                    {formatCurrency(
                      watchedLineItems[index]?.quantity * watchedLineItems[index]?.unit_price *
                      (1 + (watchedLineItems[index]?.tax_rate || 0) / 100 - (watchedLineItems[index]?.discount_rate || 0) / 100)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount:</span>
              <span className="text-red-600">-{formatCurrency(totals.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
        <Button type="button" onClick={onCancel} variant="secondary">
          Cancel
        </Button>
      )}
        <Button type="submit" loading={isSubmitting}>
          {purchaseOrderId ? 'Save Purchase Order' : 'Create Purchase Order'}
        </Button>
      </div>
    </form>
  );
}
