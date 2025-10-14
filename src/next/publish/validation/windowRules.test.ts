import { describe, expect, it } from 'vitest';
import { getNoticeBuilder } from '@/next/publish/schema/registry';
import { validateWindowRules } from './windowRules';
import { buildSampleDraft } from '@/next/publish/sampleData';
import { addDays, addMonths, toISODate } from '@/next/publish/utils/date';

function buildNotice(definitionId: string, adjust?: (draft: Record<string, any>) => void) {
  const builder = getNoticeBuilder(definitionId);
  if (!builder) throw new Error(`No builder for ${definitionId}`);
  const draft = buildSampleDraft(definitionId);
  if (!draft) throw new Error(`No sample draft for ${definitionId}`);
  if (adjust) adjust(draft as Record<string, any>);
  const parsed = builder.schema.parse(draft as Record<string, unknown>);
  return builder.mapToNoticeBase(parsed);
}

describe('validateWindowRules', () => {
  it('flags licensing site notice shorter than 28 days', () => {
    const notice = buildNotice('licensing-premises-new', (draft) => {
      const applicationDate = new Date(draft.APPLICATION_DATE);
      draft.DEADLINE_DATE = toISODate(addDays(applicationDate, 20));
    });
    const issues = validateWindowRules(notice);
    expect(issues.some((issue) => issue.code === 'LICENSING_SITE_NOTICE')).toBe(true);
  });

  it('flags licensing newspaper outside 10 working days without override', () => {
    const notice = buildNotice('licensing-premises-new', (draft) => {
      const applicationDate = new Date(draft.APPLICATION_DATE);
      draft.PUBLICATION_DATE = toISODate(addDays(applicationDate, 20));
    });
    const issues = validateWindowRules(notice);
    expect(issues.some((issue) => issue.code === 'LICENSING_NEWS_WINDOW')).toBe(true);
  });

  it('flags gambling site notice shorter than 28 days', () => {
    const notice = buildNotice('gambling-betting-new', (draft) => {
      const applicationDate = new Date(draft.APPLICATION_DATE);
      draft.DEADLINE_DATE = toISODate(addDays(applicationDate, 14));
    });
    const issues = validateWindowRules(notice);
    expect(issues.some((issue) => issue.code === 'GAMBLING_SITE_NOTICE')).toBe(true);
  });

  it('flags GVOL publication outside ±21 days', () => {
    const notice = buildNotice('gvol-new', (draft) => {
      const publicationDate = new Date(draft.PUBLICATION_DATE);
      draft.DEADLINE_DATE = toISODate(addDays(publicationDate, 15));
    });
    const issues = validateWindowRules(notice);
    expect(issues.some((issue) => issue.code === 'GVOL_PUBLICATION_WINDOW')).toBe(true);
  });

  it('flags planning consultation under 21 days without override', () => {
    const notice = buildNotice('planning-major', (draft) => {
      const applicationDate = new Date(draft.APPLICATION_DATE);
      draft.DEADLINE_DATE = toISODate(addDays(applicationDate, 10));
    });
    const issues = validateWindowRules(notice);
    expect(issues.some((issue) => issue.code === 'PLANNING_CONSULTATION_WINDOW')).toBe(true);
  });

  it('flags probate claims deadline under two months', () => {
    const notice = buildNotice('probate-trustee-s27', (draft) => {
      const publicationDate = new Date(draft.PUBLICATION_DATE);
      draft.DEADLINE_DATE = toISODate(addDays(publicationDate, 30));
    });
    const issues = validateWindowRules(notice);
    expect(issues.some((issue) => issue.code === 'PROBATE_DEADLINE')).toBe(true);
  });

  it('accepts probate claims deadline beyond two months', () => {
    const notice = buildNotice('probate-trustee-s27', (draft) => {
      const publicationDate = new Date(draft.PUBLICATION_DATE);
      draft.DEADLINE_DATE = toISODate(addMonths(publicationDate, 3));
    });
    const issues = validateWindowRules(notice);
    expect(issues.some((issue) => issue.code === 'PROBATE_DEADLINE')).toBe(false);
  });
});
