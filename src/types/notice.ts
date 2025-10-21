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
  applicantAddressLine1?: string;
  applicantAddressLine2?: string;
  applicantCity?: string;
  applicantPostcode?: string;
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
  councilAddressLine1?: string;
  councilAddressLine2?: string;
  councilCity?: string;
  councilPostcode?: string;
  councilWebsite?: string;
  isCouncilEmailLocked?: boolean;
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
  representationsUrl?: string;
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

export type Address = {
  uprn?: string;
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  country?: 'UK';
};

export type Applicant = {
  type: 'individual' | 'company';
  fullName?: string;
  companyName?: string;
  companyNumber?: string;
  registeredOffice?: Address;
  serviceAddress?: Address;
  contactEmail: string;
  contactPhone?: string;
};

export type PublicationPlan = {
  newspaper: string;
  targetDate: string;
  priceExVat?: number;
  urn?: string;
};

export type Consultation = {
  applicationDate: string;
  repsDeadline: string;
  windowRule?:
    | 'LA2003_28D'
    | 'LA2003_NEWS_10WD'
    | 'GAMBLING_28D'
    | 'GVOL_-21_TO_+21'
    | 'PLANNING_21D_MIN'
    | 'TRUSTEE_S27_2MONTHS';
};

export type NoticeBase = {
  id?: string;
  noticeType: string;
  applicant: Applicant;
  premises?: { name?: string; address: Address };
  publication: PublicationPlan;
  consultation: Consultation;
  extras?: Record<string, any>;
};
