/**
 * Demo mode utilities
 * Demo mode is DISABLED - all accounts are real Supabase accounts
 */

export function isDemoModeEnabled(): boolean {
  // Demo mode is permanently disabled
  return false;
}

// Empty demo accounts - all authentication uses real Supabase accounts
export const DEMO_ACCOUNTS = {
  council: [] as { email: string; name: string; department: string }[],
  firm: [] as { email: string; name: string; role: string }[],
  public: {
    email: '',
    name: '',
  },
};
