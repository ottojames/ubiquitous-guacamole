import { TrafficOrder } from '../noticeTypes/traffic-order.schema';
import { computeRepresentationDeadline } from './premises-licence.rules';

export function validateTrafficOrder(data: TrafficOrder, bankHolidays: string[] = []) {
  const issues: string[] = [];
  if (!data.roadName) issues.push('Road name required');
  const representationDeadline = computeRepresentationDeadline(data.applicationDate, bankHolidays);
  return { representationDeadline, issues };
}
