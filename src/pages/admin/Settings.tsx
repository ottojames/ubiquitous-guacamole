import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { Settings as SettingsIcon, Key, Globe, Bell, Shield, Save, Loader2 } from "lucide-react";
import { AlertModal } from "@/components/ui/AlertModal";

interface AdminSettings {
  session_timeout_minutes: number;
  two_factor_enabled: boolean;
  require_ip_allowlist: boolean;
  ip_allowlist: string[];
}

export default function AdminSettings() {
  const { user: adminUser, session } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  // Form state
  const [settings, setSettings] = useState<AdminSettings>({
    session_timeout_minutes: 120,
    two_factor_enabled: false,
    require_ip_allowlist: false,
    ip_allowlist: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<AdminSettings | null>(null);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    variant: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    variant: 'info',
    title: '',
    message: ''
  });

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api", label: "API Keys", icon: Key },
    { id: "integrations", label: "Integrations", icon: Globe },
  ];

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          setOriginalSettings(data);
        } else {
          console.error('Failed to fetch settings:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session?.access_token]);

  // Track changes
  useEffect(() => {
    if (originalSettings) {
      const changed =
        settings.session_timeout_minutes !== originalSettings.session_timeout_minutes ||
        settings.two_factor_enabled !== originalSettings.two_factor_enabled ||
        settings.require_ip_allowlist !== originalSettings.require_ip_allowlist;
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const handleSave = async () => {
    if (!session?.access_token) {
      setAlertModal({
        isOpen: true,
        variant: 'error',
        title: 'Authentication Error',
        message: 'You must be logged in to save settings.'
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          session_timeout_minutes: settings.session_timeout_minutes,
          two_factor_enabled: settings.two_factor_enabled,
          require_ip_allowlist: settings.require_ip_allowlist
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setOriginalSettings(data.settings);
        setHasChanges(false);
        setAlertModal({
          isOpen: true,
          variant: 'success',
          title: 'Settings Saved',
          message: 'Your security settings have been updated successfully.'
        });
      } else {
        const error = await response.json();
        setAlertModal({
          isOpen: true,
          variant: 'error',
          title: 'Save Failed',
          message: error.error || 'Failed to save settings. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setAlertModal({
        isOpen: true,
        variant: 'error',
        title: 'Save Failed',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSessionTimeoutChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setSettings(prev => ({ ...prev, session_timeout_minutes: num }));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Settings</h1>
        <p className="text-slate-500 mt-1">Manage platform configuration and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t
                  ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-900">General Settings</h2>
              <div className="text-slate-500">
                Platform configuration settings will be displayed here.
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-slate-900">Security Settings</h2>
                {hasChanges && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="session-timeout" className="block text-sm font-medium text-slate-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      id="session-timeout"
                      type="number"
                      min={5}
                      max={1440}
                      value={settings.session_timeout_minutes}
                      onChange={(e) => handleSessionTimeoutChange(e.target.value)}
                      className="bg-white text-slate-900 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-32"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      How long until admin sessions expire (5-1440 minutes)
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="two-factor" className="block text-sm font-medium text-slate-700">
                          Two-Factor Authentication
                        </label>
                        <p className="text-sm text-slate-500">
                          Require 2FA for admin logins
                        </p>
                      </div>
                      <button
                        id="two-factor"
                        type="button"
                        role="switch"
                        aria-checked={settings.two_factor_enabled}
                        onClick={() => setSettings(prev => ({ ...prev, two_factor_enabled: !prev.two_factor_enabled }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          settings.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="ip-allowlist" className="block text-sm font-medium text-slate-700">
                          IP Allowlist
                        </label>
                        <p className="text-sm text-slate-500">
                          Restrict admin access to specific IP addresses
                        </p>
                      </div>
                      <button
                        id="ip-allowlist"
                        type="button"
                        role="switch"
                        aria-checked={settings.require_ip_allowlist}
                        onClick={() => setSettings(prev => ({ ...prev, require_ip_allowlist: !prev.require_ip_allowlist }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          settings.require_ip_allowlist ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.require_ip_allowlist ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-900">Notification Settings</h2>
              <div className="text-slate-500">
                Configure alert thresholds and notification channels.
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-900">API Key Management</h2>
              <div className="text-slate-500">
                Manage service API keys and access tokens.
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-900">Third-Party Integrations</h2>
              <div className="text-slate-500">
                Configure external service integrations.
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  );
}
