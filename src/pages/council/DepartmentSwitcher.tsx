import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  slug: string;
  type: string;
  notice_count: number;
  has_access: boolean;
  organization: {
    name: string;
    slug: string;
  };
}

export default function DepartmentSwitcher() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentOrg, setCurrentOrg] = useState<string>('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      // Demo mode: Show Westminster departments with Licensing access only
      const westminsterOrg = {
        id: 'fb76a8aa-4e3d-40ac-9c61-e9217ed930a4',
        name: 'Westminster (City of) Council',
        slug: 'westminster-city-of-council'
      };

      const { data: depts } = await supabase
        .from('departments')
        .select('id, name, slug, type')
        .eq('organization_id', westminsterOrg.id)
        .order('name');

      if (depts) {
        // Get notice counts for each department
        const deptsWithAccess = await Promise.all(
          depts.map(async (dept) => {
            const { count } = await supabase
              .from('notices')
              .select('*', { count: 'exact', head: true })
              .eq('council_id', '02cb9c23-92bb-4f51-9e1a-30698dccffb6');

            return {
              ...dept,
              notice_count: count || 0,
              has_access: dept.slug === 'licensing', // Only Licensing access
              organization: westminsterOrg
            };
          })
        );

        setDepartments(deptsWithAccess);
        setCurrentOrg(westminsterOrg.name);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading departments:', error);
      setLoading(false);
    }
  };

  const handleSelectDepartment = (dept: Department) => {
    if (!dept.has_access) {
      // Show access denied message
      alert(`Access Denied\n\nYou do not have permission to access the ${dept.name} department.\n\nYour role: Licensing Officer\nYour department: Licensing\n\nContact your administrator if you need access to other departments.`);
      return;
    }

    // Navigate to the department
    navigate(`/c/${dept.organization.slug}/${dept.slug}/dashboard`);
  };

  const getDepartmentIcon = (type: string) => {
    switch (type) {
      case 'licensing':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'traffic':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'planning':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Switch Department</h1>
          <p className="text-gray-600 mt-2">{currentOrg}</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-semibold">Licensing Officer</span>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => handleSelectDepartment(dept)}
              disabled={!dept.has_access}
              className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                dept.has_access
                  ? 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-lg cursor-pointer'
                  : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Access Badge */}
              {dept.has_access ? (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Access
                  </span>
                </div>
              ) : (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    No Access
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`mb-4 ${dept.has_access ? 'text-blue-600' : 'text-gray-400'}`}>
                {getDepartmentIcon(dept.type)}
              </div>

              {/* Department Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{dept.name}</h3>

              {/* Notice Count */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{dept.notice_count} active notices</span>
              </div>

              {/* Access Message */}
              {!dept.has_access && (
                <p className="mt-4 text-xs text-gray-500">
                  Contact your administrator for access
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Department Access Control</h4>
              <p className="text-sm text-gray-700">
                Your account has been granted access to the <strong>Licensing department</strong> only.
                This ensures proper separation of duties and data security across different council functions.
                If you need access to additional departments, please contact your department administrator or IT support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
