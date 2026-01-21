import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { NOTICE_CATEGORY_TREE } from '@/next/publish/config/noticeTypes';
import { FileText, Plus, Filter } from 'lucide-react';

interface FirmContext {
  firm: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  notice_type: string;
  usage_count: number;
  is_shared: boolean;
  created_at: string;
}

export default function FirmTemplates() {
  const { firm, userRole } = useOutletContext<FirmContext>();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, [firm.id, filterType]);

  const loadTemplates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = filterType
        ? `/api/firm/templates?notice_type=${encodeURIComponent(filterType)}`
        : '/api/firm/templates';

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading templates:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notice Templates</h1>
          <p className="text-gray-600 mt-1">Save and reuse notice templates for faster publishing</p>
        </div>
        {['admin', 'owner'].includes(userRole) && (
          <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Template
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Notice Types</option>
            {NOTICE_CATEGORY_TREE.map((category) => (
              <optgroup key={category.id} label={category.label}>
                {category.groups.flatMap((group) =>
                  group.variants.map((variant) => (
                    <option key={variant.id} value={variant.definition.noticeType}>
                      {variant.label}
                    </option>
                  ))
                )}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Templates ({templates.length})
          </h2>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No templates found</p>
            <p className="text-sm text-gray-400 mt-1">
              Create a template to save time on future notices
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {template.notice_type}
                      </span>
                      {template.is_shared && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Shared
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Used {template.usage_count} times</p>
                    <p className="mt-1">{formatDate(template.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
