import { useState } from 'react';
import { Download, FileArchive, CheckCircle } from 'lucide-react';

interface EvidencePackDownloadProps {
  noticeId: string;
  noticeType?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'card';
}

/**
 * Evidence Pack Download Component
 *
 * Allows councils to download comprehensive evidence packages containing:
 * - Publication certificate
 * - Original notice documents
 * - All representations with attachments
 * - Complete audit trail
 * - Metadata manifest with checksums
 */
export default function EvidencePackDownload({
  noticeId,
  noticeType = 'notice',
  size = 'md',
  variant = 'button'
}: EvidencePackDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      setSuccess(false);

      // Call API to generate evidence pack
      const response = await fetch(`/api/evidence-packs/${noticeId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate evidence pack');
      }

      // Get the blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `evidence_pack_${noticeType}_${noticeId.substring(0, 8)}.zip`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Error downloading evidence pack:', err);
      setError(err instanceof Error ? err.message : 'Failed to download evidence pack');
    } finally {
      setDownloading(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <FileArchive className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Evidence Pack
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Download complete legal evidence package with all documents, representations, and audit trail
            </p>
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Evidence pack downloaded successfully
              </div>
            )}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  Download Evidence Pack
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Button variant
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`inline-flex items-center gap-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]}`}
        title="Download complete evidence package for legal defensibility"
      >
        {downloading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Generating...
          </>
        ) : (
          <>
            <FileArchive className="h-4 w-4" />
            Evidence Pack
          </>
        )}
      </button>
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Downloaded successfully
        </div>
      )}
    </div>
  );
}
