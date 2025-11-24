import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, Calendar, Building2, Edit3, Eye, Sparkles } from 'lucide-react';
import { renderNoticeTemplate } from '@/next/publish/templates/engine';

// Available placeholder options for dropdowns
const AVAILABLE_PLACEHOLDERS = [
  { value: 'APPLICANT_NAME', label: 'Applicant Name' },
  { value: 'APPLICANT_TRADING_AS', label: 'Trading As' },
  { value: 'AUTHORITY_NAME', label: 'Authority Name' },
  { value: 'PREMISES_NAME', label: 'Premises Name' },
  { value: 'PREMISES_ADDRESS', label: 'Premises Address' },
  { value: 'LICENSABLE_ACTIVITIES', label: 'Licensable Activities' },
  { value: 'ACTIVITY_SCHEDULE', label: 'Activity Schedule' },
  { value: 'OPENING_HOURS', label: 'Opening Hours' },
  { value: 'DPS_NAME', label: 'Designated Premises Supervisor' },
  { value: 'INSPECTION_LOCATION', label: 'Inspection Location' },
  { value: 'INSPECTION_TIMES', label: 'Inspection Times' },
  { value: 'REPRESENTATION_ADDRESS', label: 'Representation Address' },
  { value: 'REPRESENTATION_EMAIL', label: 'Representation Email' },
  { value: 'DEADLINE_DATE', label: 'Deadline Date' },
  { value: 'ONLINE_REGISTER_URL', label: 'Online Register URL' },
];

// Default sample data
const DEFAULT_DATA = {
  APPLICANT_NAME: 'Red Lion Hospitality Ltd',
  APPLICANT_TRADING_AS: 'The Red Lion',
  AUTHORITY_NAME: 'Sampleton Borough Council',
  AUTHORITY_NAMES_LIST: 'Sampleton Borough Council',
  PREMISES_NAME: 'The Red Lion',
  PREMISES_ADDRESS: '45 Market Street, Sampleton, SP2 3BB',
  LICENSABLE_ACTIVITIES: 'Sale of alcohol (on and off the premises), Live music, Late night refreshment',
  ACTIVITY_SCHEDULE: 'Alcohol: Mon–Sun 11:00–23:00, Live Music: Fri–Sat 20:00–23:30, Late Night Refreshment: Fri–Sat 23:00–00:30',
  OPENING_HOURS: 'Mon–Thu 10:00–23:30, Fri–Sat 10:00–00:30, Sun 11:00–22:30',
  DPS_NAME: 'Sarah Johnson',
  INSPECTION_LOCATION: 'Sampleton Borough Council, Licensing Office, Civic Centre, High Street, Sampleton, SP1 1AA',
  INSPECTION_TIMES: 'Monday–Friday 9:00 AM – 5:00 PM',
  REPRESENTATION_ADDRESS: 'Licensing Team, Sampleton Borough Council, Civic Centre, High Street, Sampleton, SP1 1AA',
  REPRESENTATION_EMAIL: 'licensing@sampleton.gov.uk',
  DEADLINE_DATE: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }),
  ONLINE_REGISTER_URL: 'https://sampleton.gov.uk/licensing/register',
  HAS_MULTIPLE_AUTHORITIES: false,
};

const DEFAULT_TEMPLATE = `LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} has applied to {{AUTHORITY_NAME}} for a new premises licence for {{PREMISES_NAME}}, {{PREMISES_ADDRESS}}.

Licensable activities applied for: {{LICENSABLE_ACTIVITIES}}.
Proposed hours: {{ACTIVITY_SCHEDULE}}.{{#if OPENING_HOURS}} Opening hours: {{OPENING_HOURS}}.{{/if}}{{#if DPS_NAME}} The proposed designated premises supervisor is {{DPS_NAME}}.{{/if}}

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`;

