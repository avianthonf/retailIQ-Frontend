/**
 * src/pages/Events.tsx
 * Events Page - Coming Soon
 */
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function EventsPage() {
  return (
    <PageFrame title="Events">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Events Management - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Events & Ticketing</h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Create and manage events, sell tickets online, and track attendance. Perfect for workshops, 
              product launches, and customer appreciation events.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <h3 className="font-medium mb-2">Event Creation</h3>
                <p className="text-sm text-gray-500">Set up events with dates, pricing, and capacity limits</p>
              </div>
              <div className="text-center">
                <h3 className="font-medium mb-2">Online Ticketing</h3>
                <p className="text-sm text-gray-500">Sell tickets through your store with secure payment processing</p>
              </div>
              <div className="text-center">
                <h3 className="font-medium mb-2">Attendance Tracking</h3>
                <p className="text-sm text-gray-500">Check-in attendees and generate post-event reports</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button variant="primary" size="lg">
                Get Notified When Available
              </Button>
              <p className="text-sm text-gray-500">
                In the meantime, check out our <Button variant="secondary" onClick={() => window.location.href = '/analytics'}>Analytics Dashboard</Button> for insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
