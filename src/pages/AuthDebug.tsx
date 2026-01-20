import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function AuthDebug() {
  const auth = useAuth();
  const [session, setSession] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);

  useEffect(() => {
    loadDebugInfo();
  }, [auth.user]);

  const loadDebugInfo = async () => {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);

    // Get memberships if user exists
    if (auth.user) {
      const { data: orgMemberships } = await supabase
        .from('organization_memberships')
        .select('*, organization:organizations(*)')
        .eq('user_id', auth.user.id);

      const { data: deptMemberships } = await supabase
        .from('department_memberships')
        .select('*, department:departments(*)')
        .eq('user_id', auth.user.id);

      setMemberships([
        ...(orgMemberships || []).map(m => ({ ...m, type: 'organization' })),
        ...(deptMemberships || []).map(m => ({ ...m, type: 'department' }))
      ]);
    }
  };

  const testJWTClaims = () => {
    if (session?.access_token) {
      const parts = session.access_token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('JWT Claims:', payload);
        return payload;
      }
    }
    return null;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔍 Auth Debug Dashboard</h1>

      {/* Auth State */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-blue-600">Auth Context State</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>User:</strong> {auth.user?.email || 'Not logged in'}
          </div>
          <div>
            <strong>Loading:</strong> {auth.loading ? '⏳ Yes' : '✅ No'}
          </div>
          <div>
            <strong>Organization:</strong> {auth.organization?.name || 'None'}
          </div>
          <div>
            <strong>Department:</strong> {auth.department?.name || 'None'}
          </div>
          <div>
            <strong>Role:</strong> {auth.role || 'None'}
          </div>
          <div>
            <strong>Is Platform Admin:</strong> {auth.isPlatformAdmin ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>Admin Role:</strong> {auth.adminRole || 'None'}
          </div>
          <div>
            <strong>Organizations Count:</strong> {auth.organizations.length}
          </div>
        </div>
      </section>

      {/* Session Info */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-green-600">Supabase Session</h2>
        {session ? (
          <div>
            <div className="mb-2">
              <strong>Session ID:</strong> {session.user?.id}
            </div>
            <div className="mb-2">
              <strong>Email:</strong> {session.user?.email}
            </div>
            <div className="mb-2">
              <strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:underline">
                View Raw Session
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <p className="text-gray-500">No active session</p>
        )}
      </section>

      {/* JWT Claims */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-purple-600">JWT Custom Claims</h2>
        {session ? (
          <pre className="p-4 bg-gray-100 rounded overflow-auto text-xs">
            {JSON.stringify(testJWTClaims(), null, 2)}
          </pre>
        ) : (
          <p className="text-gray-500">No session to decode</p>
        )}
      </section>

      {/* Memberships */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-orange-600">
          Organization & Department Memberships
        </h2>
        {memberships.length > 0 ? (
          <div className="space-y-2">
            {memberships.map((m, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded">
                <div>
                  <strong>Type:</strong> {m.type}
                </div>
                <div>
                  <strong>Name:</strong> {
                    m.type === 'organization'
                      ? m.organization?.name
                      : m.department?.name
                  }
                </div>
                <div>
                  <strong>Role:</strong> {m.role}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No memberships found</p>
        )}
      </section>

      {/* Quick Actions */}
      <section className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Quick Actions</h2>
        <div className="space-x-4">
          <button
            onClick={() => auth.refreshSession()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Session
          </button>
          <button
            onClick={() => auth.signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
          <button
            onClick={loadDebugInfo}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Reload Debug Info
          </button>
        </div>
      </section>

      {/* Problems Detected */}
      <section className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-yellow-800">⚠️ Problems Detected</h2>
        <ul className="list-disc list-inside space-y-2">
          {!auth.user && (
            <li className="text-yellow-700">Not logged in</li>
          )}
          {auth.user && !auth.organization && (
            <li className="text-yellow-700">User has no organization context</li>
          )}
          {auth.user && auth.organization?.type === 'council' && !auth.department && (
            <li className="text-yellow-700">Council user has no department selected</li>
          )}
          {session && !testJWTClaims()?.app_metadata?.organization_id && (
            <li className="text-yellow-700">JWT missing organization claims (hook may not be enabled)</li>
          )}
        </ul>
      </section>
    </div>
  );
}