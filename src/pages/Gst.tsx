/**
 * src/pages/Gst.tsx
 * GST Dashboard - Tax configuration and filing
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
  useGSTConfigQuery,
  useTaxConfigQuery,
  useGSTSummaryQuery,
  useGSTR1Query,
  useTaxCategoriesQuery,
  useHSNMappingsQuery,
  useUpdateGSTConfigMutation,
  useUpdateTaxConfigMutation,
  useGenerateGSTR1Mutation,
  useFileGSTR1Mutation,
  useCreateTaxCategoryMutation,
  useDeleteTaxCategoryMutation,
  useCreateHSNMappingMutation,
  useDeleteHSNMappingMutation
} from '@/hooks/gst';
import { authStore } from '@/stores/authStore';
import type { Column } from '@/components/ui/DataTable';
import type { TaxCategory, HSNMapping, GSTR1Invoice as _GSTR1Invoice } from '@/api/gst';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function GstPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'returns' | 'tax-categories' | 'hsn-mappings'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [_showEditConfig, _setShowEditConfig] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'mapping'; id: string } | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    tax_rate: 18,
    is_exempted: false,
    is_nil_rated: false,
  });
  const [mappingForm, setMappingForm] = useState({
    hsn_code: '',
    category_id: '',
    description: '',
    tax_rate: 18,
  });

  // Check if user is owner
  const user = authStore.getState().user;
  const isOwner = user?.role === 'owner';
  const tabs = (['overview', 'config', 'returns', 'tax-categories', 'hsn-mappings'] as const);

  // Queries (must be before any conditional return per React hooks rules)
  const { data: gstConfig, isLoading: configLoading, error: configError } = useGSTConfigQuery();
  const { data: _taxConfig, isLoading: _taxConfigLoading } = useTaxConfigQuery();
  const { data: gstSummary, isLoading: _summaryLoading } = useGSTSummaryQuery(selectedPeriod);
  const { data: gstr1, isLoading: _gstr1Loading } = useGSTR1Query(selectedPeriod);
  const { data: categories, isLoading: categoriesLoading } = useTaxCategoriesQuery();
  const { data: mappings, isLoading: mappingsLoading } = useHSNMappingsQuery();

  // Mutations
  const updateConfigMutation = useUpdateGSTConfigMutation();
  const _updateTaxConfigMutation = useUpdateTaxConfigMutation();
  const generateGSTR1Mutation = useGenerateGSTR1Mutation();
  const fileGSTR1Mutation = useFileGSTR1Mutation();
  const createCategoryMutation = useCreateTaxCategoryMutation();
  const deleteCategoryMutation = useDeleteTaxCategoryMutation();
  const createMappingMutation = useCreateHSNMappingMutation();
  const deleteMappingMutation = useDeleteHSNMappingMutation();

  if (!isOwner) {
    return (
      <PageFrame title="GST">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            You don't have permission to access GST features. This feature is available to store owners only.
          </p>
        </div>
      </PageFrame>
    );
  }

  // Handlers
  const _handleSaveConfig = async () => {
    try {
      await updateConfigMutation.mutateAsync(gstConfig!);
      _setShowEditConfig(false);
      alert('GST configuration updated successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleGenerateGSTR1 = async () => {
    try {
      await generateGSTR1Mutation.mutateAsync(selectedPeriod);
      alert('GSTR-1 generated successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleFileGSTR1 = async () => {
    if (!gstr1 || gstr1.status !== 'READY') return;
    
    try {
      await fileGSTR1Mutation.mutateAsync(selectedPeriod);
      alert('GSTR-1 filed successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleAddCategory = async () => {
    try {
      await createCategoryMutation.mutateAsync(categoryForm);
      setCategoryForm({ name: '', tax_rate: 18, is_exempted: false, is_nil_rated: false });
      setShowAddCategory(false);
      alert('Tax category added successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleAddMapping = async () => {
    try {
      await createMappingMutation.mutateAsync(mappingForm);
      setMappingForm({ hsn_code: '', category_id: '', description: '', tax_rate: 18 });
      setShowAddMapping(false);
      alert('HSN mapping added successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      if (deleteTarget.type === 'category') {
        await deleteCategoryMutation.mutateAsync(deleteTarget.id);
      } else {
        await deleteMappingMutation.mutateAsync(deleteTarget.id);
      }
      setDeleteTarget(null);
      alert('Deleted successfully');
    } catch {
      // Error handled by mutation
    }
  };

  // Category columns
  const categoryColumns: Column<TaxCategory>[] = [
    {
      key: 'name',
      header: 'Category Name',
      render: (category) => category.name,
    },
    {
      key: 'tax_rate',
      header: 'Tax Rate',
      render: (category) => category.is_exempted ? 'Exempted' : `${category.tax_rate}%`,
    },
    {
      key: 'cess_rate',
      header: 'CESS Rate',
      render: (category) => category.cess_rate ? `${category.cess_rate}%` : '-',
    },
    {
      key: 'is_nil_rated',
      header: 'Nil Rated',
      render: (category) => (
        <Badge variant={category.is_nil_rated ? 'success' : 'secondary'}>
          {category.is_nil_rated ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (category) => (
        <div className="flex space-x-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteTarget({ type: 'category', id: category.id })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // HSN Mapping columns
  const mappingColumns: Column<HSNMapping>[] = [
    {
      key: 'hsn_code',
      header: 'HSN Code',
      render: (mapping) => mapping.hsn_code,
    },
    {
      key: 'description',
      header: 'Description',
      render: (mapping) => mapping.description,
    },
    {
      key: 'tax_rate',
      header: 'Tax Rate',
      render: (mapping) => `${mapping.tax_rate}%`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (mapping) => (
        <div className="flex space-x-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteTarget({ type: 'mapping', id: mapping.hsn_code })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (configLoading || _taxConfigLoading) {
    return (
      <PageFrame title="GST">
        <div className="space-y-6">
          <SkeletonLoader width="100%" height="200px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (configError) {
    return (
      <PageFrame title="GST">
        <ErrorState error={normalizeApiError(configError as unknown as ApiError)} />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="GST">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* GST Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>GST Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {gstConfig && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">GSTIN</p>
                    <p className="font-medium">{gstConfig.gstin || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Trade Name</p>
                    <p className="font-medium">{gstConfig.trade_name || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State Code</p>
                    <p className="font-medium">{gstConfig.state_code || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Return Frequency</p>
                    <p className="font-medium">{gstConfig.return_frequency}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Period Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Period Summary</CardTitle>
                <Input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-auto"
                />
              </div>
            </CardHeader>
            <CardContent>
              {gstSummary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Turnover</p>
                    <p className="text-lg font-bold">{formatCurrency(gstSummary.total_turnover)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Taxable Turnover</p>
                    <p className="text-lg font-bold">{formatCurrency(gstSummary.taxable_turnover)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Tax</p>
                    <p className="text-lg font-bold">{formatCurrency(gstSummary.total_tax)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">IGST Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(gstSummary.igst)}</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No Data"
                  body="No GST summary available for selected period."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && gstConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>GST Configuration</CardTitle>
              <Button variant="primary" onClick={() => _setShowEditConfig(true)}>
                Edit Configuration
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                  <Input value={gstConfig.gstin || ''} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trade Name</label>
                  <Input value={gstConfig.trade_name || ''} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State Code</label>
                  <Input value={gstConfig.state_code || ''} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Return Frequency</label>
                  <Input value={gstConfig.return_frequency} disabled />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <Input value={gstConfig.address || ''} disabled />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={gstConfig.is_composite}
                    disabled
                    className="rounded border-gray-300"
                  />
                  <label className="ml-2 text-sm text-gray-700">Composite Dealer</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={gstConfig.auto_calculation}
                    disabled
                    className="rounded border-gray-300"
                  />
                  <label className="ml-2 text-sm text-gray-700">Auto Tax Calculation</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>GSTR-1 Return</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    type="month"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-auto"
                  />
                  {gstr1 && (
                    <>
                      {gstr1.status === 'DRAFT' && (
                        <Button
                          variant="primary"
                          onClick={handleGenerateGSTR1}
                          loading={generateGSTR1Mutation.isPending}
                        >
                          Generate GSTR-1
                        </Button>
                      )}
                      {gstr1.status === 'READY' && (
                        <Button
                          variant="primary"
                          onClick={handleFileGSTR1}
                          loading={fileGSTR1Mutation.isPending}
                        >
                          File GSTR-1
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {gstr1 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge variant={
                        gstr1.status === 'FILED' ? 'success' : 
                        gstr1.status === 'READY' ? 'primary' : 
                        gstr1.status === 'ERROR' ? 'danger' : 'secondary'
                      }>
                        {gstr1.status}
                      </Badge>
                    </div>
                    {gstr1.filed_on && (
                      <div className="text-sm text-gray-500">
                        Filed on: {formatDate(gstr1.filed_on)}
                      </div>
                    )}
                  </div>
                  {gstr1.acknowledgement_number && (
                    <div>
                      <span className="text-sm text-gray-500">Acknowledgement Number:</span>
                      <span className="ml-2 font-medium">{gstr1.acknowledgement_number}</span>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No Return Data"
                  body="No GSTR-1 data available for selected period."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tax Categories Tab */}
      {activeTab === 'tax-categories' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tax Categories</CardTitle>
              <Button variant="primary" onClick={() => setShowAddCategory(true)}>
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : categories && categories.length > 0 ? (
              <DataTable
                columns={categoryColumns}
                data={categories}
              />
            ) : (
              <EmptyState
                title="No Categories"
                body="No tax categories configured."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* HSN Mappings Tab */}
      {activeTab === 'hsn-mappings' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>HSN Mappings</CardTitle>
              <Button variant="primary" onClick={() => setShowAddMapping(true)}>
                Add Mapping
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {mappingsLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : mappings && mappings.length > 0 ? (
              <DataTable
                columns={mappingColumns}
                data={mappings}
              />
            ) : (
              <EmptyState
                title="No Mappings"
                body="No HSN mappings configured."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Category Button - Simplified */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Add Tax Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                <Input
                  type="number"
                  value={categoryForm.tax_rate}
                  onChange={(e) => setCategoryForm({ ...categoryForm, tax_rate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_exempted}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_exempted: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label className="ml-2 text-sm text-gray-700">Exempted</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_nil_rated}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_nil_rated: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label className="ml-2 text-sm text-gray-700">Nil Rated</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddCategory(false);
                  setCategoryForm({ name: '', tax_rate: 18, is_exempted: false, is_nil_rated: false });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                loading={createCategoryMutation.isPending}
              >
                Add Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add HSN Mapping Button - Simplified */}
      {showAddMapping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Add HSN Mapping</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">HSN Code</label>
                <Input
                  value={mappingForm.hsn_code}
                  onChange={(e) => setMappingForm({ ...mappingForm, hsn_code: e.target.value })}
                  placeholder="Enter HSN code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={mappingForm.description}
                  onChange={(e) => setMappingForm({ ...mappingForm, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tax Category</label>
                <select
                  value={mappingForm.category_id}
                  onChange={(e) => setMappingForm({ ...mappingForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select category</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddMapping(false);
                  setMappingForm({ hsn_code: '', category_id: '', description: '', tax_rate: 18 });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMapping}
                loading={createMappingMutation.isPending}
              >
                Add Mapping
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Confirm Delete"
        body={`Are you sure you want to delete this ${deleteTarget?.type}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageFrame>
  );
}
