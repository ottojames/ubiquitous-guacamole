import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onOcrComplete: (text: string, meta: any) => void;
  engine?: string;
  applicantEmail?: string;
  applicantName?: string;
  councilName?: string;
  councilEmail?: string;
  premisesAddress?: string;
  uploaderId?: string;
}

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/rtf': ['.rtf'],
};

const UPLOAD_URL = '/api/upload';

export default function BlueNoticeUpload({
  value,
  onChange,
  onOcrComplete,
  engine,
  applicantEmail,
  applicantName,
  councilName,
  councilEmail,
  premisesAddress,
  uploaderId,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [signedUrl, setSignedUrl] = useState('');

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;
      const file = accepted[0];
      setError('');
      setStatus('uploading');

      const fd = new FormData();
      fd.append('file', file);
      if (applicantEmail) fd.append('applicantEmail', applicantEmail);
      if (applicantName) fd.append('applicantName', applicantName);
      if (councilName) fd.append('councilName', councilName);
      if (councilEmail) fd.append('councilEmail', councilEmail);
      if (premisesAddress) fd.append('premisesAddress', premisesAddress);
      if (uploaderId) fd.append('uploaderId', uploaderId);

      try {
        const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
        const ct = res.headers.get('content-type') || '';
        let json: any;
        if (ct.includes('application/json')) {
          json = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || 'Unexpected response');
        }

        if (!json.ok) {
          setError(json.error?.message || 'Upload failed');
          setStatus('error');
          return;
        }

        setSignedUrl(json.signed_url || '');
        onOcrComplete(json.ocr_text || '', json);
        onChange(json.ocr_text || '');
        setStatus('idle');
      } catch (e: any) {
        setError(e?.message || 'Upload failed');
        setStatus('error');
      }
    },
    [
      applicantEmail,
      applicantName,
      councilName,
      councilEmail,
      premisesAddress,
      uploaderId,
      onChange,
      onOcrComplete,
    ],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: ACCEPT,
  });

  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div>
      <div
        {...getRootProps({
          className: `cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${
            isDragActive ? 'bg-slate-50' : ''
          }`,
        })}
      >
        <input {...getInputProps()} />
        <div className="text-sm text-slate-600">
          <div className="font-medium mb-1">
            PDF, PNG, JPG, DOC, DOCX, RTF or TXT
          </div>
          <div>Drag & drop, or click to choose file</div>
        </div>
      </div>

      {status === 'uploading' && (
        <div className="mt-2 text-sm">Uploading…</div>
      )}
      {status === 'error' && (
        <div className="mt-2 text-sm text-rose-600">{error}</div>
      )}
      {signedUrl && (
        <div className="mt-2 text-sm">
          Uploaded file: <a className="underline" href={signedUrl}>{signedUrl}</a>
        </div>
      )}

      <textarea
        data-testid="notice-editor"
        aria-label="Notice editor"
        className="mt-4 w-full h-64 border rounded p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-1 text-xs text-right text-slate-500">
        {wordCount} words
        {engine && value && ` — OCR complete via ${engine}`}
      </div>
    </div>
  );
}

