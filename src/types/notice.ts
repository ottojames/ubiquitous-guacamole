export type NoticeType =
  | "Premises Licence"
  | "TEN"
  | "Gambling"
  | "Goods Vehicle Operator"
  | "Traffic Order";

export type UploadedFile = {
  id: string;
  filename: string;
  url: string;
  size: number;
  mime: string;
};

export type NoticeDraft = {
  id: string;
  createdAt: string;
  noticeType: NoticeType;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  premisesName?: string;
  premisesAddress: string;
  postcode: string;
  councilName: string;
  councilEmail: string;
  councilAddress: string;
  consultationStart?: string; // yyyy-mm-dd
  consultationEnd?: string;   // yyyy-mm-dd
  blueNoticeUploads: UploadedFile[];
  newspaperProofUploads?: UploadedFile[];
  additionalDocs?: UploadedFile[];
  status: "Draft" | "Submitted";
  applicationType?: 'Grant' | 'Variation' | 'Review';
  activities?: string[];
  hours?: Record<string, string>;
  applicationDate: string;
  repsDeadline?: string;
  inspectionLocation?: string;
  repsMethod?: string;
  statutoryWarningPresent?: boolean;
  originalFileMeta?: any;
  finalText?: string;
  proofHash?: string;
};
