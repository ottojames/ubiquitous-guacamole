import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Zap, Search, Plus } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  default_address?: string;
  default_postcode?: string;
  recent_premises?: string[];
}

interface QuickPublishWidgetProps {
  firmId: string;
}

export default function QuickPublishWidget({ firmId }: QuickPublishWidgetProps) {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, [firmId]);

  const loadClients = async () => {
    try {
      setLoading(true);
      // Fetch clients for this firm
      const { data, error } = await supabase
        .from('firm_clients')
        .select('*')
        .eq('firm_id', firmId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPublish = () => {
    if (!selectedClient) return;

    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    // Navigate to publish wizard with pre-filled client data
    const prefillData = {
      applicantName: client.name,
      applicantEmail: client.email,
      applicantPhone: client.phone,
      applicantCompany: client.company,
      premisesAddress: client.default_address,
      premisesPostcode: client.default_postcode
    };

    // Store in session for the wizard to pick up
    sessionStorage.setItem('quickPublishData', JSON.stringify(prefillData));
    sessionStorage.setItem('quickPublishClientId', client.id);

    // Navigate to publish wizard
    navigate('/publish/step-1');
  };

  const filteredClients = clients.filter(client =>
    searchTerm === '' ||
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Quick Publish</h3>
        </div>
        <span className="text-sm text-gray-500">{clients.length} clients</span>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No clients yet</p>
          <button
            onClick={() => navigate(`/f/${firmId}/clients`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add First Client
          </button>
        </div>
      ) : (
        <>
          {/* Client Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search clients..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Client Selector */}
          <div className="mb-4">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a client</option>
              {filteredClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.company}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Client Preview */}
          {selectedClient && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-900">
                {clients.find(c => c.id === selectedClient)?.name}
              </p>
              <p className="text-xs text-blue-700">
                {clients.find(c => c.id === selectedClient)?.company}
              </p>
              {clients.find(c => c.id === selectedClient)?.default_address && (
                <p className="text-xs text-blue-600 mt-1">
                  {clients.find(c => c.id === selectedClient)?.default_address}
                </p>
              )}
            </div>
          )}

          {/* Quick Publish Button */}
          <button
            onClick={handleQuickPublish}
            disabled={!selectedClient}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Start Quick Publish
          </button>

          <p className="text-xs text-gray-500 text-center mt-2">
            Auto-fills client details in the publish wizard
          </p>
        </>
      )}
    </div>
  );
}