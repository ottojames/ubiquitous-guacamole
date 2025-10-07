export type TrafficArea = {
  id: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
  postcodePrefixes: string[];
};

export const TRAFFIC_AREAS: TrafficArea[] = [
  {
    id: 'north-western',
    name: 'North Western Traffic Area',
    address: 'Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['BB', 'BL', 'CA', 'CH', 'CW', 'FY', 'LA', 'M', 'OL', 'PR', 'SK', 'WA', 'WN'],
  },
  {
    id: 'north-eastern',
    name: 'North Eastern Traffic Area',
    address: 'Hillcrest House, 386 Harehills Lane, Leeds LS9 6NF',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['DH', 'DL', 'DN', 'HG', 'HU', 'LS', 'NE', 'SR', 'TS', 'YO'],
  },
  {
    id: 'western',
    name: 'Western Traffic Area',
    address: '1 Rivergate, Temple Quay, Bristol BS1 6EW',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['BA', 'BH', 'BS', 'DT', 'EX', 'GL', 'PL', 'SN', 'SP', 'TA', 'TQ', 'TR'],
  },
  {
    id: 'west-midlands',
    name: 'West Midlands Traffic Area',
    address: 'Green Gate, Staffordshire Place 1, Stafford ST16 2LP',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['B', 'CV', 'DY', 'HR', 'ST', 'SY', 'TF', 'WR', 'WS', 'WV'],
  },
  {
    id: 'east-of-england',
    name: 'East of England Traffic Area',
    address: '2nd Floor, Block 4, Broad Gate, 70 Broad Street, Peterborough PE1 1GF',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['CB', 'CM', 'CO', 'IP', 'LN', 'NR', 'PE', 'SS'],
  },
  {
    id: 'south-eastern',
    name: 'South Eastern and Metropolitan Traffic Area',
    address: 'Ivy House, Ivy Terrace, Eastbourne BN21 4QT',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['AL', 'BN', 'BR', 'CR', 'CT', 'DA', 'GU', 'HA', 'HP', 'KT', 'ME', 'MK', 'N', 'NW', 'OX', 'PO', 'RG', 'RH', 'SE', 'SM', 'SW', 'TN', 'TW', 'UB', 'W', 'WD'],
  },
  {
    id: 'wales',
    name: 'Wales Traffic Area',
    address: 'Picton House, 3rd Floor, Walter Road, Swansea SA1 5NE',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['CF', 'LD', 'NP', 'SA'],
  },
  {
    id: 'scotland',
    name: 'Scotland Traffic Area',
    address: 'Level 6, The Stamp Office, 10 Waterloo Place, Edinburgh EH1 3EG',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['AB', 'DD', 'DG', 'EH', 'FK', 'G', 'HS', 'IV', 'KA', 'KW', 'KY', 'ML', 'PA', 'PH', 'TD', 'ZE'],
  },
  {
    id: 'eastern',
    name: 'Eastern Traffic Area',
    address: '2nd Floor, Block 4, Broad Gate, 70 Broad Street, Peterborough PE1 1GF',
    email: 'notifications@otc.gov.uk',
    postcodePrefixes: ['CB', 'CM', 'CO', 'IP', 'LU', 'MK', 'NN', 'NR', 'PE', 'SG'],
  },
];

export function lookupTrafficArea(postcode: string | undefined | null): TrafficArea | null {
  if (!postcode) return null;
  const normalised = postcode.trim().toUpperCase();
  const compact = normalised.replace(/\s+/g, '');
  const match = compact.match(/^([A-Z]{1,2})/);
  const outward = match ? match[1] : compact.slice(0, 2);
  return (
    TRAFFIC_AREAS.find((area) => area.postcodePrefixes.includes(outward)) || null
  );
}
