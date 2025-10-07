import { NOTICE_DEFINITIONS } from '@/next/publish/config/noticeTypes';
import { addDays, addMonths, toISODate } from '@/next/publish/utils/date';

export function buildSampleDraft(definitionId: string): Record<string, unknown> | null {
  const definition = NOTICE_DEFINITIONS.find((item) => item.id === definitionId);
  if (!definition) return null;
  const today = new Date();
  const applicationDate = toISODate(today);
  const repsDate28 = toISODate(addDays(today, 28));
  const publicationDate = toISODate(addDays(today, 5));

  switch (definition.category) {
    case 'licensing': {
      const base: Record<string, unknown> = {
        variant: definition.id,
        applicant: {
          type: 'company',
          companyName: 'Sample Bars Ltd',
          contactEmail: 'licensing@example.com',
          serviceAddress: {
            line1: '1 Demo Road',
            town: 'Sampleton',
            postcode: 'SW1A 1AA',
          },
        },
        premises: {
          name: 'Sample Venue',
          address: {
            line1: '10 High Street',
            town: 'Sampleton',
            postcode: 'SW1A 1AA',
          },
        },
        consultation: {
          applicationDate,
          repsDeadline: repsDate28,
        },
        publication: {
          newspaper: 'Sample Gazette',
          targetDate: publicationDate,
          priceExVat: 125,
        },
        licensingAuthority: {
          name: 'Sample Borough Council',
          address: 'Civic Centre, Sampleton, AB1 2CD',
          email: 'licensing@sample.gov.uk',
        },
        inspectionAddressOrURL: 'Civic Centre, Sampleton',
        representations: {
          email: 'licensing@sample.gov.uk',
        },
        siteNoticeDate: applicationDate,
        newspaperPublicationDate: publicationDate,
        activities: [
          {
            code: 'alcohol_on',
            label: 'Alcohol (on sales)',
            enabled: true,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            startTime: '10:00',
            endTime: '23:00',
          },
        ],
        alcoholService: 'on',
        dps: {
          fullName: 'Jane Doe',
          issuingAuthority: 'Sample Borough Council',
          licenceNumber: 'DPS12345',
        },
      };
      if (definition.id.includes('variation')) {
        base.variationSummary = 'Extend alcohol sales to 01:00 daily.';
      }
      if (definition.id.includes('review')) {
        base.reviewGrounds = 'Alleged failure to uphold the prevention of nuisance licensing objective.';
      }
      if (definition.id.includes('club')) {
        base.additionalNotes = 'Club activities restricted to members and bona fide guests.';
      }
      return base;
    }
    case 'gambling':
      return {
        variant: definition.id,
        applicant: {
          type: 'company',
          companyName: 'Sample Gaming Ltd',
          contactEmail: 'gaming@example.com',
          serviceAddress: {
            line1: '2 Casino Way',
            town: 'Sampleton',
            postcode: 'LS1 1AA',
          },
        },
        premises: {
          name: 'Sample Betting Shop',
          address: {
            line1: '12 Market Street',
            town: 'Sampleton',
            postcode: 'LS1 1AA',
          },
        },
        consultation: {
          applicationDate,
          repsDeadline: repsDate28,
        },
        publication: {
          newspaper: 'Sample Evening Mail',
          targetDate: publicationDate,
        },
        licensingAuthority: {
          name: 'Sample Licensing Authority',
          address: 'Town Hall, Sampleton, LS1 2BB',
          email: 'licensing@sample.gov.uk',
        },
        activities: ['Betting on sporting events', 'Provision of gaming machines'],
        representations: {
          email: 'licensing@sample.gov.uk',
        },
        siteNoticeDate: applicationDate,
      };
    case 'gvol':
      return {
        variant: definition.id,
        applicant: {
          type: 'company',
          companyName: 'Sample Haulage Ltd',
          contactEmail: 'transport@example.com',
          serviceAddress: {
            line1: 'Logistics House',
            town: 'Manchester',
            postcode: 'M1 1AA',
          },
        },
        operatingCentreAddress: {
          line1: 'Unit 5 Industrial Estate',
          town: 'Manchester',
          postcode: 'M1 1AA',
        },
        consultation: {
          applicationDate,
          repsDeadline: toISODate(addDays(today, 35)),
        },
        publication: {
          newspaper: 'Logistics Gazette',
          targetDate: publicationDate,
        },
        vehicles: {
          maxVehicles: 6,
          maxTrailers: 4,
        },
        siteNoticeDate: applicationDate,
      };
    case 'planning':
      return {
        variant: definition.id,
        applicant: {
          type: 'company',
          companyName: 'Sample Developments Ltd',
          contactEmail: 'planning@sample.com',
          serviceAddress: {
            line1: '45 Design Park',
            town: 'Sample City',
            postcode: 'EC1A 1BB',
          },
        },
        premises: {
          name: 'Land at Riverside Way',
          address: {
            line1: 'Riverside Way',
            town: 'Sample City',
            postcode: 'EC1A 1BB',
          },
        },
        consultation: {
          applicationDate,
          repsDeadline: toISODate(addDays(today, 30)),
        },
        publication: {
          newspaper: 'Sample Chronicle',
          targetDate: publicationDate,
        },
        planningAuthority: {
          name: 'Sample City Council',
          address: 'Civic Offices, Sample City, EC1A 2CC',
          contactEmail: 'planning@sample.gov.uk',
          portalUrl: 'https://planning.sample.gov.uk/applications/123456',
          inspectionAddressOrURL: 'Civic Offices, Sample City',
        },
        applicationReference: 'SCC/2025/1234',
        proposal: 'Construction of a mixed-use development comprising 80 dwellings, retail space, and public realm improvements.',
        triggers: ['Major development - 10 or more dwellings'],
      };
    case 'probate': {
      const publication = addDays(today, 2);
      return {
        applicant: {
          type: 'company',
          companyName: 'Sample Solicitors LLP',
          contactEmail: 'probate@sample.com',
          serviceAddress: {
            line1: '1 Legal Square',
            town: 'Sample City',
            postcode: 'WC1A 1AA',
          },
        },
        consultation: {
          applicationDate,
          repsDeadline: toISODate(addDays(today, 70)),
        },
        publication: {
          newspaper: 'Sample Times',
          targetDate: toISODate(publication),
        },
        deceased: {
          fullName: 'John Sample',
          lastAddress: {
            line1: '25 Example Close',
            town: 'Sample City',
            postcode: 'WC1A 2AA',
          },
          dateOfDeath: toISODate(addDays(today, -40)),
        },
        solicitorOrPR: {
          name: 'Sample Solicitors LLP',
          address: {
            line1: '1 Legal Square',
            town: 'Sample City',
            postcode: 'WC1A 1AA',
          },
        },
        claimsDeadline: toISODate(addMonths(publication, 2)),
      };
    }
    default:
      return null;
  }
}
