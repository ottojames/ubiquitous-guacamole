type AnyEnv = Record<string, string | undefined>;

/**
 * Return the canonical getAddress API key while remaining compatible with legacy env names.
 * Priority order: VITE_GETADDRESS_KEY -> VITE_GETADDRESS_API_KEY -> GETADDRESS_API_KEY.
 */
export function getGetAddressKey(): string | undefined {
  const env = (import.meta.env as unknown as AnyEnv) || {};
  return (
    env.VITE_GETADDRESS_KEY ||
    env.VITE_GETADDRESS_API_KEY ||
    env.GETADDRESS_API_KEY ||
    undefined
  );
}

/**
 * Legacy compatibility helper for code that expects a base URL.
 * Prefer the local proxy to avoid leaking keys in client bundles.
 */
export function getLegacyAddressUrl(): string {
  return "/api/getaddress";
}
