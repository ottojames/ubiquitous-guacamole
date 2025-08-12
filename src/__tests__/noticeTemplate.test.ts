import { generateNotice, Hours } from '../lib/noticeTemplate';

describe('notice template', () => {
  it('renders with substitutions', () => {
    const hours: Hours = {};
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d) => {
      hours[d] = { start: '09:00', end: '23:00' };
    });
    const form = {
      applicationType: 'New Premises Licence',
      applicantName: 'Jane Smith',
      premisesName: 'The Bar',
      premisesAddress: '1 High St, Town AB1 2CD',
      councilName: 'Sample Council',
      activities: ['Sale of alcohol (on premises)'],
      activityHours: { 'Sale of alcohol (on premises)': hours },
      openingHours: hours,
      representationDeadline: '2025-01-01',
      licensingManager: 'Manager Name',
      councilDepartment: 'Licensing Dept',
      councilOfficeAddress: '1 Council St',
      viewingStartTime: '09:00',
      viewingEndTime: '17:00',
      viewingDays: 'Mon-Fri',
      councilWebsite: 'http://council.example.com',
      councilLicensingEmail: 'license@example.com',
      applicationDate: '2025-01-02',
    };
    const expected = `Notice of Application for a New Premises Licence

I, Jane Smith Address of Premises: The Bar, 1 High St, Town, AB1 2CD have made the above application on 2025-01-02 to Sample Council for:
Sale of alcohol (on premises)
Mon–Sun: 09:00–23:00 and opening hours Monday to Sunday 09:00 to 23:00.
The full application can be viewed at Sample Council. Contact Manager Name, Licensing Dept, 1 Council St, between the hours of 09:00 and 17:00 on Mon-Fri, visit http://council.example.com, or email: license@example.com.
A Responsible Authority or Other Persons may make written representations about this application to the Licensing Office on or before 2025-01-01.
It is an offence, knowingly or recklessly, to make a false statement in connection with an application, and on summary conviction is liable to an unlimited fine.`;
    expect(generateNotice(form)).toBe(expected);
  });
});
