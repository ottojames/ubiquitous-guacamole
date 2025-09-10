import React from 'react';
import UploadPremisesNoticeForm, { type UploadPremisesNoticeFormProps } from '@/components/UploadPremisesNoticeForm';

export default function UploadPanel(props: UploadPremisesNoticeFormProps) {
  return (
    <div className="mb-4">
      <div className="mb-2">
        <label className="block text-sm font-medium">Upload & OCR</label>
        <p id="upload-help" className="text-xs text-slate-600">
          PDF, DOCX, PNG or JPG (max 25 MB). OCR will appear below.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        {/* Keep using the existing component to preserve test hooks (hidden input + data-testid) */}
        <div className="p-3">
          <UploadPremisesNoticeForm {...props} />
        </div>
      </div>
    </div>
  );
}

