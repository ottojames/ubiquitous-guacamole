export type AddressCandidate = {
  uprn?: string;
  udprn?: string;
  postcode: string;
  lat?: number; lng?: number;
  lines: string[];
  formatted_single_line: string;
  confidence: 'high' | 'low';
};

export interface AddressProvider {
  search(q: string): Promise<AddressCandidate[]>;
  find(postcode: string, numberOrName: string): Promise<AddressCandidate[]>;
}
