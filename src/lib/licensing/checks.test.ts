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
    const applicant = res.find((r) => r.label.includes('Applicant name'));
    expect(applicant?.ok).toBe(false);
  });
  it('validates representation deadline', () => {
    const draft: NoticeDraft = {
      id: '1',
      createdAt: '',
      noticeType: 'Premises Licence',
      applicantName: 'A',
      applicantEmail: '',
      premisesAddress: '1 High St',
      postcode: 'AA1 1AA',
      councilName: 'Test',
      councilEmail: 'a@test.com',
      councilAddress: '1 Road',
      blueNoticeUploads: [],
      status: 'Draft',
      applicationDate: '2024-01-01',
      repsDeadline: '2024-01-29',
    };
    const res = runMandatoryChecks(draft);
    const item = res.find((r) => r.id === 'repsDeadline');
    expect(item?.ok).toBe(true);
    const missing: NoticeDraft = { ...draft, repsDeadline: '' };
    const res2 = runMandatoryChecks(missing);
    const item2 = res2.find((r) => r.id === 'repsDeadline');
    expect(item2?.ok).toBe(false);
  });
});
