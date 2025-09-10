import { GVOL } from '../schemas/noticeTypes/gvol.schema';
import { computeRepresentationDeadline } from '../schemas/rules/premises-licence.rules';
import { AuthorityPack } from '../src/lib/authorityPacks';

export function renderGVOL(data: GVOL, council: AuthorityPack): string {
  const deadline = computeRepresentationDeadline(data.applicationDate);
  return [
    `${data.operator} has applied for a goods vehicle operator licence at ${data.address.line1}, ${data.address.city} ${data.address.postcode}.`,
    `Vehicles: ${data.vehicles}, Trailers: ${data.trailers}.`,
    `Representations must be made by ${deadline} via email: ${council.representation.email}.`,
  ].join('\n');
}
