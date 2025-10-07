import councils from '@/data/councils.json';
import { lookupCouncilByPostcode } from './councilLookup';

export type CouncilSource = {
  id?: string;
  name: string;
  email: string;
  address: string;
  aliases?: string[];
  licensingEmail?: string;
  postal?: string;
  repsEmail?: string;
  repsUrl?: string;
};

export type CouncilDirectoryItem = {
  id: string;
  name: string;
  licensingEmail: string;
  postal: string;
  postalAddress?: string;
  officeAddress?: string;
  licensingUrl?: string;
  repsEmail?: string;
  repsUrl?: string;
};

export type Council = {
  id: string;
  name: string;
  email?: string;
};

const DIRECTORY: CouncilDirectoryItem[] = (councils as CouncilSource[]).map((entry) => {
  const id = entry.id ?? entry.name;
  const licensingEmail = entry.licensingEmail ?? entry.email;
  const postal = entry.postal ?? entry.address ?? '';
  return {
    id,
    name: entry.name,
    licensingEmail,
    postal,
    postalAddress: postal || undefined,
    repsEmail: entry.repsEmail,
    repsUrl: entry.repsUrl,
  };
});

export function getCouncilDirectory(): CouncilDirectoryItem[] {
  return DIRECTORY;
}

export async function getCouncilForPostcode(postcode: string): Promise<Council> {
  const normalised = (postcode ?? '').trim().toUpperCase();
  const compact = normalised.replace(/\s+/g, '');
  const prefix = compact.slice(0, 3);
  const fallbackId = `council-${prefix ? prefix.toLowerCase() : 'unknown'}`;
  const fallbackName = prefix ? `Council for ${prefix}` : 'Unknown Council';

  const match = normalised ? lookupCouncilByPostcode(normalised) : null;
  if (match) {
    const directoryEntry = DIRECTORY.find((entry) => entry.name === match.councilName);
    const email = match.councilEmail?.trim() || directoryEntry?.licensingEmail || undefined;
    return {
      id: directoryEntry?.id ?? fallbackId,
      name: match.councilName,
      email,
    };
  }

  return {
    id: fallbackId,
    name: fallbackName,
  };
}
