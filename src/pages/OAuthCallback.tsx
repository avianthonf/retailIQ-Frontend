/**
 * src/pages/OAuthCallback.tsx
 * OAuth Callback Page
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing authorization...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || error);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      return;
    }

    // In a real implementation, this would exchange the code for tokens
    // For now, we'll simulate the process
    setTimeout(() => {
      // Simulate successful token exchange
      setStatus('success');
      setMessage('Authorization successful! You can close this window and return to the application.');
      
      // Store the authorization code for the parent window (in case of popup flow)
      if (window.opener) {
        window.opener.postMessage({
          type: 'oauth_success',
          code: code,
          state: state
        }, '*');
        
        // Close popup after a delay
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    }, 1500);
  }, [searchParams]);

  const handleReturn = () => {
    navigate('/');
  };

  return (
    <PageFrame title="OAuth Callback">
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            {/* Loading State */}
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">Processing Authorization</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2 text-green-600">Authorization Successful</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <Badge variant="success" className="mb-4">Authorization Code Received</Badge>
                <div className="space-y-2">
                  <Button variant="primary" onClick={handleReturn}>
                    Return to Dashboard
                  </Button>
                  {window.opener && (
                    <p className="text-sm text-gray-500">
                      This window will close automatically in 2 seconds...
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2 text-red-600">Authorization Failed</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <Badge variant="danger" className="mb-4">Error</Badge>
                <div className="space-y-2">
                  <Button variant="primary" onClick={handleReturn}>
                    Return to Dashboard
                  </Button>
                  {window.opener && (
                    <Button variant="secondary" onClick={() => window.close()}>
                      Close Window
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
