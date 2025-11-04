import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/permissions';

interface Department {
  id: string;
  name: string;
  slug: string;
  type: string;
  email: string;
  description: string | null;
  settings: any;
  organization: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

interface ContextType {
  department: Department;
  userRole: string;
}

export default function Settings() {
  const { department: initialDepartment, userRole } = useOutletContext<ContextType>();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [department, setDepartment] = useState<Department>(initialDepartment);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    default_representation_period_days: 28,
    require_approval_for_publication: false,
    default_newspaper: '',
    auto_expire_notices: true,
    allowed_notice_types: [] as string[],
    ...initialDepartment.settings
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      setError('Please upload a PNG, JPG, or SVG image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB');
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${department.organization.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('organization-logos')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          setError('Failed to upload logo: ' + uploadError.message);
          setSaving(false);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('organization-logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // Update department settings
      const { error: updateError } = await supabase
        .from('departments')
        .update({
          name: department.name,
          email: department.email,
          description: department.description,
          settings: settings
        })
        .eq('id', department.id);

      if (updateError) throw updateError;

      // Update organization logo if provided
      if (logoUrl) {
        const { error: logoError } = await supabase
          .from('organizations')
          .update({ logo_url: logoUrl })
          .eq('id', department.organization.id);

        if (logoError) {
          console.error('Logo update error:', logoError);
          setError('Failed to update logo: ' + logoError.message);
          setSaving(false);
          return;
        }

        // Update local state
        setDepartment({
          ...department,
          organization: {
            ...department.organization,
            logo_url: logoUrl
          }
        });

        // Clear logo file and preview
        setLogoFile(null);
        setLogoPreview(null);
      }

      setSuccess('Settings saved successfully');
      setSaving(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      setSaving(false);
    }
  };

  // Check if user has permission to update settings using RBAC system
  const canManageSettings = hasPermission(PERMISSIONS.SETTINGS_UPDATE);

  const noticeTypes = [
    { value: 'premises-licence', label: 'Premises Licence' },
    { value: 'variation', label: 'Variation' },
    { value: 'review', label: 'Review' },
    { value: 'club-certificate', label: 'Club Certificate' },
    { value: 'planning-application', label: 'Planning Application' },
    { value: 'traffic-order', label: 'Traffic Order' },
    { value: 'road-closure', label: 'Road Closure' }
  ];

  if (!canManageSettings) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 text-center">
        <p className="text-gray-600">You don't have permission to manage department settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Department Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure preferences for {department.name}
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name
            </label>
            <input
              type="text"
              value={department.name}
              onChange={(e) => setDepartment({ ...department, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Licensing Department"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={department.email}
              onChange={(e) => setDepartment({ ...department, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., licensing@council.gov.uk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={department.description || ''}
              onChange={(e) => setDepartment({ ...department, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Brief description of the department's responsibilities"
            />
          </div>
        </div>
      </div>

      {/* Notice Settings */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notice Settings</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Representation Period (Days)
            </label>
            <input
              type="number"
              value={settings.default_representation_period_days}
              onChange={(e) => setSettings({
                ...settings,
                default_representation_period_days: parseInt(e.target.value)
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="7"
              max="90"
            />
            <p className="text-sm text-gray-500 mt-1">
              Default number of days for public to submit representations (typically 28 days for licensing)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Newspaper
            </label>
            <input
              type="text"
              value={settings.default_newspaper}
              onChange={(e) => setSettings({ ...settings, default_newspaper: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Local Gazette"
            />
            <p className="text-sm text-gray-500 mt-1">
              Default newspaper for notice publications
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Allowed Notice Types
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {noticeTypes.map(type => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={settings.allowed_notice_types.includes(type.value)}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...settings.allowed_notice_types, type.value]
                        : settings.allowed_notice_types.filter((t: string) => t !== type.value);
                      setSettings({ ...settings, allowed_notice_types: types });
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select which notice types can be created by this department
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_approval_for_publication}
                onChange={(e) => setSettings({
                  ...settings,
                  require_approval_for_publication: e.target.checked
                })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Require approval before publication
                </span>
                <p className="text-sm text-gray-500">
                  Editors must submit notices for admin approval before publishing
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_expire_notices}
                onChange={(e) => setSettings({
                  ...settings,
                  auto_expire_notices: e.target.checked
                })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Automatically expire notices
                </span>
                <p className="text-sm text-gray-500">
                  Notices will automatically be marked as expired when their expiry date is reached
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Organization Info (Read-only) */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Organization Information</h2>

        {/* Logo Upload */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Organization Logo
          </label>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {logoPreview || department.organization.logo_url ? (
                <div className="relative w-32 h-32 rounded-xl border-2 border-gray-200 overflow-hidden bg-white">
                  <img
                    src={logoPreview || department.organization.logo_url || ''}
                    alt="Organization logo"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <span className="text-gray-400 text-sm text-center px-2">No logo</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                Upload your organization's logo. This will be displayed on notices and documents. Recommended size: 400x400px.
              </p>
              <div className="flex gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  Choose File
                </label>
                {(logoPreview || logoFile) && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Accepted formats: PNG, JPG, SVG (max 2MB)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Organization
            </label>
            <p className="text-gray-900">{department.organization.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Department Type
            </label>
            <p className="text-gray-900 capitalize">{department.type.replace('_', ' ')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Department Slug
            </label>
            <p className="text-gray-900 font-mono">{department.slug}</p>
            <p className="text-sm text-gray-500 mt-1">
              Used in URLs: /c/{department.organization.name.toLowerCase().replace(/\s+/g, '-')}/{department.slug}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Organization-level settings can only be changed by organization administrators.
              Contact your organization admin to update organization details.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
