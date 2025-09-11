import { describe, expect, it } from 'vitest';
import { runMandatoryChecks, calcRepsDeadline } from './checks';
import { NoticeDraft } from '@/types/notice';

describe('calcRepsDeadline', () => {
  it('adds 28 days', () => {
    expect(calcRepsDeadline('2024-01-01')).toBe('2024-01-29');
  });
});

describe('runMandatoryChecks', () => {
  it('flags missing fields', () => {
    const draft: NoticeDraft = {} as any;
    const res = runMandatoryChecks(draft);
    const applicant = res.find(r => r.message.includes('Applicant'));
    expect(applicant?.ok).toBe(false);
  });
});
