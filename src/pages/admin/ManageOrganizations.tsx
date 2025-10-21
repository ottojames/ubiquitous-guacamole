import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'council' | 'law_firm';
  email: string | null;
  created_at: string;
  _count?: {
    departments: number;
    members: number;
  };
}

export default function ManageOrganizations() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'council' | 'law_firm'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<'council' | 'law_firm'>('council');
  const [newOrgEmail, setNewOrgEmail] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchQuery, typeFilter]);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load counts for each organization
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org) => {
          const [deptsResult, membersResult] = await Promise.all([
            supabase.from('departments').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
            supabase.from('organization_memberships').select('id', { count: 'exact', head: true }).eq('organization_id', org.id)
          ]);

          return {
            ...org,
            _count: {
              departments: deptsResult.count || 0,
              members: membersResult.count || 0
            }
          };
        })
      );

      setOrganizations(orgsWithCounts);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = [...organizations];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(org => org.type === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(query) ||
        org.slug.toLowerCase().includes(query) ||
        org.email?.toLowerCase().includes(query)
      );
    }

    setFilteredOrgs(filtered);
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOrgName) {
      alert('Organization name is required');
      return;
    }

    try {
      setCreating(true);

      // Generate slug from name
      const slug = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);

      const { error } = await supabase.from('organizations').insert({
        name: newOrgName,
        slug: slug,
        type: newOrgType,
        email: newOrgEmail || null,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      alert('Organization created successfully!');

      // Reset form
      setNewOrgName('');
      setNewOrgEmail('');
      setNewOrgType('council');
      setShowCreateModal(false);
      setCreating(false);

      // Reload organizations
      loadOrganizations();
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      alert(`Failed to create organization: ${err.message}`);
      setCreating(false);
    }
  };

  const handleDeleteOrganization = async (org: Organization) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone and will delete all associated departments, users, and data.`)) {
      return;
    }

    try {
      // Note: This requires CASCADE delete setup in the database
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id);

      if (error) throw error;

      alert('Organization deleted successfully');
      loadOrganizations();
    } catch (err: any) {
      console.error('Failed to delete organization:', err);
      alert(`Failed to delete organization: ${err.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-2">Manage councils and law firms on the platform</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
        >
          Create Organization
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, slug, or email..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type Filter</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Organizations</option>
              <option value="council">Councils Only</option>
              <option value="law_firm">Law Firms Only</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredOrgs.length} of {organizations.length} organizations
        </div>
      </div>

      {/* Organizations List */}
      {filteredOrgs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-600 mb-2">No organizations found</p>
          <p className="text-sm text-gray-500">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrgs.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{org.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        org.type === 'council'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {org.type === 'council' ? 'Council' : 'Law Firm'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Slug:</span> {org.slug}
                  </p>
                  {org.email && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Email:</span> {org.email}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Created:</span> {formatDate(org.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteOrganization(org)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition-colors font-semibold text-sm"
                >
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600 border-t pt-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <span>{org._count?.departments || 0} departments</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>{org._count?.members || 0} members</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Organization</h2>

            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                  placeholder="e.g., Westminster City Council"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organization Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newOrgType}
                  onChange={(e) => setNewOrgType(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="council">Council</option>
                  <option value="law_firm">Law Firm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={newOrgEmail}
                  onChange={(e) => setNewOrgEmail(e.target.value)}
                  placeholder="contact@organization.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
