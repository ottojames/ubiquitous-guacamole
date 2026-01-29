import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { NOTICE_CATEGORY_TREE } from '@/next/publish/config/noticeTypes';
import { FileText, Plus, Filter, X, Trash2, AlertTriangle } from 'lucide-react';

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
  template_data?: Record<string, unknown>;
}

interface TemplateFormData {
  name: string;
  description: string;
  notice_type: string;
  is_shared: boolean;
  template_data: string;
}

const initialFormData: TemplateFormData = {
  name: '',
  description: '',
  notice_type: '',
  is_shared: true,
  template_data: '{}',
};

export default function FirmTemplates() {
  const { firm, userRole } = useOutletContext<FirmContext>();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData(initialFormData);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      notice_type: template.notice_type,
      is_shared: template.is_shared,
      template_data: JSON.stringify(template.template_data || {}, null, 2),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTemplate(null);
    setFormData(initialFormData);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('Template name is required');
      return;
    }
    if (!formData.notice_type) {
      setFormError('Notice type is required');
      return;
    }

    let templateData: Record<string, unknown>;
    try {
      templateData = JSON.parse(formData.template_data);
    } catch {
      setFormError('Template data must be valid JSON');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const body = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        notice_type: formData.notice_type,
        is_shared: formData.is_shared,
        template_data: templateData,
      };

      const url = editingTemplate
        ? `/api/firm/templates/${editingTemplate.id}`
        : '/api/firm/templates';
      const method = editingTemplate ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        closeModal();
        loadTemplates();
      } else {
        const data = await response.json();
        setFormError(data.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setFormError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirmation = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTemplateToDelete(null);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/firm/templates/${templateToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        closeDeleteModal();
        closeModal();
        loadTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setDeleting(false);
    }
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
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
          >
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
                onClick={() => openEditModal(template)}
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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Standard Premises Licence"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Brief description of this template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notice Type *
                </label>
                <select
                  value={formData.notice_type}
                  onChange={(e) => setFormData({ ...formData, notice_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select notice type</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Data (JSON)
                </label>
                <textarea
                  value={formData.template_data}
                  onChange={(e) => setFormData({ ...formData, template_data: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
                  placeholder='{"applicant": "", "address": ""}'
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_shared"
                  checked={formData.is_shared}
                  onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="is_shared" className="text-sm text-gray-700">
                  Share with team members
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                {editingTemplate && (
                  <>
                    <button
                      onClick={() => openDeleteConfirmation(editingTemplate)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <span className="text-sm text-gray-500">
                      Used {editingTemplate.usage_count} times
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && templateToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Template</h2>
              </div>
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete <strong>{templateToDelete.name}</strong>?
              </p>
              {templateToDelete.usage_count > 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  This template has been used {templateToDelete.usage_count} time{templateToDelete.usage_count !== 1 ? 's' : ''}. Deleting it won't affect previously created notices.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
