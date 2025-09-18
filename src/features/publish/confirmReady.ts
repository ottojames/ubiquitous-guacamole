export function hasNoticeText(v: string | undefined) {
  return !!(v && v.trim().length > 0);
}

export function canContinueFromConfirm({
  noticeText,
  confirmed,
}: {
  noticeText?: string;
  confirmed: boolean;
}) {
  return hasNoticeText(noticeText) && !!confirmed;
}
