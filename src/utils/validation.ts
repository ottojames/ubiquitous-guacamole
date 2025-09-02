export interface PublishFormValues {
  applicantName: string;
  applicantEmail: string;
  councilName: string;
  councilEmail: string;
  premisesAddress: {
    line1: string;
    line2?: string;
    line3?: string;
    city?: string;
    postcode?: string;
  };
  noticeText: string;
}

export function validatePublishForm(data: PublishFormValues) {
  const errors: Record<string, string> = {};
  if (!data.applicantName.trim()) errors.applicantName = "Required";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.applicantEmail)) errors.applicantEmail = "Invalid";
  if (!data.councilName.trim()) errors.councilName = "Required";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.councilEmail)) errors.councilEmail = "Invalid";
  if (!data.premisesAddress.line1.trim()) errors.premisesAddress = "Address required";
  if (!data.premisesAddress.postcode || !data.premisesAddress.postcode.trim()) errors.premisesAddress = "Address required";
  if (!data.noticeText.trim()) errors.noticeText = "Notice text required";
  return errors;
}
