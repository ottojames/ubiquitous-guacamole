import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface UploadDropzoneProps {
  /** Callback with extracted text once ready */
  onText?: (text: string) => void;
}

export default function UploadDropzone({ onText }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'ocr' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState('');

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    const f = accepted[0];
    setFile(f);
    setStatus('uploading');
    setError(null);

    try {
      // pretend upload delay
      await new Promise((r) => setTimeout(r, 600));
      setStatus('ocr');

      const text = await f.text();
      await new Promise((r) => setTimeout(r, 400));
      setPreview(text);
      setStatus('ready');
      onText?.(text);
    } catch (e: any) {
      setError(e?.message || 'Failed to process file');
      setStatus('error');
    }
  }, [onText]);

  const remove = () => {
    setFile(null);
    setPreview('');
    setStatus('idle');
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop,
  });

  useEffect(() => {
    if (status === 'ready') {
      const el = document.getElementById('notice-preview');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [status]);

  return (
    <section className="mx-auto w-full max-w-lg rounded-2xl border bg-white/50 p-6 shadow-sm md:p-8">
      <div
        {...getRootProps({
          tabIndex: 0,
          className: `flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${isDragActive ? 'bg-slate-50' : 'bg-white'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`,
        })}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-slate-600">
          Drag & drop or click to choose a file
        </p>
      </div>

      <AnimatePresence>
        {file && (
          <motion.div
            key={file.name}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
          >
            <span>{file.name}</span>
            <button
              type="button"
              onClick={remove}
              className="rounded p-1 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {['uploading', 'ocr'].includes(status) && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded bg-slate-200">
          <div className="h-full w-full bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300 bg-[length:200%_100%] animate-progress"></div>
        </div>
      )}

      <div className="mt-3 text-sm" role="status" aria-live="polite">
        {status === 'uploading' && 'Uploading…'}
        {status === 'ocr' && 'OCR running…'}
        {status === 'ready' && 'Ready'}
        {status === 'error' && 'Failed'}
      </div>

      {status === 'error' && (
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setError(null);
            setFile(null);
          }}
          className="mt-3 rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Retry
        </button>
      )}

      {status === 'ready' && (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
            Extracted {preview.length} characters from file
          </div>
          <details className="rounded border bg-white p-3 text-sm">
            <summary className="cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
              OCR preview
            </summary>
            <pre className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {preview.slice(0, 1500)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
