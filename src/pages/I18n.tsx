import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { normalizeApiError } from '@/utils/errors';
import { useTranslationsQuery, useSupportedCurrenciesQuery, useSupportedCountriesQuery } from '@/hooks/i18n';

interface CurrencyRow { code: string; name: string; symbol: string }
interface CountryRow { code: string; name: string; currency: string }

export default function I18nPage() {
  const [activeTab, setActiveTab] = useState<'translations' | 'currencies' | 'countries'>('translations');
  const [locale, setLocale] = useState('en');
  const [search, setSearch] = useState('');

  const translationsQuery = useTranslationsQuery({ locale });
  const currenciesQuery = useSupportedCurrenciesQuery();
  const countriesQuery = useSupportedCountriesQuery();

  const catalog = translationsQuery.data?.catalog ?? {};
  const catalogEntries = Object.entries(catalog as Record<string, string>).filter(
    ([key, val]) => !search || key.toLowerCase().includes(search.toLowerCase()) || val.toLowerCase().includes(search.toLowerCase())
  );

  const currencies = ((currenciesQuery.data?.data ?? []) as unknown) as CurrencyRow[];
  const countries = ((countriesQuery.data?.data ?? []) as unknown) as CountryRow[];

  return (
    <PageFrame title="Internationalization" subtitle="Manage translations, currencies, and supported countries.">
      <div className="button-row" style={{ marginBottom: '1.5rem' }}>
        <Button variant={activeTab === 'translations' ? 'primary' : 'ghost'} onClick={() => setActiveTab('translations')}>Translations</Button>
        <Button variant={activeTab === 'currencies' ? 'primary' : 'ghost'} onClick={() => setActiveTab('currencies')}>Currencies</Button>
        <Button variant={activeTab === 'countries' ? 'primary' : 'ghost'} onClick={() => setActiveTab('countries')}>Countries</Button>
      </div>

      {activeTab === 'translations' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <CardTitle>Translation Catalog</CardTitle>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={locale} onChange={(e) => setLocale(e.target.value)} className="input" style={{ width: 120 }}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ar">Arabic</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="pt">Portuguese</option>
                </select>
                <Input placeholder="Search keys..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 200 }} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {translationsQuery.isLoading ? <SkeletonLoader variant="rect" height={300} /> : translationsQuery.isError ? (
              <ErrorState error={normalizeApiError(translationsQuery.error)} onRetry={() => void translationsQuery.refetch()} />
            ) : catalogEntries.length === 0 ? (
              <EmptyState title="No translations" body={search ? 'No keys match your search.' : 'No translation catalog available for this locale.'} />
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                <table className="table">
                  <thead><tr><th>Key</th><th>Value</th></tr></thead>
                  <tbody>
                    {catalogEntries.map(([key, val]) => (
                      <tr key={key}><td className="muted">{key}</td><td>{val}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'currencies' && (
        <Card>
          <CardHeader><CardTitle>Supported Currencies</CardTitle></CardHeader>
          <CardContent>
            {currenciesQuery.isLoading ? <SkeletonLoader variant="rect" height={200} /> : currenciesQuery.isError ? (
              <ErrorState error={normalizeApiError(currenciesQuery.error)} onRetry={() => void currenciesQuery.refetch()} />
            ) : currencies.length === 0 ? (
              <EmptyState title="No currencies" body="Currency list is not available." />
            ) : (
              <DataTable<CurrencyRow>
                columns={[
                  { key: 'code', header: 'Code', render: (row: CurrencyRow) => row.code },
                  { key: 'name', header: 'Name', render: (row: CurrencyRow) => row.name },
                  { key: 'symbol', header: 'Symbol', render: (row: CurrencyRow) => row.symbol },
                ]}
                data={currencies}
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'countries' && (
        <Card>
          <CardHeader><CardTitle>Supported Countries</CardTitle></CardHeader>
          <CardContent>
            {countriesQuery.isLoading ? <SkeletonLoader variant="rect" height={200} /> : countriesQuery.isError ? (
              <ErrorState error={normalizeApiError(countriesQuery.error)} onRetry={() => void countriesQuery.refetch()} />
            ) : countries.length === 0 ? (
              <EmptyState title="No countries" body="Country list is not available." />
            ) : (
              <DataTable<CountryRow>
                columns={[
                  { key: 'code', header: 'Code', render: (row: CountryRow) => row.code },
                  { key: 'name', header: 'Country', render: (row: CountryRow) => row.name },
                  { key: 'currency', header: 'Currency', render: (row: CountryRow) => row.currency },
                ]}
                data={countries}
              />
            )}
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
