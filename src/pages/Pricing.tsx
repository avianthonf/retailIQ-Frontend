import { useEffect, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAiPricingOptimizeMutation } from '@/hooks/aiTools';
import {
  useApplySuggestionMutation,
  useDismissSuggestionMutation,
  usePriceHistoryQuery,
  usePricingRulesQuery,
  usePricingSuggestionsQuery,
  useUpdatePricingRulesMutation,
} from '@/hooks/pricing';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import type { PriceHistoryEntry, PricingSuggestion } from '@/types/models';

export default function PricingPage() {
  const addToast = uiStore((state) => state.addToast);
  const suggestionsQuery = usePricingSuggestionsQuery();
  const rulesQuery = usePricingRulesQuery();
  const applySuggestionMutation = useApplySuggestionMutation();
  const dismissSuggestionMutation = useDismissSuggestionMutation();
  const updateRulesMutation = useUpdatePricingRulesMutation();
  const optimizePricingMutation = useAiPricingOptimizeMutation();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'rules' | 'history' | 'optimize'>('suggestions');
  const [confirmAction, setConfirmAction] = useState<{ type: 'apply' | 'dismiss'; id: number } | null>(null);
  const [historyProductId, setHistoryProductId] = useState('');
  const [optimizeProductIds, setOptimizeProductIds] = useState('');
  const [optimizeResult, setOptimizeResult] = useState<unknown>(null);
  const [rulesForm, setRulesForm] = useState({
    min_margin_pct: '',
    max_discount_pct: '',
    competitor_match: false,
    auto_apply_threshold: '',
  });

  const historyQuery = usePriceHistoryQuery(historyProductId ? Number(historyProductId) : 0);
  const suggestions = Array.isArray(suggestionsQuery.data) ? suggestionsQuery.data : [];

  useEffect(() => {
    if (!rulesQuery.data) {
      return;
    }

    setRulesForm({
      min_margin_pct: String(rulesQuery.data.min_margin_pct),
      max_discount_pct: String(rulesQuery.data.max_discount_pct),
      competitor_match: rulesQuery.data.competitor_match,
      auto_apply_threshold: String(rulesQuery.data.auto_apply_threshold),
    });
  }, [rulesQuery.data]);

  if (suggestionsQuery.isError) {
    return (
      <PageFrame title="Pricing Engine">
        <ErrorState error={normalizeApiError(suggestionsQuery.error)} onRetry={() => void suggestionsQuery.refetch()} />
      </PageFrame>
    );
  }

  const onConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }

    try {
      if (confirmAction.type === 'apply') {
        await applySuggestionMutation.mutateAsync(confirmAction.id);
        addToast({ title: 'Suggestion applied', message: `Pricing suggestion ${confirmAction.id} was applied.`, variant: 'success' });
      } else {
        await dismissSuggestionMutation.mutateAsync(confirmAction.id);
        addToast({ title: 'Suggestion dismissed', message: `Pricing suggestion ${confirmAction.id} was dismissed.`, variant: 'info' });
      }
      setConfirmAction(null);
    } catch (error) {
      addToast({ title: 'Pricing action failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const onSaveRules = async () => {
    try {
      await updateRulesMutation.mutateAsync({
        min_margin_pct: Number(rulesForm.min_margin_pct),
        max_discount_pct: Number(rulesForm.max_discount_pct),
        competitor_match: rulesForm.competitor_match,
        auto_apply_threshold: Number(rulesForm.auto_apply_threshold),
      });
      addToast({ title: 'Rules saved', message: 'Pricing rules were updated successfully.', variant: 'success' });
    } catch (error) {
      addToast({ title: 'Rule update failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const onOptimizePricing = async () => {
    const productIds = optimizeProductIds.split(',').map((value) => value.trim()).filter(Boolean);
    if (productIds.length === 0) {
      addToast({ title: 'Product IDs required', message: 'Enter one or more product IDs to call the AI pricing optimizer.', variant: 'warning' });
      return;
    }

    try {
      const result = await optimizePricingMutation.mutateAsync({ product_ids: productIds });
      setOptimizeResult(result);
      addToast({ title: 'Optimization complete', message: `Received AI pricing output for ${productIds.length} product(s).`, variant: 'success' });
    } catch (error) {
      addToast({ title: 'Optimization failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  return (
    <PageFrame title="Pricing Engine" subtitle="Pricing suggestions, rules, price history, and AI v2 optimization flows.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'suggestions' ? 'primary' : 'ghost'} onClick={() => setActiveTab('suggestions')}>
            Suggestions
          </Button>
          <Button variant={activeTab === 'rules' ? 'primary' : 'ghost'} onClick={() => setActiveTab('rules')}>
            Rules
          </Button>
          <Button variant={activeTab === 'history' ? 'primary' : 'ghost'} onClick={() => setActiveTab('history')}>
            History
          </Button>
          <Button variant={activeTab === 'optimize' ? 'primary' : 'ghost'} onClick={() => setActiveTab('optimize')}>
            AI Optimize
          </Button>
        </div>

        {activeTab === 'suggestions' ? (
          suggestionsQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={280} />
          ) : suggestions.length === 0 ? (
            <EmptyState title="No pending suggestions" body="The backend returned no pending pricing suggestions." />
          ) : (
            <DataTable<PricingSuggestion>
              columns={[
                { key: 'product_name', header: 'Product', render: (row) => row.product_name },
                { key: 'current_price', header: 'Current', render: (row) => `Rs ${row.current_price}` },
                { key: 'suggested_price', header: 'Suggested', render: (row) => `Rs ${row.suggested_price}` },
                {
                  key: 'margin_delta',
                  header: 'Margin Delta',
                  render: (row) => (
                    <Badge variant={row.margin_delta >= 0 ? 'success' : 'danger'}>
                      {row.margin_delta >= 0 ? '+' : ''}{row.margin_delta.toFixed(2)}%
                    </Badge>
                  ),
                },
                { key: 'confidence', header: 'Confidence', render: (row) => `${Math.round(row.confidence * 100)}%` },
                { key: 'reason', header: 'Reason', render: (row) => row.reason },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setConfirmAction({ type: 'apply', id: row.id })}>Apply</Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmAction({ type: 'dismiss', id: row.id })}>Dismiss</Button>
                    </div>
                  ),
                },
              ]}
              data={suggestions}
            />
          )
        ) : null}

        {activeTab === 'rules' ? (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
            </CardHeader>
            <CardContent>
              {rulesQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={220} />
              ) : rulesQuery.isError ? (
                <ErrorState error={normalizeApiError(rulesQuery.error)} onRetry={() => void rulesQuery.refetch()} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Minimum margin %" type="number" value={rulesForm.min_margin_pct} onChange={(event) => setRulesForm((current) => ({ ...current, min_margin_pct: event.target.value }))} />
                  <Input label="Maximum discount %" type="number" value={rulesForm.max_discount_pct} onChange={(event) => setRulesForm((current) => ({ ...current, max_discount_pct: event.target.value }))} />
                  <Input label="Auto-apply threshold" type="number" value={rulesForm.auto_apply_threshold} onChange={(event) => setRulesForm((current) => ({ ...current, auto_apply_threshold: event.target.value }))} />
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={rulesForm.competitor_match}
                      onChange={(event) => setRulesForm((current) => ({ ...current, competitor_match: event.target.checked }))}
                    />
                    Match competitor pricing
                  </label>
                  <div className="md:col-span-2">
                    <Button onClick={() => void onSaveRules()} loading={updateRulesMutation.isPending}>
                      Save rules
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'history' ? (
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <Input label="Product ID" value={historyProductId} onChange={(event) => setHistoryProductId(event.target.value)} placeholder="Enter a product ID" />
              </div>
              {!historyProductId ? (
                <EmptyState title="Product required" body="Enter a product ID to inspect historical pricing changes." />
              ) : historyQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={220} />
              ) : historyQuery.isError ? (
                <ErrorState error={normalizeApiError(historyQuery.error)} onRetry={() => void historyQuery.refetch()} />
              ) : (
                <DataTable<PriceHistoryEntry>
                  columns={[
                    { key: 'changed_at', header: 'Changed At', render: (row) => row.changed_at },
                    { key: 'old_price', header: 'Old Price', render: (row) => `Rs ${row.old_price}` },
                    { key: 'new_price', header: 'New Price', render: (row) => `Rs ${row.new_price}` },
                    { key: 'source', header: 'Source', render: (row) => row.source || '-' },
                  ]}
                  data={historyQuery.data ?? []}
                  emptyMessage="No price history exists for this product."
                />
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'optimize' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI v2 Pricing Optimizer</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input
                  label="Product IDs"
                  value={optimizeProductIds}
                  onChange={(event) => setOptimizeProductIds(event.target.value)}
                  placeholder="Comma-separated product IDs"
                />
                <Button onClick={() => void onOptimizePricing()} loading={optimizePricingMutation.isPending}>
                  Optimize pricing
                </Button>
              </CardContent>
            </Card>

            {optimizeResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
                    {JSON.stringify(optimizeResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="No optimization run yet" body="Call the AI v2 optimizer to review the backend pricing output." />
            )}
          </div>
        ) : null}
      </div>

      {confirmAction ? (
        <ConfirmDialog
          open
          title={confirmAction.type === 'apply' ? 'Apply pricing suggestion' : 'Dismiss pricing suggestion'}
          body={confirmAction.type === 'apply' ? 'This will apply the backend pricing recommendation.' : 'This will dismiss the backend pricing recommendation.'}
          onConfirm={() => void onConfirmAction()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel={confirmAction.type === 'apply' ? 'Apply' : 'Dismiss'}
        />
      ) : null}
    </PageFrame>
  );
}
