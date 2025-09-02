import { describe, expect, it } from 'vitest';
import { generateNotice, Hours } from '../lib/noticeTemplate';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function makeHours(start: string, end: string): Hours {
  const h: Hours = {};
  days.forEach((d) => {
    h[d] = { start, end };
  });
  return h;
}

describe('notice template', () => {
  const baseForm = {
    applicationType: 'Grant of a Premises Licence',
    applicantName: 'Jane Smith',
    councilName: 'Sample Council',
    premisesName: 'The Bar',
    premisesAddress: '1 High St, Town, AB1 2CD',
    councilPostalAddress: 'Sample Council, Plough Lane, HR4 0LE',
    councilOfficeHours: '09:30 – 13:30',
    councilApplicationsUrl: 'http://council.example.com',
    representationDeadline: '1 February 2025',
    activities: ['On and Off Sale of Alcohol'],
    activityHours: { 'On and Off Sale of Alcohol': makeHours('11:00', '23:00') },
  };

  it('renders daily hours with DAILY label', () => {
    const notice = generateNotice(baseForm);
    expect(notice).toContain(
      'On and Off Sale of Alcohol – 11:00 to 23:00hrs - DAILY'
    );
  });

  it('groups day ranges', () => {
    const hours: Hours = {
      Mon: { start: '11:00', end: '23:00' },
      Tue: { start: '11:00', end: '23:00' },
      Wed: { start: '11:00', end: '23:00' },
      Thu: { start: '11:00', end: '23:00' },
      Fri: { start: '11:00', end: '01:00' },
      Sat: { start: '11:00', end: '01:00' },
      Sun: { start: '12:00', end: '22:30' },
    };
    const form = {
      ...baseForm,
      activityHours: { 'On and Off Sale of Alcohol': hours },
    };
    const notice = generateNotice(form);
    expect(notice).toContain(
      'On and Off Sale of Alcohol – 11:00 to 23:00hrs - Mon–Thu'
    );
    expect(notice).toContain(
      'On and Off Sale of Alcohol – 11:00 to 01:00hrs - Fri–Sat'
    );
    expect(notice).toContain(
      'On and Off Sale of Alcohol – 12:00 to 22:30hrs - Sun'
    );
  });

  it('renders cross-midnight end time verbatim', () => {
    const notice = generateNotice({
      ...baseForm,
      activityHours: {
        'On and Off Sale of Alcohol': makeHours('10:00', '01:00'),
      },
    });
    expect(notice).toContain('10:00 to 01:00');
  });

  it('omits premises name when empty', () => {
    const notice = generateNotice({ ...baseForm, premisesName: '' });
    expect(notice).toContain('at 1 High St, Town, AB1 2CD in which');
    expect(notice).not.toContain('at ,');
  });

  it('uses manual representation deadline verbatim', () => {
    const notice = generateNotice({
      ...baseForm,
      representationDeadline: '31 Dec 2025',
    });
    expect(notice).toContain('no later than: 31 Dec 2025');
  });
});
