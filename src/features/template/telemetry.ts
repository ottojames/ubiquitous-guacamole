type Payload = Record<string, unknown>;

const GLOBAL_KEYS = ['__NOTICE_PROFILE__', '__PUBLIC_NOTICE_PROFILE__', '__APP_PROFILE__'] as const;

export function readProfilePrefill<T extends Record<string, any> = Payload>(): T | null {
  if (typeof window === 'undefined') return null;
  const w = window as Record<string, unknown>;
  for (const key of GLOBAL_KEYS) {
    const candidate = w[key];
    if (candidate && typeof candidate === 'object') {
      return candidate as T;
    }
  }
  try {
    const stored = window.localStorage.getItem('notice.profile');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return parsed as T;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function trackTemplateEvent(event: string, payload: Payload = {}): void {
  if (typeof window !== 'undefined') {
    const w = window as any;
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event, ...payload });
    } else if (typeof w.track === 'function') {
      try {
        w.track(event, payload);
      } catch {
        /* ignore */
      }
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[template-event]', event, payload);
  }
}
