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
        <h1 className="text-2xl font-semibold text-white">Admin Settings</h1>
        <p className="text-gray-400 mt-1">Manage platform configuration and preferences</p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-red-500 text-red-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
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
              <h2 className="text-lg font-medium text-white">General Settings</h2>
              <div className="text-gray-400">
                Platform configuration settings will be displayed here.
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-white">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={120}
                    className="bg-gray-900 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Failed Login Attempts
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="bg-gray-900 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-white">Notification Settings</h2>
              <div className="text-gray-400">
                Configure alert thresholds and notification channels.
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-white">API Key Management</h2>
              <div className="text-gray-400">
                Manage service API keys and access tokens.
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-white">Third-Party Integrations</h2>
              <div className="text-gray-400">
                Configure external service integrations.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}