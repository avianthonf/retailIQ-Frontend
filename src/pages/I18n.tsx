/**
 * src/pages/I18n.tsx
 * Internationalization Page - Coming Soon
 */
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function I18nPage() {
  return (
    <PageFrame title="Internationalization">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Internationalization - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Multi-Language Support</h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Reach a global audience with multi-language support. Translate your store interface, 
              product descriptions, and customer communications into multiple languages.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <h3 className="font-medium mb-2">Language Management</h3>
                <p className="text-sm text-gray-500">Add and manage multiple languages for your store</p>
              </div>
              <div className="text-center">
                <h3 className="font-medium mb-2">Translation Tools</h3>
                <p className="text-sm text-gray-500">Built-in translation editor with import/export capabilities</p>
              </div>
              <div className="text-center">
                <h3 className="font-medium mb-2">Auto-Detection</h3>
                <p className="text-sm text-gray-500">Automatically detect and display content in customer's preferred language</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button variant="primary" size="lg">
                Get Notified When Available
              </Button>
              <p className="text-sm text-gray-500">
                In the meantime, check out our <Button variant="secondary" onClick={() => window.location.href = '/store/profile'}>Store Settings</Button> for configuration options
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
