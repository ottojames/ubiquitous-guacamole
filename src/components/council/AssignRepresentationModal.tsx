import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  department_id: string;
  role: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface AssignRepresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  representationId: string;
  departmentId: string;
  currentAssignee?: string | null;
  onAssigned: (assigneeId: string, assigneeName: string) => void;
}

export default function AssignRepresentationModal({
  isOpen,
  onClose,
  representationId,
  departmentId,
  currentAssignee,
  onAssigned
}: AssignRepresentationModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTeamMembers();
    }
  }, [isOpen, departmentId]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('department_memberships')
        .select(`
          id,
          user_id,
          department_id,
          role,
          user:users (
            id,
            email,
            full_name
          )
        `)
        .eq('department_id', departmentId)
        .eq('status', 'active');

      if (error) throw error;
      setTeamMembers(data || []);

      // Pre-select current assignee if exists
      if (currentAssignee && data) {
        const current = data.find(m => m.user_id === currentAssignee);
        if (current) {
          setSelectedMember(current.user_id);
        }
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMember) return;

    try {
      setAssigning(true);

      // Update representation with assigned officer
      const { error: updateError } = await supabase
        .from('representations')
        .update({
          assigned_to: selectedMember,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', representationId);

      if (updateError) throw updateError;

      // Get assignee details
      const assignee = teamMembers.find(m => m.user_id === selectedMember);
      const assigneeName = assignee?.user.full_name || assignee?.user.email || 'Unknown';

      // Create notification for assigned officer
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedMember,
          type: 'representation_assigned',
          title: 'New Representation Assigned',
          message: `You have been assigned a new representation to review.`,
          data: {
            representation_id: representationId,
            department_id: departmentId
          }
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      // Send email notification (simplified - in production would use email service)
      if (assignee?.user.email) {
        console.log(`Email notification would be sent to ${assignee.user.email}`);
      }

      onAssigned(selectedMember, assigneeName);
      onClose();
    } catch (error) {
      console.error('Failed to assign representation:', error);
      alert('Failed to assign representation. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Assign Representation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to team member
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a team member</option>
                  {teamMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.user.full_name || member.user.email} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              {currentAssignee && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Currently assigned to:{' '}
                    <span className="font-medium">
                      {teamMembers.find(m => m.user_id === currentAssignee)?.user.full_name ||
                       teamMembers.find(m => m.user_id === currentAssignee)?.user.email ||
                       'Unknown'}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAssign}
                  disabled={!selectedMember || assigning}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={onClose}
                  disabled={assigning}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}