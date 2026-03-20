/**
 * src/pages/Marketplace.tsx
 * Marketplace Page - Coming Soon
 */
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function MarketplacePage() {
  return (
    <PageFrame title="Marketplace">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Marketplace - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Supplier Marketplace</h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with a network of suppliers, compare prices, and place orders directly through the marketplace. 
              Features include supplier ratings, bulk ordering, and automated procurement workflows.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <h3 className="font-medium mb-2">Discover Suppliers</h3>
                <p className="text-sm text-gray-500">Browse and filter suppliers by category, location, and ratings</p>
              </div>
              <div className="text-center">
                <h3 className="font-medium mb-2">Compare Prices</h3>
                <p className="text-sm text-gray-500">Get quotes from multiple suppliers for the best deals</p>
              </div>
              <div className="text-center">
                <h3 className="font-medium mb-2">Place Orders</h3>
                <p className="text-sm text-gray-500">Order directly and track deliveries in real-time</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button variant="primary" size="lg">
                Get Notified When Available
              </Button>
              <p className="text-sm text-gray-500">
                In the meantime, check out our <Button variant="secondary" onClick={() => window.location.href = '/suppliers'}>Supplier Management</Button> module
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
