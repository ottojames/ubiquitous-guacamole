import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
}

interface CouncilSelectorProps {
  value: string;
  onChange: (departmentId: string) => void;
  required?: boolean;
  className?: string;
  noticeType?: string; // Optional: filter councils by notice type capability
}

export default function CouncilSelector({
  value,
  onChange,
  required = true,
  className = '',
  noticeType
}: CouncilSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [councils, setCouncils] = useState<Department[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCouncils();
  }, [noticeType]);

  const loadCouncils = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all licensing departments from councils
      const { data, error: queryError } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          organization_id,
          organization:organizations!inner (
            id,
            name,
            type
          )
        `)
        .eq('organization.type', 'council')
        .eq('type', 'licensing')
        .order('organization.name');

      if (queryError) throw queryError;

      const departments = data?.map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        organization_id: dept.organization.id,
        organization_name: dept.organization.name
      })) || [];

      setCouncils(departments);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load councils:', err);
      setError(err.message || 'Failed to load councils');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Council
        </label>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Council
        </label>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
          <button
            onClick={loadCouncils}
            className="ml-2 underline font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (councils.length === 0) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Council
        </label>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          No councils with licensing departments found. Please contact support.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Select Council <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Choose a council --</option>
        {councils.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.organization_name} - {dept.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-2">
        Select the council that will review your application
      </p>
    </div>
  );
}
