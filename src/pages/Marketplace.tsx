import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import {
  useMarketplaceSearchQuery,
  useMarketplaceRecommendationsQuery,
  useMarketplaceOrdersQuery,
  useCreateRfqMutation,
} from '@/hooks/marketplace';
import type { MarketplaceCatalogItem, MarketplaceOrder } from '@/types/models';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'rfq'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [rfqForm, setRfqForm] = useState({ product_name: '', quantity: '', specifications: '' });

  const searchParams = { query: searchQuery || undefined, category: category || undefined };
  const catalogQuery = useMarketplaceSearchQuery(searchParams);
  const recsQuery = useMarketplaceRecommendationsQuery();
  const ordersQuery = useMarketplaceOrdersQuery();
  const createRfq = useCreateRfqMutation();

  const catalogItems = catalogQuery.data?.items ?? (Array.isArray(catalogQuery.data) ? catalogQuery.data : []) as MarketplaceCatalogItem[];
  const recommendations = (Array.isArray(recsQuery.data) ? recsQuery.data : []) as MarketplaceCatalogItem[];
  const orders = ordersQuery.data?.orders ?? (Array.isArray(ordersQuery.data) ? ordersQuery.data : []) as MarketplaceOrder[];

  const handleCreateRfq = () => {
    if (!rfqForm.product_name || !rfqForm.quantity) return;
    createRfq.mutate({
      product_name: rfqForm.product_name,
      quantity: Number(rfqForm.quantity),
      specifications: rfqForm.specifications || undefined,
    }, {
      onSuccess: () => setRfqForm({ product_name: '', quantity: '', specifications: '' }),
    });
  };

  return (
    <PageFrame title="Marketplace" subtitle="Browse suppliers, place orders, and manage procurement.">
      <div className="button-row" style={{ marginBottom: '1.5rem' }}>
        <Button variant={activeTab === 'catalog' ? 'primary' : 'ghost'} onClick={() => setActiveTab('catalog')}>Catalog</Button>
        <Button variant={activeTab === 'orders' ? 'primary' : 'ghost'} onClick={() => setActiveTab('orders')}>Orders</Button>
        <Button variant={activeTab === 'rfq' ? 'primary' : 'ghost'} onClick={() => setActiveTab('rfq')}>Request for Quote</Button>
      </div>

      {activeTab === 'catalog' && (
        <div>
          {/* Search bar */}
          <div className="button-row" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
            <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ maxWidth: 300 }} />
            <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: 200 }} />
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="mb-6">
              <CardHeader><CardTitle>Recommended for You</CardTitle></CardHeader>
              <CardContent>
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                  {recommendations.slice(0, 6).map((item) => (
                    <div key={item.id} style={{ minWidth: 180, padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                      <strong>{item.name}</strong>
                      <div className="muted" style={{ fontSize: '0.85rem' }}>{item.supplier_name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <span>₹{item.price}</span>
                        <Badge variant="info">{item.rating.toFixed(1)}★</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Catalog results */}
          {catalogQuery.isLoading ? <SkeletonLoader variant="rect" height={300} /> : catalogQuery.isError ? (
            <ErrorState error={normalizeApiError(catalogQuery.error)} onRetry={() => void catalogQuery.refetch()} />
          ) : catalogItems.length === 0 ? (
            <EmptyState title="No products found" body="Try adjusting your search or browse by category." />
          ) : (
            <DataTable<MarketplaceCatalogItem>
              columns={[
                { key: 'name', header: 'Product', render: (row: MarketplaceCatalogItem) => row.name },
                { key: 'category', header: 'Category', render: (row: MarketplaceCatalogItem) => row.category },
                { key: 'supplier', header: 'Supplier', render: (row: MarketplaceCatalogItem) => row.supplier_name },
                { key: 'price', header: 'Price', render: (row: MarketplaceCatalogItem) => `₹${row.price}` },
                { key: 'rating', header: 'Rating', render: (row: MarketplaceCatalogItem) => <Badge variant="info">{row.rating.toFixed(1)}★</Badge> },
              ]}
              data={catalogItems}
            />
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {ordersQuery.isLoading ? <SkeletonLoader variant="rect" height={300} /> : ordersQuery.isError ? (
            <ErrorState error={normalizeApiError(ordersQuery.error)} onRetry={() => void ordersQuery.refetch()} />
          ) : orders.length === 0 ? (
            <EmptyState title="No orders" body="Your marketplace orders will appear here." />
          ) : (
            <DataTable<MarketplaceOrder>
              columns={[
                { key: 'order', header: 'Order #', render: (row: MarketplaceOrder) => row.order_number },
                { key: 'supplier', header: 'Supplier', render: (row: MarketplaceOrder) => row.supplier_name },
                { key: 'total', header: 'Total', render: (row: MarketplaceOrder) => `₹${row.total.toLocaleString()}` },
                { key: 'status', header: 'Status', render: (row: MarketplaceOrder) => {
                  const v = row.status === 'delivered' ? 'success' : row.status === 'shipped' ? 'info' : row.status === 'cancelled' ? 'danger' : 'warning';
                  return <Badge variant={v}>{row.status}</Badge>;
                }},
                { key: 'date', header: 'Date', render: (row: MarketplaceOrder) => new Date(row.created_at).toLocaleDateString() },
              ]}
              data={orders}
            />
          )}
        </div>
      )}

      {activeTab === 'rfq' && (
        <Card>
          <CardHeader><CardTitle>Create Request for Quote</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <Input placeholder="Product Name *" value={rfqForm.product_name} onChange={(e) => setRfqForm({ ...rfqForm, product_name: e.target.value })} />
              <Input type="number" placeholder="Quantity *" value={rfqForm.quantity} onChange={(e) => setRfqForm({ ...rfqForm, quantity: e.target.value })} />
              <Input placeholder="Specifications (optional)" value={rfqForm.specifications} onChange={(e) => setRfqForm({ ...rfqForm, specifications: e.target.value })} />
            </div>
            <div className="button-row" style={{ marginTop: '1rem' }}>
              <Button onClick={handleCreateRfq} disabled={createRfq.isPending}>
                {createRfq.isPending ? 'Submitting...' : 'Submit RFQ'}
              </Button>
            </div>
            {createRfq.isError && <p className="text-danger" style={{ marginTop: '0.5rem' }}>{normalizeApiError(createRfq.error).message}</p>}
            {createRfq.isSuccess && <p style={{ marginTop: '0.5rem', color: '#16a34a' }}>RFQ submitted successfully!</p>}
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
