import { useState } from "react";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { Settings as SettingsIcon, Key, Globe, Bell, Shield } from "lucide-react";

export default function AdminSettings() {
  const { user: adminUser } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api", label: "API Keys", icon: Key },
    { id: "integrations", label: "Integrations", icon: Globe },
  ];

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
                  flex items-center space-x-2 py-4 border-b-2 transition-colors
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
              <h2 className="text-lg font-medium text-slate-900">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={120}
                    className="bg-white text-slate-900 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Failed Login Attempts
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="bg-white text-slate-900 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
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
    </div>
  );
}