export default function SampleNotice() {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [testData, setTestData] = useState(DEFAULT_DATA);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const renderedNotice = renderNoticeTemplate(template, testData);

  const insertPlaceholder = (placeholder: string) => {
    const before = template.substring(0, cursorPosition);
    const after = template.substring(cursorPosition);
    const newTemplate = `${before}{{${placeholder}}}${after}`;
    setTemplate(newTemplate);
    setShowPlaceholderMenu(false);
  };

  const updateTestData = (key: string, value: string) => {
    setTestData({ ...testData, [key]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/showcase"
              className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="font-medium">Back to Showcase</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('view')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'view'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                View Mode
              </button>
              <button
                onClick={() => setMode('edit')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'edit'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Edit3 className="w-4 h-4 inline mr-2" />
                Edit Mode
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Interactive Template Builder
          </h1>
          <p className="text-lg text-slate-600">
            {mode === 'view'
              ? 'Preview your customized notice template'
              : 'Customize your notice template with placeholders and test data'}
          </p>
        </div>

        {mode === 'view' ? (
          <>
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center text-slate-600 mb-1">
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Premises</span>
                </div>
                <p className="font-semibold text-slate-900">{testData.PREMISES_NAME}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center text-slate-600 mb-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <p className="font-semibold text-slate-900">
                  {testData.PREMISES_ADDRESS.split(',').pop()?.trim()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center text-slate-600 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Deadline</span>
                </div>
                <p className="font-semibold text-slate-900">{testData.DEADLINE_DATE}</p>
              </div>
            </div>

            {/* Notice Template Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-white">
                  Statutory Public Notice
                </h2>
                <p className="text-slate-300 text-sm mt-1">
                  As it would appear in publication
                </p>
              </div>
              <div className="p-8">
                <div
                  className="prose prose-slate max-w-none"
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '16px',
                    lineHeight: '1.8',
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: renderedNotice }}
                    className="whitespace-pre-wrap"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Template Editor */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Edit3 className="w-5 h-5 mr-2" />
                    Template Editor
                  </h2>
                  <p className="text-purple-100 text-sm mt-1">
                    Edit your template and insert placeholders
                  </p>
                </div>
                <div className="p-6">
                  <div className="relative mb-4">
                    <button
                      onClick={() => setShowPlaceholderMenu(!showPlaceholderMenu)}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md flex items-center justify-center"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Insert Placeholder
                    </button>

                    {showPlaceholderMenu && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto z-10">
                        {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
                          <button
                            key={placeholder.value}
                            onClick={() => insertPlaceholder(placeholder.value)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                          >
                            <div className="font-medium text-slate-900">{placeholder.label}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">
                              {`{{${placeholder.value}}}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    value={template}
                    onChange={(e) => {
                      setTemplate(e.target.value);
                      setCursorPosition(e.target.selectionStart);
                    }}
                    onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                    onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                    className="w-full h-[600px] p-4 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter your template here..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Use <code className="bg-slate-100 px-1 py-0.5 rounded">{`{{PLACEHOLDER}}`}</code> syntax for dynamic fields
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Test Data & Preview */}
            <div className="space-y-6">
              {/* Test Data Form */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Test Data
                  </h2>
                  <p className="text-green-100 text-sm mt-1">
                    Fill in values to test your template
                  </p>
                </div>
                <div className="p-6 max-h-[400px] overflow-y-auto">
                  <div className="space-y-4">
                    {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
                      <div key={placeholder.value}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {placeholder.label}
                        </label>
                        <input
                          type="text"
                          value={testData[placeholder.value as keyof typeof testData] || ''}
                          onChange={(e) => updateTestData(placeholder.value, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          placeholder={`Enter ${placeholder.label.toLowerCase()}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Live Preview
                  </h2>
                  <p className="text-orange-100 text-sm mt-1">
                    See your notice in real-time
                  </p>
                </div>
                <div className="p-6 max-h-[400px] overflow-y-auto">
                  <div
                    className="prose prose-slate prose-sm max-w-none"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '14px',
                      lineHeight: '1.7',
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: renderedNotice }}
                      className="whitespace-pre-wrap"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
