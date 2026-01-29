import { useCallback, useEffect, useRef } from 'react';
import { API_BASE } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/ui/toast';

export interface AutoSaveOptions {
  draftId: string | null;
  formData: Record<string, unknown>;
  noticeCategory: 'licensing' | 'gambling' | 'gvol' | 'planning' | 'probate';
  noticeDefinitionId?: string;
  templateKey?: string;
  draftName?: string;
  notes?: string;
  organizationId?: string;
  departmentId?: string;
  enabled?: boolean;
  intervalMs?: number;
  onSaveSuccess?: (draftId: string) => void;
  onSaveError?: (error: string) => void;
}

export interface AutoSaveResult {
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
  error: string | null;
}

/**
 * Auto-save hook for draft persistence
 * Automatically saves form state every 30 seconds (configurable)
 * Handles version conflict detection and provides manual save option
 */
export function useAutoSave(options: AutoSaveOptions): AutoSaveResult {
  const {
    draftId,
    formData,
    noticeCategory,
    noticeDefinitionId,
    templateKey,
    draftName,
    notes,
    organizationId,
    departmentId,
    enabled = true,
    intervalMs = 30000, // 30 seconds default
    onSaveSuccess,
    onSaveError,
  } = options;

  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<Date | null>(null);
  const errorRef = useRef<string | null>(null);
  const versionRef = useRef<number>(1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveDraft = useCallback(async () => {
    // Don't save if already saving or disabled
    if (isSavingRef.current || !enabled) return;

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      isSavingRef.current = true;
      errorRef.current = null;

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const payload = {
        notice_category: noticeCategory,
        notice_definition_id: noticeDefinitionId,
        template_key: templateKey,
        form_data: formData,
        draft_name: draftName,
        notes: notes,
        organization_id: organizationId,
        department_id: departmentId,
        version: versionRef.current,
      };

      let response: Response;
      let result: any;

      if (draftId) {
        // Update existing draft
        response = await fetch(`${API_BASE}/api/drafts/${draftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } else {
        // Create new draft
        response = await fetch(`${API_BASE}/api/drafts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        if (response.status === 409) {
          // Version conflict
          const errorData = await response.json();
          throw new Error(`Version conflict: draft was modified elsewhere (current version: ${errorData.current_version})`);
        }
        throw new Error(`Save failed: ${response.status} ${response.statusText}`);
      }

      result = await response.json();
      const savedDraft = result.draft;

      // Update version for next save
      versionRef.current = savedDraft.version;
      lastSavedRef.current = new Date();

      // Show subtle save indicator
      toast('Draft saved');

      // Notify success callback with draft ID
      if (onSaveSuccess && savedDraft.id) {
        onSaveSuccess(savedDraft.id);
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') return;

      const errorMessage = error.message || 'Failed to save draft';
      errorRef.current = errorMessage;
      console.error('[AutoSave] Error:', errorMessage);

      // Show error toast
      toast(`Save failed: ${errorMessage}`);

      if (onSaveError) {
        onSaveError(errorMessage);
      }
    } finally {
      isSavingRef.current = false;
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [
    enabled,
    draftId,
    formData,
    noticeCategory,
    noticeDefinitionId,
    templateKey,
    draftName,
    notes,
    organizationId,
    departmentId,
    onSaveSuccess,
    onSaveError,
  ]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Don't auto-save if form is empty
    if (Object.keys(formData).length === 0) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule next auto-save
    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, intervalMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, formData, intervalMs, saveDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isSaving: isSavingRef.current,
    lastSaved: lastSavedRef.current,
    saveNow: saveDraft,
    error: errorRef.current,
  };
}

export default useAutoSave;
