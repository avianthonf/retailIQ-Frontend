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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { normalizeApiError } from '@/utils/errors';
import {
  usePricingSuggestionsQuery,
  useApplySuggestionMutation,
  useDismissSuggestionMutation,
  usePricingRulesQuery,
  useUpdatePricingRulesMutation,
  usePriceHistoryQuery,
} from '@/hooks/pricing';
import type { PriceHistoryEntry, PricingSuggestion } from '@/types/models';

export default function PricingPage() {
  const suggestionsQuery = usePricingSuggestionsQuery();
  const rulesQuery = usePricingRulesQuery();
  const applySuggestion = useApplySuggestionMutation();
  const dismissSuggestion = useDismissSuggestionMutation();
  const updateRules = useUpdatePricingRulesMutation();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'rules' | 'history'>('suggestions');
  const [confirmAction, setConfirmAction] = useState<{ type: 'apply' | 'dismiss'; id: number } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [rulesForm, setRulesForm] = useState({
    min_margin_pct: '',
    max_discount_pct: '',
    competitor_match: false,
    auto_apply_threshold: '',
  });
  const [rulesFormInit, setRulesFormInit] = useState(false);

  const suggestions = (Array.isArray(suggestionsQuery.data) ? suggestionsQuery.data : []) as PricingSuggestion[];
  const rules = rulesQuery.data;
  const historyQuery = usePriceHistoryQuery(selectedProductId ? Number(selectedProductId) : 0);

  if (!rulesFormInit && rules) {
    setRulesForm({
      min_margin_pct: String(rules.min_margin_pct),
      max_discount_pct: String(rules.max_discount_pct),
      competitor_match: rules.competitor_match,
      auto_apply_threshold: String(rules.auto_apply_threshold),
    });
    setRulesFormInit(true);
  }

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'apply') {
      applySuggestion.mutate(confirmAction.id, { onSuccess: () => setConfirmAction(null) });
    } else {
      dismissSuggestion.mutate(confirmAction.id, { onSuccess: () => setConfirmAction(null) });
    }
  };

  const handleSaveRules = () => {
    updateRules.mutate({
      min_margin_pct: Number(rulesForm.min_margin_pct),
      max_discount_pct: Number(rulesForm.max_discount_pct),
      competitor_match: rulesForm.competitor_match,
      auto_apply_threshold: Number(rulesForm.auto_apply_threshold),
    });
  };

  if (suggestionsQuery.isError) {
    return <ErrorState error={normalizeApiError(suggestionsQuery.error)} onRetry={() => void suggestionsQuery.refetch()} />;
  }

  return (
    <PageFrame title="Pricing Engine" subtitle="AI-powered pricing suggestions and rules configuration.">
      <div className="button-row" style={{ marginBottom: '1.5rem' }}>
        <Button variant={activeTab === 'suggestions' ? 'primary' : 'ghost'} onClick={() => setActiveTab('suggestions')}>Suggestions ({suggestions.length})</Button>
        <Button variant={activeTab === 'rules' ? 'primary' : 'ghost'} onClick={() => setActiveTab('rules')}>Rules</Button>
        <Button variant={activeTab === 'history' ? 'primary' : 'ghost'} onClick={() => setActiveTab('history')}>Price History</Button>
      </div>

      {activeTab === 'suggestions' && (
        suggestionsQuery.isLoading ? <SkeletonLoader variant="rect" height={300} /> : suggestions.length === 0 ? (
          <EmptyState title="No pending suggestions" body="All pricing suggestions have been reviewed. Check back later." />
        ) : (
          <DataTable<PricingSuggestion>
            columns={[
              { key: 'product', header: 'Product', render: (row: PricingSuggestion) => row.product_name },
              { key: 'current', header: 'Current Price', render: (row: PricingSuggestion) => `₹${row.current_price}` },
              { key: 'suggested', header: 'Suggested', render: (row: PricingSuggestion) => `₹${row.suggested_price}` },
              { key: 'delta', header: 'Margin Δ', render: (row: PricingSuggestion) => (
                <Badge variant={row.margin_delta >= 0 ? 'success' : 'danger'}>{row.margin_delta >= 0 ? '+' : ''}{row.margin_delta.toFixed(1)}%</Badge>
              )},
              { key: 'confidence', header: 'Confidence', render: (row: PricingSuggestion) => `${(row.confidence * 100).toFixed(0)}%` },
              { key: 'reason', header: 'Reason', render: (row: PricingSuggestion) => row.reason },
              { key: 'actions', header: 'Actions', render: (row: PricingSuggestion) => (
                <div className="button-row">
                  <Button variant="primary" onClick={() => setConfirmAction({ type: 'apply', id: row.id })}>Apply</Button>
                  <Button variant="ghost" onClick={() => setConfirmAction({ type: 'dismiss', id: row.id })}>Dismiss</Button>
                </div>
              )},
            ]}
            data={suggestions}
          />
        )
      )}

      {activeTab === 'rules' && (
        <Card>
          <CardHeader><CardTitle>Pricing Rules Configuration</CardTitle></CardHeader>
          <CardContent>
            {rulesQuery.isLoading ? <SkeletonLoader variant="rect" height={200} /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="muted">Min Margin %</label>
                  <Input type="number" value={rulesForm.min_margin_pct} onChange={(e) => setRulesForm({ ...rulesForm, min_margin_pct: e.target.value })} />
                </div>
                <div>
                  <label className="muted">Max Discount %</label>
                  <Input type="number" value={rulesForm.max_discount_pct} onChange={(e) => setRulesForm({ ...rulesForm, max_discount_pct: e.target.value })} />
                </div>
                <div>
                  <label className="muted">Auto-Apply Threshold (confidence)</label>
                  <Input type="number" value={rulesForm.auto_apply_threshold} onChange={(e) => setRulesForm({ ...rulesForm, auto_apply_threshold: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={rulesForm.competitor_match} onChange={(e) => setRulesForm({ ...rulesForm, competitor_match: e.target.checked })} />
                  <label>Competitor Price Matching</label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Button onClick={handleSaveRules} disabled={updateRules.isPending}>
                    {updateRules.isPending ? 'Saving...' : 'Save Rules'}
                  </Button>
                  {updateRules.isSuccess && <span className="text-success" style={{ marginLeft: '0.5rem' }}>Saved!</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader><CardTitle>Price History</CardTitle></CardHeader>
          <CardContent>
            <div className="button-row" style={{ marginBottom: '1rem' }}>
              <Input placeholder="Product ID" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ maxWidth: 200 }} />
            </div>
            {!selectedProductId ? (
              <p className="muted">Enter a product ID to view its price history.</p>
            ) : historyQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={200} />
            ) : !historyQuery.data || (historyQuery.data as unknown[]).length === 0 ? (
              <EmptyState title="No price history" body="No price changes recorded for this product." />
            ) : (
              <DataTable<PriceHistoryEntry>
                columns={[
                  { key: 'date', header: 'Date', render: (row: PriceHistoryEntry) => row.changed_at },
                  { key: 'old', header: 'Old Price', render: (row: PriceHistoryEntry) => `₹${row.old_price}` },
                  { key: 'new', header: 'New Price', render: (row: PriceHistoryEntry) => `₹${row.new_price}` },
                  { key: 'source', header: 'Source', render: (row: PriceHistoryEntry) => row.source ?? '—' },
                ]}
                data={historyQuery.data as PriceHistoryEntry[]}
              />
            )}
          </CardContent>
        </Card>
      )}

      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmAction.type === 'apply' ? 'Apply Pricing Suggestion' : 'Dismiss Suggestion'}
          body={confirmAction.type === 'apply' ? 'This will update the product price. Continue?' : 'This will dismiss the suggestion. Continue?'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          confirmLabel={confirmAction.type === 'apply' ? 'Apply' : 'Dismiss'}
        />
      )}
    </PageFrame>
  );
}
