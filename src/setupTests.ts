import '@testing-library/jest-dom';

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
