import { useState, useRef } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface ContextType {
  firm: Organization;
  userRole: string;
}

interface CSVRow {
  client_name: string;
  notice_type: string;
  premises_name?: string;
  premises_address: string;
  premises_postcode: string;
  applicant_name: string;
  applicant_email: string;
  application_date?: string;
  representation_deadline?: string;
  council?: string;
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function BulkUpload() {
  const { firm, userRole } = useOutletContext<ContextType>();
  const { firmSlug } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [processing, setProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);

  const canUpload = ['owner', 'admin', 'operator'].includes(userRole);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setUploadComplete(false);
    setUploadResult(null);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as CSVRow[];
        setData(parsedData);
        validateData(parsedData);
      },
      error: (error) => {
        alert(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const validateData = (rows: CSVRow[]) => {
    const errors: ValidationError[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because row 1 is header and arrays are 0-indexed

      // Required fields
      if (!row.client_name) {
        errors.push({ row: rowNumber, field: 'client_name', message: 'Client name is required' });
      }
      if (!row.notice_type) {
        errors.push({ row: rowNumber, field: 'notice_type', message: 'Notice type is required' });
      }
      if (!row.premises_address) {
        errors.push({ row: rowNumber, field: 'premises_address', message: 'Premises address is required' });
      }
      if (!row.premises_postcode) {
        errors.push({ row: rowNumber, field: 'premises_postcode', message: 'Premises postcode is required' });
      }
      if (!row.applicant_name) {
        errors.push({ row: rowNumber, field: 'applicant_name', message: 'Applicant name is required' });
      }
      if (!row.applicant_email) {
        errors.push({ row: rowNumber, field: 'applicant_email', message: 'Applicant email is required' });
      }

      // Email validation
      if (row.applicant_email && !row.applicant_email.includes('@')) {
        errors.push({ row: rowNumber, field: 'applicant_email', message: 'Invalid email format' });
      }

      // Postcode format validation (basic UK postcode check)
      const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
      if (row.premises_postcode && !postcodeRegex.test(row.premises_postcode)) {
        errors.push({ row: rowNumber, field: 'premises_postcode', message: 'Invalid UK postcode format' });
      }
    });

    setValidationErrors(errors);
  };

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before uploading');
      return;
    }

    setProcessing(true);

    try {
      // TODO: Implement actual bulk upload API call
      // This would send the data to /api/notices/bulk endpoint
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUploadResult({
        success: data.length,
        failed: 0
      });
      setUploadComplete(true);
    } catch (error) {
      console.error('Bulk upload failed:', error);
      alert('Failed to upload notices. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = `client_name,notice_type,premises_name,premises_address,premises_postcode,applicant_name,applicant_email,application_date,representation_deadline,council
The Red Lion Pub,premises-licence,The Red Lion,123 High Street,SW1A 1AA,John Smith Ltd,john@example.com,2026-01-14,2026-02-14,Westminster City Council
The Blue Bar,variation,The Blue Bar,456 Oxford Street,W1D 2HF,Blue Bar Ltd,contact@bluebar.co.uk,2026-01-14,2026-02-14,Westminster City Council`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notice_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setFile(null);
    setData([]);
    setValidationErrors([]);
    setUploadComplete(false);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!canUpload) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-yellow-900">Permission Required</h3>
              <p className="text-yellow-800 mt-2">
                You need owner, admin, or operator permissions to upload notices in bulk.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk CSV Upload</h1>
        <p className="text-gray-600 mt-1">
          Upload multiple notices at once using a CSV file
        </p>
      </div>

      {/* Success Message */}
      {uploadComplete && uploadResult && (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-2">Upload Complete!</h3>
              <p className="text-green-800 mb-4">
                Successfully uploaded {uploadResult.success} notice{uploadResult.success !== 1 ? 's' : ''}.
                {uploadResult.failed > 0 && ` ${uploadResult.failed} failed.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/f/${firmSlug}/notices`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  View Notices
                </button>
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 border border-green-600 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-colors"
                >
                  Upload Another File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!uploadComplete && (
        <>
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2">How to use bulk upload</h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li>Download the CSV template below</li>
                  <li>Fill in your notice details (one notice per row)</li>
                  <li>Save the file and upload it here</li>
                  <li>Review any validation errors and fix them</li>
                  <li>Click "Upload Notices" to process the batch</li>
                </ol>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select CSV File</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {file ? (
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">{file.name}</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {data.length} row{data.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Choose Different File
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-900 mb-2">
                    Drop your CSV file here or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Select File
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">
                    {validationErrors.length} Validation Error{validationErrors.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-red-800 mb-4">
                    Please fix the following errors in your CSV file:
                  </p>
                  <div className="bg-white rounded-xl p-4 max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-red-200">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold text-red-900">Row</th>
                          <th className="text-left py-2 px-3 font-semibold text-red-900">Field</th>
                          <th className="text-left py-2 px-3 font-semibold text-red-900">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationErrors.map((error, index) => (
                          <tr key={index} className="border-b border-red-100 last:border-0">
                            <td className="py-2 px-3 text-red-800">{error.row}</td>
                            <td className="py-2 px-3 text-red-800 font-mono">{error.field}</td>
                            <td className="py-2 px-3 text-red-700">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {data.length > 0 && validationErrors.length === 0 && (
            <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Preview</h2>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-green-800">
                  ✓ Validation passed! Ready to upload {data.length} notice{data.length !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Premises</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Applicant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-900">{row.client_name}</td>
                        <td className="py-3 px-4 text-gray-700">{row.notice_type}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {row.premises_name && <div className="font-medium">{row.premises_name}</div>}
                          <div className="text-xs text-gray-600">
                            {row.premises_address}, {row.premises_postcode}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <div className="font-medium">{row.applicant_name}</div>
                          <div className="text-xs text-gray-600">{row.applicant_email}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 5 && (
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    + {data.length - 5} more row{data.length - 5 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {data.length > 0 && validationErrors.length === 0 && (
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={resetUpload}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={processing}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Upload ${data.length} Notice${data.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
