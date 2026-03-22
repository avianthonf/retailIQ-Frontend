/**
 * src/components/layout/AppShell.tsx
 * Oracle Document sections consumed: 2, 7, 8, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { NavLink, Outlet } from 'react-router-dom';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import type { AuthState } from '@/stores/authStore';
import type { UiState } from '@/stores/uiStore';
import { RoleBadge } from '@/components/ui/RoleBadge';

interface NavItem {
  label: string;
  to: string;
  role?: 'owner';
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'POS', to: '/pos' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Inventory', to: '/inventory' },
  { label: 'Store Profile', to: '/store/profile', role: 'owner' },
  { label: 'Categories', to: '/store/categories', role: 'owner' },
  { label: 'Tax Config', to: '/store/tax-config', role: 'owner' },
  { label: 'Customers', to: '/customers' },
  { label: 'Suppliers', to: '/suppliers' },
  { label: 'Purchase Orders', to: '/purchase-orders' },
  { label: 'Receipts', to: '/receipts/template' },
  { label: 'Vision / OCR', to: '/vision/ocr' },
  { label: 'KYC', to: '/kyc' },
  { label: 'Developer', to: '/developer' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Chain', to: '/chain' },
  { label: 'WhatsApp', to: '/whatsapp' },
  { label: 'i18n', to: '/i18n' },
  { label: 'Analytics', to: '/analytics', role: 'owner' },
  { label: 'Market Intelligence', to: '/market-intelligence', role: 'owner' },
  { label: 'Events', to: '/events' },
  { label: 'GST', to: '/gst', role: 'owner' },
  { label: 'Loyalty', to: '/loyalty' },
  { label: 'Credit', to: '/credit' },
  { label: 'Forecasting', to: '/forecasting', role: 'owner' },
  { label: 'Pricing', to: '/pricing', role: 'owner' },
  { label: 'AI Decisions', to: '/decisions', role: 'owner' },
  { label: 'E-Invoicing', to: '/e-invoicing' },
  { label: 'AI Assistant', to: '/ai-assistant' },
  { label: 'Staff Performance', to: '/staff-performance' },
  { label: 'Offline Analytics', to: '/offline' },
  { label: 'Finance', to: '/finance' },
];

export function AppShell() {
  const user = authStore((state: AuthState) => state.user);
  const role = authStore((state: AuthState) => state.role);
  const sidebarCollapsed = uiStore((state: UiState) => state.sidebarCollapsed);
  const toggleSidebar = uiStore.getState().toggleSidebar;

  const visibleNavItems = navItems.filter((item) => !item.role || item.role === role);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <aside className="app-sidebar">
        <div className="stack" style={{ marginBottom: '1.5rem' }}>
          <div>
            <strong>RetailIQ</strong>
            <div className="muted" style={{ fontSize: '0.875rem' }}>Store operations hub</div>
          </div>
          <button className="button button--ghost" type="button" onClick={toggleSidebar}>
            {sidebarCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        <nav className="stack" aria-label="Primary navigation">
          {visibleNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `button button--ghost ${isActive ? 'button--secondary' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>Signed in as</div>
            <strong>{user?.full_name ?? user?.mobile_number ?? 'Merchant user'}</strong>
          </div>
          <div className="button-row" style={{ alignItems: 'center' }}>
            <RoleBadge role={role} />
          </div>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
