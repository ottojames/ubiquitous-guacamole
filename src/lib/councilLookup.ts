import { listAuthorityPacks } from './authorityPacks';

export function lookupCouncilByPostcode(postcode: string) {
  const packs = listAuthorityPacks();
  const normalised = postcode.trim().toLowerCase();
  const pack = packs.find(p => normalised.startsWith(p.id.slice(0,2)));
  if (!pack) return null;
  return { councilName: pack.name, councilEmail: pack.representation.email || '' };
}
