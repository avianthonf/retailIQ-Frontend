/**
 * src/pages/OAuthAuthorize.tsx
 * OAuth Authorization Page
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { developerApi } from '@/api/developer';
import { authStore } from '@/stores/authStore';

export default function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<Awaited<ReturnType<typeof developerApi.authorize>> | null>(null);

  // Check if user is authenticated
  const user = authStore.getState().user;
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    // Parse OAuth parameters
    const clientId = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');
    const responseType = searchParams.get('response_type');
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!clientId || !redirectUri || !responseType || !scope) {
      setError('Missing required OAuth parameters');
      setLoading(false);
      return;
    }

    void developerApi
      .authorize({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope,
        state: state || undefined,
      })
      .then((response) => {
        setAppInfo(response);
      })
      .catch((requestError: unknown) => {
        const message =
          requestError instanceof Error ? requestError.message : 'Unable to load the authorization request.';
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams, navigate, isAuthenticated]);

  const handleApprove = async () => {
    if (!appInfo) return;

    try {
      const approval = await developerApi.approveAuthorizationRequest({
        client_id: appInfo.client_id,
        redirect_uri: appInfo.redirect_uri,
        response_type: 'code',
        scope: appInfo.scopes.join(' '),
        state: appInfo.state,
      });
      window.location.assign(approval.redirect_url);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeny = async () => {
    if (!appInfo) return;

    try {
      const params = new URLSearchParams({
        client_id: appInfo.client_id,
        redirect_uri: appInfo.redirect_uri,
        error: 'access_denied',
      });

      if (appInfo.state) {
        params.append('state', appInfo.state);
      }

      // Redirect back with error
      window.location.href = `${appInfo.redirect_uri}?${params.toString()}`;
    } catch {
      // Error handled by mutation
    }
  };

  if (loading) {
    return (
      <PageFrame title="Authorization">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authorization request...</p>
          </div>
        </div>
      </PageFrame>
    );
  }

  if (error || !appInfo) {
    return (
      <PageFrame title="Authorization Error">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Authorization Failed</h2>
              <p className="text-gray-600">{error || 'Invalid authorization request'}</p>
              <Button 
                variant="primary" 
                className="mt-4"
                onClick={() => navigate('/')}
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Authorize Application">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authorize Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Application Info */}
            <div>
              <h3 className="text-lg font-medium mb-2">{appInfo.app_name}</h3>
              {appInfo.description && (
                <p className="text-gray-600">{appInfo.description}</p>
              )}
              <div className="mt-2">
                <span className="text-sm text-gray-500">Client ID: </span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{appInfo.client_id}</code>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="font-medium mb-3">This application will be able to:</h4>
              <div className="space-y-2">
                {appInfo.scopes.map((scope) => (
                  <div key={scope} className="flex items-center space-x-2">
                    <Badge variant="secondary">{scope}</Badge>
                    <span className="text-sm text-gray-600">
                      {scope === 'read' && 'Read access to your store data'}
                      {scope === 'write' && 'Create and modify store data'}
                      {scope === 'admin' && 'Full administrative access'}
                      {!['read', 'write', 'admin'].includes(scope) && `Access to ${scope}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> By authorizing this application, you grant it access to your RetailIQ account. 
                Only authorize applications you trust.
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <Button 
                variant="primary" 
                onClick={handleApprove}
                className="flex-1"
              >
                Authorize
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleDeny}
                className="flex-1"
              >
                Deny
              </Button>
            </div>

            {/* Account Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-500">
                Authorizing as: <span className="font-medium">{user?.email}</span>
              </p>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/login')}
                className="text-sm mt-2"
              >
                Use a different account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
