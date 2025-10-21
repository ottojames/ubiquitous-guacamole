import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
}

export default function Exports() {
  const { department } = useOutletContext<{ department: Department }>();
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = ('' + value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    }

    // Create blob and download
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getDateFilter = () => {
    if (timeRange === 'all') return null;

    const now = new Date();
    const rangeDate = new Date();
    if (timeRange === '7d') rangeDate.setDate(now.getDate() - 7);
    else if (timeRange === '30d') rangeDate.setDate(now.getDate() - 30);
    else rangeDate.setDate(now.getDate() - 90);

    return rangeDate.toISOString();
  };

  const exportSubmissions = async () => {
    try {
      setExporting(true);

      let query = supabase
        .from('submissions')
        .select(`
          id,
          title,
          notice_type,
          status,
          submitted_at,
          reviewed_at,
          submitter_name,
          submitter_email,
          premises_name,
          premises_address,
          applicant_name,
          notes
        `)
        .eq('receiving_department_id', department.id)
        .order('submitted_at', { ascending: false });

      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('submitted_at', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = data?.map((sub) => ({
        ID: sub.id,
        Title: sub.title,
        'Notice Type': sub.notice_type,
        Status: sub.status,
        'Submitted At': sub.submitted_at,
        'Reviewed At': sub.reviewed_at || 'N/A',
        'Submitter Name': sub.submitter_name,
        'Submitter Email': sub.submitter_email,
        'Premises Name': sub.premises_name || 'N/A',
        'Premises Address': sub.premises_address || 'N/A',
        'Applicant Name': sub.applicant_name || 'N/A',
        Notes: sub.notes || 'N/A'
      })) || [];

      const filename = `submissions_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
      generateCSV(formatted, filename);
      setExporting(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
      setExporting(false);
    }
  };

  const exportPublications = async () => {
    try {
      setExporting(true);

      let query = supabase
        .from('notices')
        .select('id, title, notice_type, status, published_at, representation_deadline, expires_at')
        .eq('department_id', department.id)
        .in('status', ['published', 'expired', 'archived'])
        .order('published_at', { ascending: false });

      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('published_at', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = data?.map((pub) => ({
        ID: pub.id,
        Title: pub.title,
        'Notice Type': pub.notice_type,
        Status: pub.status,
        'Published At': pub.published_at || 'N/A',
        'Representation Deadline': pub.representation_deadline || 'N/A',
        'Expires At': pub.expires_at || 'N/A'
      })) || [];

      const filename = `publications_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
      generateCSV(formatted, filename);
      setExporting(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
      setExporting(false);
    }
  };

  const exportRepresentations = async () => {
    try {
      setExporting(true);

      let query = supabase
        .from('representations')
        .select(`
          id,
          notice_id,
          respondent_name,
          respondent_email,
          respondent_type,
          comment,
          submitted_at,
          status,
          reviewed_at
        `)
        .eq('department_id', department.id)
        .order('submitted_at', { ascending: false });

      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('submitted_at', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = data?.map((rep) => ({
        ID: rep.id,
        'Notice ID': rep.notice_id,
        'Respondent Name': rep.respondent_name,
        'Respondent Email': rep.respondent_email,
        'Respondent Type': rep.respondent_type,
        Comment: rep.comment,
        'Submitted At': rep.submitted_at,
        Status: rep.status,
        'Reviewed At': rep.reviewed_at || 'N/A'
      })) || [];

      const filename = `representations_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
      generateCSV(formatted, filename);
      setExporting(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
      setExporting(false);
    }
  };

  const exportAll = async () => {
    await exportSubmissions();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await exportPublications();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await exportRepresentations();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Exports</h1>
        <p className="text-gray-600 mt-1">Download CSV exports of your department data</p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Date Range</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
            { value: 'all', label: 'All Time' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                timeRange === option.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submissions Export */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Submissions</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export all submissions with status, dates, submitter info, and review details
              </p>
              <button
                onClick={exportSubmissions}
                disabled={exporting}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export Submissions CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Publications Export */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Publications</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export published notices with publication dates, deadlines, and status
              </p>
              <button
                onClick={exportPublications}
                disabled={exporting}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export Publications CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Representations Export */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Representations</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export public responses with respondent details, comments, and review status
              </p>
              <button
                onClick={exportRepresentations}
                disabled={exporting}
                className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export Representations CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Export All */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Export Everything</h3>
              <p className="text-sm opacity-90 mb-4">
                Download all three exports at once (submissions, publications, representations)
              </p>
              <button
                onClick={exportAll}
                disabled={exporting}
                className="w-full px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export All Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-blue-900 mb-1">Export Information</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Exports are generated in CSV format for easy analysis in Excel or Google Sheets</li>
              <li>• All dates and times are in ISO format (YYYY-MM-DD HH:MM:SS)</li>
              <li>• Sensitive information is included - handle exports securely</li>
              <li>• File names include the date range and export date for easy organization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
