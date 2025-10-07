import type { Address, NoticeBase } from '@/types/notice';

export function formatAddressLines(address?: Address | null): string[] {
  if (!address) return [];
  const parts = [address.line1, address.line2, address.town, address.postcode]
    .map((part) => (part ?? '').trim())
    .filter(Boolean);
  if (address.country) parts.push(address.country);
  return parts;
}

export function formatAddressInline(address?: Address | string | null): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return formatAddressLines(address).join(', ');
}

export function formatDateLong(value?: string | Date | null, locale = 'en-GB'): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function ensureNoticeAddress(notice: NoticeBase): Address | null {
  if (notice.applicant.serviceAddress) return notice.applicant.serviceAddress;
  if (notice.applicant.registeredOffice) return notice.applicant.registeredOffice;
  if (notice.premises?.address) return notice.premises.address;
  return null;
}

export function formatBulletList(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

export function htmlParagraphs(lines: string[]): string {
  return lines.map((line) => `<p>${line}</p>`).join('\n');
}
