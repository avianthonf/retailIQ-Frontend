/**
 * API Validation Test Page
 * Validates all frontend API integration points
 */
import { useState, useEffect } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { validateApiEndpoints, getValidationSummary, isApiValidationComplete } from '@/utils/apiValidation';

interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  percentage: number;
  modules: Array<{ module: string; status: string }>;
}

export default function ApiValidationPage() {
  const [results, setResults] = useState<Record<string, boolean> | null>(null);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = () => {
    setIsValidating(true);
    setTimeout(() => {
      const validationResults = validateApiEndpoints();
      const validationSummary = getValidationSummary(validationResults);
      setResults(validationResults);
      setSummary(validationSummary as ValidationSummary);
      setIsValidating(false);
    }, 100);
  };

  useEffect(() => {
    runValidation();
  }, []);

  return (
    <PageFrame title="API Validation">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Summary Card */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{summary.total}</p>
                  <p className="text-sm text-gray-600">Total Modules</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
                  <p className="text-sm text-gray-600">Passed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.percentage}%</p>
                  <p className="text-sm text-gray-600">Complete</p>
                </div>
              </div>
              {summary.percentage === 100 && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ All API endpoints are properly defined!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Module Details */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Module Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(summary?.modules ?? []).map((module) => (
                  <div key={module.module} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium capitalize">{module.module}</span>
                    <Badge variant={module.status === '✅' ? 'success' : 'danger'}>
                      {module.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <Button 
                variant="primary" 
                onClick={runValidation}
                disabled={isValidating}
              >
                {isValidating ? 'Validating...' : 'Re-run Validation'}
              </Button>
              {results && isApiValidationComplete(results) && (
                <Button variant="secondary">
                  Export Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Integration Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Next Steps for Backend Integration:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Configure VITE_API_BASE_URL in .env file</li>
                <li>Set up OAuth credentials in VITE_OAUTH_CLIENT_ID</li>
                <li>Test authentication flow with real backend</li>
                <li>Validate API response formats match TypeScript types</li>
                <li>Test error handling with real API errors</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">API Contract Validation:</h4>
              <p className="text-sm text-gray-600">
                All frontend API clients are properly defined with TypeScript interfaces.
                When backend is available, run integration tests to ensure response formats match.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
