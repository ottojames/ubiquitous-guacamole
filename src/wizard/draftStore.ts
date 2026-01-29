const STORAGE_KEY = "publish:draftId";

let draftIdRef: string | null = null;

export function setDraftId(id: string | null) {
  draftIdRef = id ?? null;
  if (typeof window === "undefined") return;
  try {
    if (id) {
      window.sessionStorage.setItem(STORAGE_KEY, id);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // storage may be unavailable; ignore
  }
}

export function getDraftId(): string | null {
  if (draftIdRef) return draftIdRef;
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      draftIdRef = stored;
      return stored;
    }
  } catch {
    // ignore storage read errors
  }
  return null;
}
