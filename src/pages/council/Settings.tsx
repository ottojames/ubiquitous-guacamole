import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { PERMISSIONS } from '@/types/permissions';
import { Building2, Bell, CreditCard, FileText, Users, HelpCircle, CheckCircle } from 'lucide-react';
import { toast, useToastController } from '@/lib/ui/toast';
import AddressLookup, { mockProvider, type AddressResult } from '@/components/AddressLookup';

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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// UK phone validation regex (allows various formats)
const PHONE_REGEX = /^[\d\s+()-]{10,20}$/;
// URL validation regex
const URL_REGEX = /^https?:\/\/.+/;

interface ValidationErrors {
  department_email?: string;
  authority_email?: string;
  authority_phone?: string;
  online_register_url?: string;
  licensing_manager_email?: string;
}

export default function Settings() {
  const { department: initialDepartment, userRole } = useOutletContext<ContextType>();
  const { hasPermission } = useAuth();
  const toastMessage = useToastController();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

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

  // Council settings for auto-population
  const [councilSettings, setCouncilSettings] = useState({
    authority_address: '',
    authority_email: '',
    authority_phone: '',
    online_register_url: '',
    authority_name: '',
    licensing_manager_name: '',
    licensing_manager_email: ''
  });

  // Load council settings on mount
  useEffect(() => {
    loadCouncilSettings();
  }, [initialDepartment.id]);

  const loadCouncilSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('council_settings')
        .select('*')
        .eq('department_id', initialDepartment.id)
        .single();

      if (data) {
        setCouncilSettings({
          authority_address: data.authority_address || '',
          authority_email: data.authority_email || '',
          authority_phone: data.authority_phone || '',
          online_register_url: data.online_register_url || '',
          authority_name: data.authority_name || '',
          licensing_manager_name: data.licensing_manager_name || '',
          licensing_manager_email: data.licensing_manager_email || ''
        });
      }
    } catch (err) {
      console.log('No council settings found, using defaults');
    }
  };

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

  // Validate a single field and return error message if invalid
  const validateField = (field: string, value: string): string | undefined => {
    if (!value) return undefined; // Empty values are handled by required attribute

    switch (field) {
      case 'department_email':
      case 'authority_email':
      case 'licensing_manager_email':
        if (!EMAIL_REGEX.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'authority_phone':
        if (!PHONE_REGEX.test(value)) {
          return 'Please enter a valid phone number';
        }
        break;
      case 'online_register_url':
        if (!URL_REGEX.test(value)) {
          return 'Please enter a valid URL starting with http:// or https://';
        }
        break;
    }
    return undefined;
  };

  // Handle field blur for inline validation
  const handleFieldBlur = (field: keyof ValidationErrors, value: string) => {
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Validate all fields before save
  const validateAll = (): boolean => {
    const errors: ValidationErrors = {};

    if (department.email && !EMAIL_REGEX.test(department.email)) {
      errors.department_email = 'Please enter a valid email address';
    }
    if (councilSettings.authority_email && !EMAIL_REGEX.test(councilSettings.authority_email)) {
      errors.authority_email = 'Please enter a valid email address';
    }
    if (councilSettings.authority_phone && !PHONE_REGEX.test(councilSettings.authority_phone)) {
      errors.authority_phone = 'Please enter a valid phone number';
    }
    if (councilSettings.online_register_url && !URL_REGEX.test(councilSettings.online_register_url)) {
      errors.online_register_url = 'Please enter a valid URL starting with http:// or https://';
    }
    if (councilSettings.licensing_manager_email && !EMAIL_REGEX.test(councilSettings.licensing_manager_email)) {
      errors.licensing_manager_email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validate before saving
    if (!validateAll()) {
      setError('Please fix the validation errors before saving');
      return;
    }

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

      // Save or update council settings
      const { error: councilError } = await supabase
        .from('council_settings')
        .upsert({
          department_id: department.id,
          ...councilSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'department_id'
        });

      if (councilError) {
        console.error('Failed to save council settings:', councilError);
      }

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

      toast('Settings saved successfully');
      setSaving(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      setSaving(false);
    }
  };

  // Check if user has permission to update settings using RBAC system
  const canManageSettings = hasPermission(PERMISSIONS.SETTINGS_UPDATE);

  // Format address result into a single string for storage
  const formatAddressForStorage = (address: AddressResult): string => {
    const parts = [
      address.line1,
      address.line2,
      address.line3,
      address.town,
      address.county,
      address.postcode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Handle address selection from AddressLookup
  const handleAddressResolved = (address: AddressResult) => {
    const formattedAddress = formatAddressForStorage(address);
    setCouncilSettings(prev => ({ ...prev, authority_address: formattedAddress }));
  };

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

  // Card styling - consistent with design system (ring-1 ring-slate-200)
  const cardClass = "bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm";
  const sectionHeaderClass = "flex items-center gap-3 pb-4 border-b border-slate-100 mb-6";
  const sectionTitleClass = "text-xl font-semibold text-slate-900";
  const sectionDescClass = "text-sm text-slate-600";
  const labelClass = "block text-sm font-medium text-slate-700 mb-2";
  const inputClass = "w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 hover:border-slate-400 transition-colors";
  const helpTextClass = "text-sm text-slate-500 mt-1";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Department Settings</h1>
        <p className="text-slate-600 mt-1">
          Configure preferences for {department.name}
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-lg p-4 bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}


      {/* Section 1: Authority Details */}
      <section className={`${cardClass} p-6 md:p-8`}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className={sectionTitleClass}>Authority Details</h2>
            <p className={sectionDescClass}>Core information about your department and organization</p>
          </div>
        </div>

        {/* Help text explaining auto-population */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Auto-population enabled</p>
              <p className="text-sm text-blue-700 mt-1">
                These details will automatically populate in the publish wizard when creating notices,
                saving time and ensuring consistency across all your publications.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Department Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                Department Name
              </label>
              <input
                type="text"
                value={department.name}
                onChange={(e) => setDepartment({ ...department, name: e.target.value })}
                className={inputClass}
                placeholder="e.g., Licensing Department"
              />
            </div>

            <div>
              <label className={labelClass}>
                Contact Email
              </label>
              <input
                type="email"
                value={department.email}
                onChange={(e) => {
                  setDepartment({ ...department, email: e.target.value });
                  if (validationErrors.department_email) {
                    setValidationErrors(prev => ({ ...prev, department_email: undefined }));
                  }
                }}
                onBlur={(e) => handleFieldBlur('department_email', e.target.value)}
                className={`${inputClass} ${validationErrors.department_email ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500' : ''}`}
                placeholder="e.g., licensing@council.gov.uk"
              />
              {validationErrors.department_email && (
                <p className="text-sm text-rose-600 mt-1">{validationErrors.department_email}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Description
            </label>
            <textarea
              value={department.description || ''}
              onChange={(e) => setDepartment({ ...department, description: e.target.value })}
              className={`${inputClass} resize-y`}
              rows={3}
              placeholder="Brief description of the department's responsibilities"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Authority Contact Information
            </h3>
          </div>

          <div>
            <label className={labelClass}>
              Authority Address <span className="text-rose-500">*</span>
            </label>
            <AddressLookup
              provider={mockProvider}
              placeholder="Search for address or postcode..."
              onResolved={handleAddressResolved}
              className="mb-2"
            />
            {councilSettings.authority_address && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600 font-medium mb-1">Selected address:</p>
                <p className="text-sm text-slate-900">{councilSettings.authority_address}</p>
              </div>
            )}
            <p className="text-sm text-slate-500 mt-2">
              Start typing to search UK addresses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                Authority Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={councilSettings.authority_email}
                onChange={(e) => {
                  setCouncilSettings({ ...councilSettings, authority_email: e.target.value });
                  if (validationErrors.authority_email) {
                    setValidationErrors(prev => ({ ...prev, authority_email: undefined }));
                  }
                }}
                onBlur={(e) => handleFieldBlur('authority_email', e.target.value)}
                className={`${inputClass} ${validationErrors.authority_email ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500' : ''}`}
                placeholder="e.g., licensing@westminster.gov.uk"
                required
              />
              {validationErrors.authority_email && (
                <p className="text-sm text-rose-600 mt-1">{validationErrors.authority_email}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Authority Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={councilSettings.authority_phone}
                onChange={(e) => {
                  setCouncilSettings({ ...councilSettings, authority_phone: e.target.value });
                  if (validationErrors.authority_phone) {
                    setValidationErrors(prev => ({ ...prev, authority_phone: undefined }));
                  }
                }}
                onBlur={(e) => handleFieldBlur('authority_phone', e.target.value)}
                className={`${inputClass} ${validationErrors.authority_phone ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500' : ''}`}
                placeholder="e.g., 020 7641 2500"
                required
              />
              {validationErrors.authority_phone && (
                <p className="text-sm text-rose-600 mt-1">{validationErrors.authority_phone}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Online Register URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              value={councilSettings.online_register_url}
              onChange={(e) => {
                setCouncilSettings({ ...councilSettings, online_register_url: e.target.value });
                if (validationErrors.online_register_url) {
                  setValidationErrors(prev => ({ ...prev, online_register_url: undefined }));
                }
              }}
              onBlur={(e) => handleFieldBlur('online_register_url', e.target.value)}
              className={`${inputClass} ${validationErrors.online_register_url ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500' : ''}`}
              placeholder="e.g., https://www.westminster.gov.uk/licensing/register"
              required
            />
            {validationErrors.online_register_url && (
              <p className="text-sm text-rose-600 mt-1">{validationErrors.online_register_url}</p>
            )}
            <p className={helpTextClass}>
              URL where public can view the licensing register
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Optional Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>
                  Licensing Manager Name
                </label>
                <input
                  type="text"
                  value={councilSettings.licensing_manager_name}
                  onChange={(e) => setCouncilSettings({ ...councilSettings, licensing_manager_name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Sarah Thompson"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Licensing Manager Email
                </label>
                <input
                  type="email"
                  value={councilSettings.licensing_manager_email}
                  onChange={(e) => {
                    setCouncilSettings({ ...councilSettings, licensing_manager_email: e.target.value });
                    if (validationErrors.licensing_manager_email) {
                      setValidationErrors(prev => ({ ...prev, licensing_manager_email: undefined }));
                    }
                  }}
                  onBlur={(e) => handleFieldBlur('licensing_manager_email', e.target.value)}
                  className={`${inputClass} ${validationErrors.licensing_manager_email ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500' : ''}`}
                  placeholder="e.g., sarah.thompson@westminster.gov.uk"
                />
                {validationErrors.licensing_manager_email && (
                  <p className="text-sm text-rose-600 mt-1">{validationErrors.licensing_manager_email}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Notification Preferences */}
      <section className={`${cardClass} p-6 md:p-8`}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className={sectionTitleClass}>Notification Preferences</h2>
            <p className={sectionDescClass}>Configure how you want to receive updates and alerts</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={settings.require_approval_for_publication}
              onChange={(e) => setSettings({
                ...settings,
                require_approval_for_publication: e.target.checked
              })}
              className="w-5 h-5 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-600/30"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">
                Require approval before publication
              </span>
              <p className="text-sm text-slate-500 mt-0.5">
                Editors must submit notices for admin approval before publishing. You'll receive a notification when notices are pending review.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={settings.auto_expire_notices}
              onChange={(e) => setSettings({
                ...settings,
                auto_expire_notices: e.target.checked
              })}
              className="w-5 h-5 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-600/30"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">
                Automatically expire notices
              </span>
              <p className="text-sm text-slate-500 mt-0.5">
                Notices will automatically be marked as expired when their expiry date is reached. No manual intervention needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Notice Settings */}
      <section className={`${cardClass} p-6 md:p-8`}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className={sectionTitleClass}>Notice Settings</h2>
            <p className={sectionDescClass}>Configure defaults for notice publications</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                Default Representation Period (Days)
              </label>
              <input
                type="number"
                value={settings.default_representation_period_days}
                onChange={(e) => setSettings({
                  ...settings,
                  default_representation_period_days: parseInt(e.target.value)
                })}
                className={inputClass}
                min="7"
                max="90"
              />
              <p className={helpTextClass}>
                Typically 28 days for licensing applications
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Default Newspaper
              </label>
              <input
                type="text"
                value={settings.default_newspaper}
                onChange={(e) => setSettings({ ...settings, default_newspaper: e.target.value })}
                className={inputClass}
                placeholder="e.g., Local Gazette"
              />
              <p className={helpTextClass}>
                For printed notice requirements
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <label className={`${labelClass} mb-4`}>
              Allowed Notice Types
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {noticeTypes.map(type => (
                <label
                  key={type.value}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
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
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-600/30"
                  />
                  <span className="text-sm font-medium text-slate-700">{type.label}</span>
                </label>
              ))}
            </div>
            <p className={`${helpTextClass} mt-3`}>
              Select which notice types can be created by this department
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Billing */}
      <section className={`${cardClass} p-6 md:p-8`}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50">
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className={sectionTitleClass}>Billing</h2>
            <p className={sectionDescClass}>Your current plan and payment information</p>
          </div>
        </div>

        {/* Current Plan */}
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-emerald-900">Council Portal</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white uppercase tracking-wide">
                  FREE
                </span>
              </div>
              <p className="text-sm text-emerald-700 mt-2 max-w-md">
                Free to receive and manage notices published to your authority. Only pay <span className="font-semibold">£19.99/notice</span> when <em>you</em> publish a notice.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-emerald-200/60">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4" />
              <span>Unlimited notice inbox</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700 mt-1">
              <CheckCircle className="w-4 h-4" />
              <span>Representation management</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700 mt-1">
              <CheckCircle className="w-4 h-4" />
              <span>Team collaboration</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Questions about billing? Contact <a href="mailto:support@civicnotices.co.uk" className="text-blue-600 hover:underline">support@civicnotices.co.uk</a>
        </p>
      </section>

      {/* Section 5: Organization Information */}
      <section className={`${cardClass} p-6 md:p-8`}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
            <Users className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className={sectionTitleClass}>Organization Information</h2>
            <p className={sectionDescClass}>Your organization details and branding</p>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <label className={`${labelClass} mb-3`}>
            Organization Logo
          </label>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {logoPreview || department.organization.logo_url ? (
                <div className="relative w-32 h-32 rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white">
                  <img
                    src={logoPreview || department.organization.logo_url || ''}
                    alt="Organization logo"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                  <span className="text-slate-400 text-sm text-center px-2">No logo</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-3">
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
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Accepted formats: PNG, JPG, SVG (max 2MB)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Organization
            </label>
            <p className="text-slate-900 font-medium">{department.organization.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Department Type
            </label>
            <p className="text-slate-900 font-medium capitalize">{department.type.replace('_', ' ')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Department Slug
            </label>
            <p className="text-slate-900 font-mono text-sm">{department.slug}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-sm text-slate-600">
            <strong className="text-slate-700">Note:</strong> Organization-level settings can only be changed by organization administrators.
            Contact your organization admin to update organization details.
          </p>
        </div>
      </section>

      {/* Save Button */}
      <div className={`${cardClass} p-6 flex items-center justify-between`}>
        <p className="text-sm text-slate-500">
          Changes are saved to your department settings
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.4)]"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
