import { TrafficOrder } from '../schemas/noticeTypes/traffic-order.schema';
import { computeRepresentationDeadline } from '../schemas/rules/premises-licence.rules';
import { AuthorityPack } from '../src/lib/authorityPacks';

export function renderTrafficOrder(data: TrafficOrder, council: AuthorityPack): string {
  const deadline = computeRepresentationDeadline(data.applicationDate);
  return [
    `Proposed traffic order on ${data.roadName} for ${data.duration}: ${data.restriction}.`,
    `Representations must be made by ${deadline} via email: ${council.representation.email}.`,
  ].join('\n');
}
