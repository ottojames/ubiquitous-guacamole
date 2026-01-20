import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/UnifiedAuthContext';

export interface Council {
  id: string;
  name: string;
  email: string;
  address: string;
}

interface Props {
  value?: string;
  onChange: (council: Council | null) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export default function DynamicCouncilSelect({
  value,
  onChange,
  disabled = false,
  error,
  required = true
}: Props) {
  const { organization, isPlatformAdmin } = useAuth();
  const [councils, setCouncils] = useState<Council[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCouncils();
  }, [organization]);

  const loadCouncils = async () => {
    setLoading(true);

    // If user is from a council and not admin, only show their council
    if (organization?.type === 'council' && !isPlatformAdmin) {
      const council: Council = {
        id: organization.id,
        name: organization.name,
        email: organization.settings?.authority_email || organization.email || '',
        address: organization.settings?.authority_address || ''
      };
      setCouncils([council]);
      onChange(council); // Auto-select their council
    } else {
      // Load all councils for firms/admins
      const { data, error } = await supabase
        .from('active_councils')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading councils:', error);
        // Fallback to organizations table
        const { data: orgs } = await supabase
          .from('organizations')
          .select('*')
          .eq('type', 'council')
          .eq('status', 'active')
          .order('name');

        if (orgs) {
          const councilList = orgs.map(org => ({
            id: org.id,
            name: org.name,
            email: org.email || '',
            address: ''
          }));
          setCouncils(councilList);
        }
      } else if (data) {
        setCouncils(data);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // If only one council (user's own), show as read-only
  if (councils.length === 1 && !isPlatformAdmin) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Council {required && <span className="text-red-500">*</span>}
        </label>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="font-medium">{councils[0].name}</div>
          <div className="text-sm text-gray-500">{councils[0].email}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Council {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => {
          const council = councils.find(c => c.id === e.target.value);
          onChange(council || null);
        }}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        required={required}
      >
        <option value="">Select a council...</option>
        {councils.map(council => (
          <option key={council.id} value={council.id}>
            {council.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}