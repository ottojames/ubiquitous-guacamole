import type { Dispatch } from 'react';

export type TemplateNoticeType = 'new' | 'variation' | 'review';

export interface HoursRange {
  enabled: boolean;
  start: string;
  end: string;
}

export interface WeekHours {
  mon: HoursRange;
  tue: HoursRange;
  wed: HoursRange;
  thu: HoursRange;
  fri: HoursRange;
  sat: HoursRange;
  sun: HoursRange;
}

export type ActivityKey =
  | 'alcoholOn'
  | 'alcoholOff'
  | 'lateRefreshment'
  | 'liveMusic'
  | 'recordedMusic'
  | 'dance'
  | 'similar';

export type Activities = Partial<Record<ActivityKey, WeekHours>>;

export interface AddressValue {
  line1: string;
  line2?: string;
  town?: string;
  postcode: string;
}

export interface CouncilValue {
  name: string;
  repEmail: string;
  repPostal: string;
  officeAddress?: string;
  website?: string;
  policy?: {
    shiftWeekendDeadline?: boolean;
    bankHolidayPolicy?: 'shift' | 'allow';
  };
}

export interface TemplateNotice {
  noticeType: TemplateNoticeType | null;
  applicantName: string;
  applicantAddress: string;
  contactEmail: string;
  contactPhone?: string;
  premisesName?: string;
  tradingName?: string;
  premisesAddress: AddressValue | null;
  council: CouncilValue | null;
  intendedPublicationDate: string;
  representationDeadline: string;
  representationChannel?: {
    email?: string;
    postal?: string;
    notes?: string;
  };
  activities?: Activities;
  conditionsSummary?: string;
  variationDescription?: string;
  reviewApplicant?: string;
  reviewGrounds?: string;
  autosaveVersion?: number;
}

export interface TemplateBuilderState {
  step: 1 | 2 | 3 | 4;
  notice: TemplateNotice;
  isDirty: boolean;
  restoredFromDraft: boolean;
  lastSavedAt?: string;
}

export type TemplateBuilderAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3 | 4 }
  | { type: 'RESET' }
  | { type: 'PATCH_NOTICE'; patch: Partial<TemplateNotice>; markDirty?: boolean }
  | { type: 'MERGE_NOTICE'; notice: Partial<TemplateNotice>; markDirty?: boolean }
  | { type: 'MARK_SAVED'; timestamp: string }
  | { type: 'MARK_RESTORED' };

export interface TemplateBuilderContextValue {
  state: TemplateBuilderState;
  dispatch: Dispatch<TemplateBuilderAction>;
  setStep(step: 1 | 2 | 3 | 4): void;
  patchNotice(patch: Partial<TemplateNotice>, markDirty?: boolean): void;
  mergeNotice(patch: Partial<TemplateNotice>, markDirty?: boolean): void;
  markSaved(timestamp?: string): void;
}

export interface TemplateDraftStorage {
  notice: TemplateNotice;
  savedAt: string;
  version: number;
}

export const TEMPLATE_STORAGE_KEY = 'template-builder-draft@v1';
