/**
 * src/utils/guards.tsx
 * Oracle Document sections consumed: 2, 8, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { ReactNode } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { authStore } from '@/stores/authStore';
import type { AuthState } from '@/stores/authStore';
import type { UserRole } from '@/types/models';

interface RoleGuardProps {
  role: UserRole;
  children?: ReactNode;
}

export function AuthGuard() {
  const isAuthenticated = authStore((state: AuthState) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`} replace />;
  }

  return <Outlet />;
}

export function RoleGuard({ role, children }: RoleGuardProps) {
  const currentRole = authStore((state: AuthState) => state.role);

  if (currentRole !== role) {
    return <Navigate to="/403" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function PublicOnlyGuard() {
  const isAuthenticated = authStore((state: AuthState) => state.isAuthenticated);
  const location = useLocation();

  // OTP verification can be the next step after registration even if a stale
  // persisted session briefly marks the user as authenticated.
  if (location.pathname === '/verify-otp' || location.pathname === '/auth/otp') {
    return <Outlet />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
