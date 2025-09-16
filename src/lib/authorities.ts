/* CN:STEP2-COMPLIANCE-START */
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';

export type Authority = {
  id: string;
  displayName: string;
  region?: string;
  repsEmail?: string;
  repsUrl?: string;
  postalAddress?: string;
  domains: string[];
};

function inferDomains(pack: AuthorityPack): string[] {
  const fromEmail = pack.representation.email?.split('@')[1]?.toLowerCase();
  const domains: string[] = [];
  if (fromEmail) domains.push(fromEmail);
  // Fallback public sector domains
  const fallbacks = ['.gov.uk', '.gov.wales', '.gov.scot', '.llyw.cymru', '.ni.gov.uk'];
  return Array.from(new Set([...domains, ...fallbacks]));
}

export function getAuthorityByName(name?: string | null): Authority | null {
  if (!name) return null;
  const packs = listAuthorityPacks();
  const norm = name.trim().toLowerCase();
  const pack = packs.find((p) => p.name.trim().toLowerCase() === norm) ||
               packs.find((p) => norm.includes(p.name.trim().toLowerCase())) ||
               packs.find((p) => p.name.trim().toLowerCase().includes(norm));
  if (!pack) return null;
  return {
    id: pack.id,
    displayName: pack.name,
    region: pack.region,
    repsEmail: pack.representation.email,
    repsUrl: pack.representation.portal,
    postalAddress: pack.representation.postal,
    domains: inferDomains(pack),
  };
}

export function emailDomainMatchesAuthority(email?: string, authority?: Authority | null): boolean {
  if (!email || !authority) return true;
  const at = email.indexOf('@');
  if (at === -1) return true;
  const domain = email.slice(at + 1).toLowerCase();
  return authority.domains.some((allowed) => {
    const a = allowed.toLowerCase();
    return domain === a || domain.endsWith(a);
  });
}
/* CN:STEP2-COMPLIANCE-END */

/* CN:STEP2-COMPLIANCE-UPGRADE-START */
export function getAuthorityById(id?: string | null): Authority | null {
  if (!id) return null;
  const pack = listAuthorityPacks().find((p) => p.id === id);
  if (!pack) return null;
  return {
    id: pack.id,
    displayName: pack.name,
    region: pack.region,
    repsEmail: pack.representation.email,
    repsUrl: pack.representation.portal,
    postalAddress: pack.representation.postal,
    domains: inferDomains(pack),
  };
}

export function resolveAuthority(input?: { id?: string; name?: string } | string | null): Authority | null {
  if (!input) return null;
  if (typeof input === 'string') {
    return getAuthorityByName(input) || getAuthorityById(input);
  }
  return getAuthorityById(input.id || '') || getAuthorityByName(input.name || '');
}
/* CN:STEP2-COMPLIANCE-UPGRADE-END */
