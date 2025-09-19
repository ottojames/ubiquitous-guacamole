import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import {
  calculateRepresentationDeadline,
  coerceNoticeForType,
  createEmptyNotice,
  TemplateNoticeSchema,
} from './schema';
import type {
  TemplateBuilderAction,
  TemplateBuilderContextValue,
  TemplateBuilderState,
  TemplateNotice,
  TemplateNoticeType,
} from './types';
import { TEMPLATE_STORAGE_KEY } from './types';

const initialNotice = createEmptyNotice();

const initialState: TemplateBuilderState = {
  step: 1,
  notice: initialNotice,
  isDirty: false,
  restoredFromDraft: false,
};

type StoragePayload = {
  notice: TemplateNotice;
  savedAt: string;
  version: number;
};

function templateBuilderReducer(state: TemplateBuilderState, action: TemplateBuilderAction): TemplateBuilderState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'RESET':
      return {
        step: 1,
        notice: createEmptyNotice(),
        isDirty: false,
        restoredFromDraft: false,
      };
    case 'PATCH_NOTICE': {
      const nextNotice = { ...state.notice, ...action.patch } as TemplateNotice;
      return {
        ...state,
        notice: nextNotice,
        isDirty: action.markDirty ?? true,
      };
    }
    case 'MERGE_NOTICE': {
      const nextNotice = { ...state.notice, ...action.notice } as TemplateNotice;
      return {
        ...state,
        notice: nextNotice,
        isDirty: action.markDirty ?? true,
      };
    }
    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
        lastSavedAt: action.timestamp,
      };
    case 'MARK_RESTORED':
      return {
        ...state,
        restoredFromDraft: true,
      };
    default:
      return state;
  }
}

const TemplateBuilderContext = React.createContext<TemplateBuilderContextValue | undefined>(undefined);

export const TemplateBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(templateBuilderReducer, initialState);
  const hydratedRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (typeof window === 'undefined') return;
    hydratedRef.current = true;
    try {
      const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoragePayload | null;
      if (!parsed || !parsed.notice) return;
      const safe = TemplateNoticeSchema.safeParse(parsed.notice);
      if (!safe.success) return;
      dispatch({ type: 'MERGE_NOTICE', notice: safe.data, markDirty: false });
      dispatch({ type: 'MARK_RESTORED' });
      if (parsed.savedAt) {
        dispatch({ type: 'MARK_SAVED', timestamp: parsed.savedAt });
      }
    } catch (error) {
      console.error('Failed to hydrate template builder draft', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const stepParam = parseInt(params.get('step') || '', 10);
    if (Number.isInteger(stepParam) && stepParam >= 1 && stepParam <= 4) {
      dispatch({ type: 'SET_STEP', step: stepParam as 1 | 2 | 3 | 4 });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('step', String(state.step));
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
  }, [state.step]);

  useEffect(() => {
    if (!state.notice.intendedPublicationDate) return;
    if (state.notice.declEditMeta?.deadlineEdited) return;
    const deadline = calculateRepresentationDeadline(state.notice.intendedPublicationDate, {
      shiftWeekend: state.notice.council?.policy?.shiftWeekendDeadline === true,
    });
    if (!deadline) return;
    if (deadline === state.notice.representationDeadline) return;
    const patch: Partial<TemplateNotice> = { representationDeadline: deadline };
    if (state.notice.declEditMeta) {
      patch.declEditMeta = undefined;
    }
    dispatch({
      type: 'PATCH_NOTICE',
      patch,
      markDirty: false,
    });
  }, [
    state.notice.intendedPublicationDate,
    state.notice.council?.policy?.shiftWeekendDeadline,
    state.notice.representationDeadline,
    state.notice.declEditMeta?.deadlineEdited,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!state.isDirty) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      try {
        const payload: StoragePayload = {
          notice: state.notice,
          savedAt: new Date().toISOString(),
          version: state.notice.autosaveVersion ?? 1,
        };
        window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(payload));
        dispatch({ type: 'MARK_SAVED', timestamp: payload.savedAt });
      } catch (error) {
        console.error('Failed to persist template draft', error);
      }
    }, 600);
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [state.notice, state.isDirty]);

  const value = useMemo<TemplateBuilderContextValue>(() => ({
    state,
    dispatch,
    setStep: (step) => dispatch({ type: 'SET_STEP', step }),
    patchNotice: (patch, markDirty = true) => dispatch({ type: 'PATCH_NOTICE', patch, markDirty }),
    mergeNotice: (patch, markDirty = true) => dispatch({ type: 'MERGE_NOTICE', notice: patch, markDirty }),
    markSaved: (timestamp) => dispatch({ type: 'MARK_SAVED', timestamp: timestamp ?? new Date().toISOString() }),
  }), [state]);

  return <TemplateBuilderContext.Provider value={value}>{children}</TemplateBuilderContext.Provider>;
};

export const useTemplateBuilder = (): TemplateBuilderContextValue => {
  const ctx = React.useContext(TemplateBuilderContext);
  if (!ctx) {
    throw new Error('useTemplateBuilder must be used within TemplateBuilderProvider');
  }
  return ctx;
};

export const useTemplateNotice = (): TemplateNotice => {
  const { state } = useTemplateBuilder();
  return state.notice;
};

export const useTemplateStep = (): [TemplateBuilderState['step'], (next: 1 | 2 | 3 | 4) => void] => {
  const { state, setStep } = useTemplateBuilder();
  return [state.step, setStep];
};

export const useTemplateNoticeType = (): [TemplateNoticeType | null, (next: TemplateNoticeType | null) => void] => {
  const { state, mergeNotice } = useTemplateBuilder();
  return [
    state.notice.noticeType,
    (next) => {
      const coerced = coerceNoticeForType(state.notice, next);
      mergeNotice({ ...coerced, noticeType: next }, true);
    },
  ];
};
