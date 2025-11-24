import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, Calendar, Building2 } from 'lucide-react';
import { renderNoticeTemplate } from '@/next/publish/templates/engine';

// Sample data for Sampleton Borough Council premises licence
const sampleNotice = {
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

const PREMISES_LICENCE_TEMPLATE = `LICENSING ACT 2003
APPLICATION FOR A NEW PREMISES LICENCE

Notice is hereby given that {{APPLICANT_NAME}}{{#if APPLICANT_TRADING_AS}} trading as {{APPLICANT_TRADING_AS}}{{/if}} has applied{{#if HAS_MULTIPLE_AUTHORITIES}} concurrently{{/if}} to {{AUTHORITY_NAMES_LIST}} for a new premises licence for {{PREMISES_NAME}}{{#if PREMISES_NAME}}, {{/if}}{{PREMISES_ADDRESS}}.

Licensable activities applied for: {{LICENSABLE_ACTIVITIES}}.
Proposed hours: {{ACTIVITY_SCHEDULE}}.{{#if OPENING_HOURS}} Opening hours: {{OPENING_HOURS}}.{{/if}}{{#if DPS_NAME}} The proposed designated premises supervisor is {{DPS_NAME}}.{{/if}}

The application can be inspected at {{INSPECTION_LOCATION}} during {{INSPECTION_TIMES}}{{#if ONLINE_REGISTER_URL}} or online at {{ONLINE_REGISTER_URL}}{{/if}}.

Any representations must be made in writing to {{AUTHORITY_NAME}} at {{REPRESENTATION_ADDRESS}}{{#if REPRESENTATION_EMAIL}} or {{REPRESENTATION_EMAIL}}{{/if}} by {{DEADLINE_DATE}}. Representors must also serve a copy of their representations on each of the responsible authorities{{#if RESPONSIBLE_AUTHORITIES_LIST_URL}} (the list is available at {{RESPONSIBLE_AUTHORITIES_LIST_URL}} or from the licensing authority){{/if}}.

It is an offence to knowingly or recklessly make a false statement in connection with an application and the maximum fine for which a person is liable on summary conviction for the offence is a level 5 fine.`;

export default function SampleNotice() {
  const renderedNotice = renderNoticeTemplate(PREMISES_LICENCE_TEMPLATE, sampleNotice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/showcase"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-medium">Back to Showcase</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Sample Premises Licence Notice
          </h1>
          <p className="text-lg text-slate-600">
            Sampleton Borough Council — Structured Template Format
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center text-slate-600 mb-1">
              <Building2 className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Premises</span>
            </div>
            <p className="font-semibold text-slate-900">The Red Lion</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center text-slate-600 mb-1">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="font-semibold text-slate-900">Sampleton, SP2 3BB</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center text-slate-600 mb-1">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Deadline</span>
            </div>
            <p className="font-semibold text-slate-900">{sampleNotice.DEADLINE_DATE}</p>
          </div>
        </div>

        {/* Notice Template */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
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

        {/* Key Details Section */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Application Details</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">Applicant</h3>
              <p className="text-slate-900 font-medium">
                {sampleNotice.APPLICANT_NAME}
                {sampleNotice.APPLICANT_TRADING_AS && (
                  <span className="text-slate-600"> trading as {sampleNotice.APPLICANT_TRADING_AS}</span>
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">Licensable Activities</h3>
              <p className="text-slate-900">{sampleNotice.LICENSABLE_ACTIVITIES}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">Proposed Hours</h3>
              <p className="text-slate-900">{sampleNotice.ACTIVITY_SCHEDULE}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">Opening Hours</h3>
              <p className="text-slate-900">{sampleNotice.OPENING_HOURS}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">Designated Premises Supervisor</h3>
              <p className="text-slate-900">{sampleNotice.DPS_NAME}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
