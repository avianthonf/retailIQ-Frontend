/**
 * src/router.tsx
 * Oracle Document sections consumed: 2, 7, 8, 9, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthGuard, PublicOnlyGuard, RoleGuard } from '@/utils/guards';
import { AppShell } from '@/components/layout/AppShell';

const lazyPage = (loader: () => Promise<{ default: React.ComponentType }>) => {
  const Component = React.lazy(loader);

  return function LazyPage() {
    return (
      <Suspense fallback={<div className="app-content">Loading…</div>}>
        <Component />
      </Suspense>
    );
  };
};

const LoginPage = lazyPage(() => import('@/pages/Login'));
const RegisterPage = lazyPage(() => import('@/pages/Register'));
const VerifyOtpPage = lazyPage(() => import('@/pages/VerifyOtp'));
const ForgotPasswordPage = lazyPage(() => import('@/pages/ForgotPassword'));
const ResetPasswordPage = lazyPage(() => import('@/pages/ResetPassword'));
const MfaSetupPage = lazyPage(() => import('@/pages/MfaSetup'));
const MfaVerifyPage = lazyPage(() => import('@/pages/MfaVerify'));
const DashboardPage = lazyPage(() => import('@/pages/Dashboard'));
const PosPage = lazyPage(() => import('@/pages/Pos'));
const TransactionsPage = lazyPage(() => import('@/pages/Transactions'));
const TransactionDetailPage = lazyPage(() => import('@/pages/TransactionDetail'));
const InventoryPage = lazyPage(() => import('@/pages/Inventory'));
const InventoryDetailPage = lazyPage(() => import('@/pages/InventoryDetail'));
const InventoryFormPage = lazyPage(() => import('@/pages/InventoryForm'));
const StockAuditPage = lazyPage(() => import('@/pages/StockAudit'));
const StoreProfilePage = lazyPage(() => import('@/pages/StoreProfile'));
const StoreCategoriesPage = lazyPage(() => import('@/pages/StoreCategories'));
const StoreTaxConfigPage = lazyPage(() => import('@/pages/StoreTaxConfig'));
const ReceiptsTemplatePage = lazyPage(() => import('@/pages/ReceiptsTemplate'));
const ReceiptsQueuePage = lazyPage(() => import('@/pages/ReceiptsQueue'));
const VisionOcrUploadPage = lazyPage(() => import('@/pages/VisionOcrUpload'));
const VisionOcrReviewPage = lazyPage(() => import('@/pages/VisionOcrReview'));
const PaymentsPage = lazyPage(() => import('@/pages/Payments'));
const KycPage = lazyPage(() => import('@/pages/Kyc'));
const DeveloperPage = lazyPage(() => import('@/pages/Developer'));
const MarketplacePage = lazyPage(() => import('@/pages/Marketplace'));
const ChainPage = lazyPage(() => import('@/pages/Chain'));
const WhatsAppPage = lazyPage(() => import('@/pages/WhatsApp'));
const I18nPage = lazyPage(() => import('@/pages/I18n'));
const AnalyticsPage = lazyPage(() => import('@/pages/Analytics'));
const MarketIntelligencePage = lazyPage(() => import('@/pages/MarketIntelligence'));
const EventsPage = lazyPage(() => import('@/pages/Events'));
const GstPage = lazyPage(() => import('@/pages/Gst'));
const LoyaltyPage = lazyPage(() => import('@/pages/Loyalty'));
const CreditPage = lazyPage(() => import('@/pages/Credit'));
const ForecastingPage = lazyPage(() => import('@/pages/Forecasting'));
const FinancePage = lazyPage(() => import('@/pages/Finance'));
const ForbiddenPage = lazyPage(() => import('@/pages/Forbidden'));
const NotFoundPage = lazyPage(() => import('@/pages/NotFound'));
const ServerErrorPage = lazyPage(() => import('@/pages/ServerError'));
const OAuthCallbackPage = lazyPage(() => import('@/pages/OAuthCallback'));
const OAuthAuthorizePage = lazyPage(() => import('@/pages/OAuthAuthorize'));
const SupplierPage = lazyPage(() => import('@/pages/Suppliers'));
const SupplierDetailPage = lazyPage(() => import('@/pages/SupplierDetail'));
const PurchaseOrdersPage = lazyPage(() => import('@/pages/PurchaseOrders'));
const PurchaseOrderDetailPage = lazyPage(() => import('@/pages/PurchaseOrderDetail'));
const PurchaseOrderCreatePage = lazyPage(() => import('@/pages/PurchaseOrderCreate'));
const PurchaseOrderEditPage = lazyPage(() => import('@/pages/PurchaseOrderEdit'));
const ApiValidationPage = lazyPage(() => import('@/pages/ApiValidation'));
const CustomersPage = lazyPage(() => import('@/pages/Customers'));
const CustomerDetailPage = lazyPage(() => import('@/pages/CustomerDetail'));
const StaffPerformancePage = lazyPage(() => import('@/pages/StaffPerformance'));
const StaffPerformanceDetailPage = lazyPage(() => import('@/pages/StaffPerformanceDetail'));
const PricingPage = lazyPage(() => import('@/pages/Pricing'));
const DecisionsPage = lazyPage(() => import('@/pages/Decisions'));
const EInvoicingPage = lazyPage(() => import('@/pages/EInvoicing'));
const AiAssistantPage = lazyPage(() => import('@/pages/AiAssistant'));
const OfflinePage = lazyPage(() => import('@/pages/Offline'));

function RouterRoot() {
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <RouterRoot />,
    children: [
      {
        element: <PublicOnlyGuard />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/auth/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/auth/register', element: <RegisterPage /> },
          { path: '/verify-otp', element: <VerifyOtpPage /> },
          { path: '/auth/otp', element: <VerifyOtpPage /> },
          { path: '/mfa-setup', element: <MfaSetupPage /> },
          { path: '/mfa-verify', element: <MfaVerifyPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
          { path: '/oauth/authorize', element: <OAuthAuthorizePage /> },
          { path: '/oauth/callback', element: <OAuthCallbackPage /> },
        ],
      },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Navigate to="/dashboard" replace /> },
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/pos', element: <PosPage /> },
              { path: '/transactions', element: <TransactionsPage /> },
              { path: '/transactions/:id', element: <TransactionDetailPage /> },
              { path: '/inventory', element: <InventoryPage /> },
              { path: '/inventory/new', element: <InventoryFormPage /> },
              { path: '/inventory/:productId', element: <InventoryDetailPage /> },
              { path: '/inventory/:productId/edit', element: <InventoryFormPage /> },
              { path: '/inventory/stock-audit', element: <StockAuditPage /> },
              { path: '/store/profile', element: <StoreProfilePage /> },
              { path: '/store/categories', element: <StoreCategoriesPage /> },
              { path: '/store/tax-config', element: <StoreTaxConfigPage /> },
              { path: '/suppliers', element: <SupplierPage /> },
              { path: '/suppliers/:id', element: <SupplierDetailPage /> },
              { path: '/purchase-orders', element: <PurchaseOrdersPage /> },
              { path: '/purchase-orders/create', element: <PurchaseOrderCreatePage /> },
              { path: '/purchase-orders/:id', element: <PurchaseOrderDetailPage /> },
              { path: '/purchase-orders/:id/edit', element: <PurchaseOrderEditPage /> },
              { path: '/receipts/template', element: <ReceiptsTemplatePage /> },
              { path: '/receipts/queue', element: <ReceiptsQueuePage /> },
              { path: '/vision/ocr', element: <VisionOcrUploadPage /> },
              { path: '/vision/ocr/:jobId', element: <VisionOcrReviewPage /> },
              { path: '/payments', element: <PaymentsPage /> },
              { path: '/kyc', element: <KycPage /> },
              { path: '/developer', element: <DeveloperPage /> },
              { path: '/api-validation', element: <ApiValidationPage /> },
              { path: '/customers', element: <CustomersPage /> },
              { path: '/customers/:customerId', element: <CustomerDetailPage /> },
              { path: '/staff-performance', element: <StaffPerformancePage /> },
              { path: '/staff-performance/:userId', element: <RoleGuard role="owner"><StaffPerformanceDetailPage /></RoleGuard> },
              { path: '/pricing', element: <RoleGuard role="owner"><PricingPage /></RoleGuard> },
              { path: '/decisions', element: <RoleGuard role="owner"><DecisionsPage /></RoleGuard> },
              { path: '/e-invoicing', element: <EInvoicingPage /> },
              { path: '/ai-assistant', element: <AiAssistantPage /> },
              { path: '/offline', element: <OfflinePage /> },
              { path: '/marketplace', element: <MarketplacePage /> },
              { path: '/chain', element: <ChainPage /> },
              { path: '/whatsapp', element: <WhatsAppPage /> },
              { path: '/i18n', element: <I18nPage /> },
              { path: '/analytics', element: <RoleGuard role="owner"><AnalyticsPage /></RoleGuard> },
              { path: '/market-intelligence', element: <RoleGuard role="owner"><MarketIntelligencePage /></RoleGuard> },
              { path: '/events', element: <EventsPage /> },
              { path: '/gst', element: <RoleGuard role="owner"><GstPage /></RoleGuard> },
              { path: '/loyalty', element: <LoyaltyPage /> },
              { path: '/credit', element: <CreditPage /> },
              { path: '/forecasting', element: <RoleGuard role="owner"><ForecastingPage /></RoleGuard> },
              { path: '/finance', element: <FinancePage /> },
              { path: '/403', element: <ForbiddenPage /> },
              { path: '/500', element: <ServerErrorPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
