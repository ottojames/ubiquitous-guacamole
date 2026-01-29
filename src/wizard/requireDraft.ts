import { getDraftId } from "./draftStore";

export function requireDraftId(): string | null {
  return getDraftId() ?? null;
}
