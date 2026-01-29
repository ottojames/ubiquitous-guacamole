import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock UnifiedAuthContext to provide default auth state for all tests
vi.mock('@/contexts/UnifiedAuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    isInitialized: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    signInAsAdmin: vi.fn(),
    canAccessAdmin: () => false,
    isPlatformAdmin: false,
    adminRole: null,
    role: null,
    userType: 'anonymous' as const,
    organizationType: null,
    organization: null,
    department: null,
    permissions: [],
    loadPermissions: vi.fn(),
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
  }),
  UnifiedAuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
  // jsdom lacks scrollIntoView; provide a no-op for tests that call it.
  HTMLElement.prototype.scrollIntoView = () => {};
}

(import.meta.env as Record<string, any>).VITE_GETADDRESS_KEY ??= 'test-key';
(import.meta.env as Record<string, any>).VITE_GETADDRESS_API_KEY ??= 'test-key';

if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class MockIntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  (window as any).IntersectionObserver = MockIntersectionObserver;
}
