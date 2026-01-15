/**
 * Demo mode utilities
 * Demo access is only available when BOTH conditions are met:
 * 1. VITE_DEMO_MODE environment variable is set to 'true'
 * 2. Application is running in development mode
 */

export function isDemoModeEnabled(): boolean {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV === true;

  // Check if DEMO_MODE is explicitly enabled
  const demoModeEnabled = import.meta.env.VITE_DEMO_MODE === 'true';

  // Both conditions must be true
  return isDevelopment && demoModeEnabled;
}

export const DEMO_ACCOUNTS = {
  council: [
    {
      email: 'licensing@westminster.gov.uk',
      name: 'Westminster Licensing',
      department: 'Licensing Department',
    },
    {
      email: 'planning@camden.gov.uk',
      name: 'Camden Planning',
      department: 'Planning Department',
    },
  ],
  firm: [
    {
      email: 'solicitor@wilsonpartners.com',
      name: 'Wilson & Partners',
      role: 'Licensing Solicitor',
    },
    {
      email: 'emma@thompsonlaw.com',
      name: 'Thompson Law',
      role: 'Planning Solicitor',
    },
  ],
  public: {
    email: 'demo@example.com',
    name: 'Demo User',
  },
};