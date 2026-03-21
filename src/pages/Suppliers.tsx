/**
 * src/pages/Suppliers.tsx
 * Oracle Document sections consumed: 3.2, 5.1, 7.2, 12.7
 * Last item from Section 11 risks addressed here: Mixed response envelopes, store scoping
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { ApiError } from '@/types/api';
import { authStore } from '@/stores/authStore';
import { suppliersApi } from '@/api/suppliers';

// Supplier types based on Oracle Section 4.1
interface Supplier {
  supplier_id: string;
  store_id: string;
  name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  analytics?: {
    total_orders: number;
    total_value: number;
    last_order_date?: string;
  };
}

interface _SupplierListResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  pages: number;
}

export default function Suppliers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = authStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; supplier?: Supplier }>({ open: false });

  // Fetch suppliers with pagination and filters
  const {
    data: suppliersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['suppliers', { search: searchTerm, active: !showInactive }],
    queryFn: () => suppliersApi.listSuppliers({
      search: searchTerm,
      is_active: !showInactive || undefined,
    }),
    staleTime: 30000,
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: (supplierId: string) => suppliersApi.deleteSupplier(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteDialog({ open: false });
    },
  });

  const handleEdit = (supplier: Supplier) => {
    navigate(`/suppliers/${supplier.supplier_id}/edit`);
  };

  const handleView = (supplier: Supplier) => {
    navigate(`/suppliers/${supplier.supplier_id}`);
  };

  const handleDelete = (supplier: Supplier) => {
    setDeleteDialog({ open: true, supplier });
  };

  const confirmDelete = () => {
    if (deleteDialog.supplier) {
      deleteSupplierMutation.mutate(deleteDialog.supplier.supplier_id);
    }
  };

  const handleCreatePurchaseOrder = (supplier: Supplier) => {
    navigate(`/purchase-orders/create?supplier=${supplier.supplier_id}`);
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      header: 'Supplier Name',
      render: (row: Supplier) => row.name,
    },
    {
      key: 'contact_person',
      header: 'Contact',
      render: (row: Supplier) => row.contact_person,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Supplier) => row.email || '-',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row: Supplier) => row.phone || '-',
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (row: Supplier) => row.analytics?.total_orders || 0,
    },
    {
      key: 'total_value',
      header: 'Total Value',
      render: (row: Supplier) => row.analytics?.total_value 
        ? `₹${row.analytics.total_value.toFixed(2)}`
        : '₹0.00',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Supplier) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          row.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Supplier) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(row)}
          >
            View
          </Button>
          {user?.role === 'owner' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(row)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreatePurchaseOrder(row)}
              >
                New PO
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleDelete(row)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];


  // Loading state
  if (isLoading) {
    return (
      <PageFrame title="Suppliers" subtitle="Manage store-scoped suppliers and links">
        <Card>
          <CardHeader>
            <SkeletonLoader width="30%" height="24px" variant="text" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <SkeletonLoader width="40%" height="20px" variant="text" />
                  <SkeletonLoader width="20%" height="20px" variant="text" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  // Error state
  if (error) {
    return (
      <PageFrame title="Suppliers" subtitle="Manage store-scoped suppliers and links">
        <ErrorState
          error={error as unknown as ApiError}
          onRetry={() => refetch()}
        />
      </PageFrame>
    );
  }

  const suppliers = suppliersData?.suppliers || [];

  return (
    <PageFrame title="Suppliers" subtitle="Manage store-scoped suppliers and links">
      {/* ⚠️ RISK [MEDIUM]: Suppliers are store-scoped, ensure proper tenancy */}
      
      {/* Actions Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2"
            />
            Show inactive
          </label>
        </div>
        {user?.role === 'owner' && (
          <Button onClick={() => navigate('/suppliers/create')}>
            Add Supplier
          </Button>
        )}
      </div>

      {/* Suppliers List */}
      {suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers found"
          body={searchTerm 
            ? "Try adjusting your search terms" 
            : "Get started by adding your first supplier"
          }
          action={!searchTerm && user?.role === 'owner' ? {
            label: 'Add Supplier',
            onClick: () => navigate('/suppliers/create')
          } : undefined}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={suppliers}
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Supplier?"
        body={`Are you sure you want to delete ${deleteDialog.supplier?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false })}
      />
    </PageFrame>
  );
}
