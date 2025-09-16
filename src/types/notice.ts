/* CN:TEMPLATES-PREVIEW-START */
/* CN:LICENSING-TEMPLATES-START */
export type NoticeType =
  | 'premises'   // Licensing Act 2003
  | 'variation'  // Licensing Act 2003 variation
  | 'review'     // Licensing Act 2003 review
  | 'gvol'       // Goods Vehicle Operator
  | 'tro'        // Traffic Order
  | 'planning'
  | 'gambling'
  | 'probate'
  | 'other';
/* CN:LICENSING-TEMPLATES-END */
/* CN:TEMPLATES-PREVIEW-END */

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
  // optional in type; we gate in UI
  noticeType?: NoticeType;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  /* CN:STEP2-START */
  urn?: string;
  /* CN:STEP2-END */
  /* CN:TEMPLATES-PREVIEW-START */
  /* CN:LICENSING-TEMPLATES-START */
  applicationSummary?: string;
  variationSummary?: string;
  reviewGrounds?: string;
  /* CN:LICENSING-TEMPLATES-END */
  /* CN:TEMPLATES-PREVIEW-END */
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
  originalFileMeta?: {
    mime: string;
    pageCount: number;
    bytes: number;
    sha256: string;
    [k: string]: unknown;
  };
  finalText?: string;
  proofHash?: string;
};
