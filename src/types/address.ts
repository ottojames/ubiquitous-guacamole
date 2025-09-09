export type PremisesAddress = {
  lines: string[];
  town?: string;
  county?: string;
  postcode: string;
  uprn?: string;
  udprn?: string;
  lat?: number; lng?: number;
  formatted_single_line: string;
  source: 'lookup' | 'manual' | 'ocr-suggested';
  confidence: 'high' | 'manual' | 'low';
};

export type AddressCandidate = {
  uprn?: string;
  udprn?: string;
  postcode: string;
  lat?: number; lng?: number;
  lines: string[];
  formatted_single_line: string;
  confidence: 'high' | 'low';
};
