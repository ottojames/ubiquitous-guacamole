import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

async function uploadFile(
  file: File,
  form: { applicantEmail: string; noticeType?: string }
) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('applicantEmail', form.applicantEmail);
  if (form.noticeType) fd.append('noticeType', form.noticeType);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const ct = res.headers.get('content-type') || '';
  const out = ct.includes('application/json')
    ? await res.json()
    : { ok: false, message: await res.text() };
  if (!res.ok || !out.ok) {
    throw new Error(out?.message || `Upload failed (${res.status})`);
  }
  return out;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onOcrComplete: (text: string, meta: any) => void;
  engine?: string;
  applicantEmail?: string;
  noticeType?: string;
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

export default function BlueNoticeUpload({
  value,
  onChange,
  onOcrComplete,
  engine,
  applicantEmail,
  noticeType,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [signedUrl, setSignedUrl] = useState('');

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length || !applicantEmail) return;
      const file = accepted[0];
      setError('');
      setStatus('uploading');
      try {
        const json = await uploadFile(file, {
          applicantEmail,
          noticeType,
        });
        setSignedUrl(json.publicUrl || '');
        onOcrComplete(json.ocr_text || '', json);
        onChange(json.ocr_text || '');
        setStatus('idle');
      } catch (e: any) {
        setError(e?.message || 'Upload failed');
        setStatus('error');
      }
    },
    [applicantEmail, noticeType, onChange, onOcrComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: ACCEPT,
    disabled: status === 'uploading',
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
        <input {...getInputProps({ name: 'file' })} />
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
        <div className="mt-2 text-sm text-rose-600">
          {error}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setStatus('idle')}
          >
            Retry
          </button>
        </div>
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

