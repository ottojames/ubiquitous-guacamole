import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Check, AlertCircle, Info } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  practice_areas: string[] | null;
}

interface ContextType {
  firm: Organization;
  userRole: string;
}

const PRACTICE_AREAS = [
  {
    id: 'licensing',
    name: 'Licensing',
    description: 'Premises licences, variations, reviews, and club certificates',
    icon: '🏪',
    noticeTypes: ['Premises Licence', 'Variation', 'Review', 'Club Certificate']
  },
  {
    id: 'planning',
    name: 'Planning & Development',
    description: 'Planning applications, appeals, and development notices',
    icon: '🏗️',
    noticeTypes: ['Planning Application', 'Planning Appeal', 'Development Notice']
  },
  {
    id: 'highways',
    name: 'Highways & Transport',
    description: 'Traffic orders, road closures, and transport infrastructure',
    icon: '🚦',
    noticeTypes: ['Traffic Order', 'Road Closure', 'Transport Notice']
  },
  {
    id: 'environmental',
    name: 'Environmental',
    description: 'Environmental permits, pollution control, and waste management',
    icon: '🌳',
    noticeTypes: ['Environmental Permit', 'Pollution Notice', 'Waste Management']
  },
  {
    id: 'property',
    name: 'Property & Land',
    description: 'Property transactions, land registry, and compulsory purchase',
    icon: '🏘️',
    noticeTypes: ['Property Notice', 'Land Registry', 'Compulsory Purchase']
  },
  {
    id: 'statutory',
    name: 'Statutory Notices',
    description: 'Legal notices, public announcements, and statutory declarations',
    icon: '⚖️',
    noticeTypes: ['Legal Notice', 'Public Announcement', 'Statutory Declaration']
  }
];

export default function Settings() {
  const { firm: initialFirm, userRole } = useOutletContext<ContextType>();
  const [firm, setFirm] = useState<Organization>(initialFirm);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    initialFirm.practice_areas || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggleArea = (areaId: string) => {
    setSelectedAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          practice_areas: selectedAreas
        })
        .eq('id', firm.id);

      if (updateError) throw updateError;

      setSuccess('Practice areas updated successfully');
      setSaving(false);

      // Update local state
      setFirm({ ...firm, practice_areas: selectedAreas });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedAreas.sort()) !== JSON.stringify((firm.practice_areas || []).sort());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Firm Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure practice areas and preferences for {firm.name}
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error saving settings</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">Success</p>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Practice Areas Section */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Practice Areas</h2>
          <p className="text-gray-600 mt-1">
            Select the areas of law your firm practices. This will customize the notice types available in the publishing wizard.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900">How it works</p>
            <p className="text-sm text-purple-700 mt-1">
              Only notice types relevant to your selected practice areas will be shown when publishing notices.
              This streamlines the process and ensures you only see notices relevant to your firm's expertise.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRACTICE_AREAS.map((area) => {
            const isSelected = selectedAreas.includes(area.id);

            return (
              <button
                key={area.id}
                onClick={() => handleToggleArea(area.id)}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all text-left
                  ${isSelected
                    ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                  }
                `}
              >
                {/* Selection Indicator */}
                <div className={`
                  absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300 bg-white'
                  }
                `}>
                  {isSelected && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Icon */}
                <div className="text-4xl mb-3">{area.icon}</div>

                {/* Title */}
                <h3 className={`text-lg font-semibold mb-2 ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                  {area.name}
                </h3>

                {/* Description */}
                <p className={`text-sm mb-3 ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                  {area.description}
                </p>

                {/* Notice Types */}
                <div className="flex flex-wrap gap-1.5">
                  {area.noticeTypes.map((type) => (
                    <span
                      key={type}
                      className={`
                        text-xs px-2 py-1 rounded-md font-medium
                        ${isSelected
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {selectedAreas.length === 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">No practice areas selected</p>
              <p className="text-sm text-amber-700 mt-1">
                Please select at least one practice area to enable notice publishing for your firm.
              </p>
            </div>
          </div>
        )}

        {selectedAreas.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>{selectedAreas.length}</strong> practice area{selectedAreas.length !== 1 ? 's' : ''} selected.
              Your firm will have access to notices in: <strong>{selectedAreas.map(id =>
                PRACTICE_AREAS.find(a => a.id === id)?.name
              ).join(', ')}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Firm Information (Read-only) */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Firm Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Firm Name
            </label>
            <p className="text-gray-900 font-medium">{firm.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Organization Type
            </label>
            <p className="text-gray-900">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-semibold">
                Law Firm
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Firm Slug
            </label>
            <p className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg inline-block">{firm.slug}</p>
            <p className="text-sm text-gray-500 mt-1">
              Used in URLs: /f/{firm.slug}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Your Role
            </label>
            <p className="text-gray-900 capitalize">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                {userRole.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div>
          {hasChanges && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              You have unsaved changes
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
