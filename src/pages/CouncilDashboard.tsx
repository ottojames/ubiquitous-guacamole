import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface Notice {
  id: number;
  notice_type: string;
  status: string;
  applicant_name: string;
  premises_address_json: any;
  reps_deadline: string | null;
  published_at: string | null;
  created_at: string;
  representation_count: number;
}

interface Representation {
  id: number;
  notice_id: number;
  respondent_name: string;
  respondent_email: string;
  respondent_type: string;
  representation_type: string;
  comments: string;
  status: string;
  created_at: string;
  notice: {
    id: number;
    applicant_name: string;
    notice_type: string;
  };
}

interface Stats {
  totalNotices: number;
  publishedNotices: number;
  totalRepresentations: number;
  newRepresentations: number;
}

export default function CouncilDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalNotices: 0,
    publishedNotices: 0,
    totalRepresentations: 0,
    newRepresentations: 0
  });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load stats
      const [noticesRes, pubNoticesRes, repsRes, newRepsRes] = await Promise.all([
        supabase.from('notices').select('id', { count: 'exact', head: true }),
        supabase.from('notices').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('representations').select('id', { count: 'exact', head: true }),
        supabase.from('representations').select('id', { count: 'exact', head: true }).eq('status', 'new')
      ]);

      setStats({
        totalNotices: noticesRes.count || 0,
        publishedNotices: pubNoticesRes.count || 0,
        totalRepresentations: repsRes.count || 0,
        newRepresentations: newRepsRes.count || 0
      });

      // Load published notices with representation counts
      const { data: noticesData, error: noticesError } = await supabase
        .from('notices')
        .select(`
          id,
          notice_type,
          status,
          applicant_name,
          premises_address_json,
          reps_deadline,
          published_at,
          created_at
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10);

      if (noticesError) throw noticesError;

      // For each notice, count representations
      const noticesWithCounts = await Promise.all(
        (noticesData || []).map(async (notice) => {
          const { count } = await supabase
            .from('representations')
            .select('id', { count: 'exact', head: true })
            .eq('notice_id', notice.id);

          return {
            ...notice,
            representation_count: count || 0
          };
        })
      );

      setNotices(noticesWithCounts);

      // Load recent representations
      const { data: repsData, error: repsError } = await supabase
        .from('representations')
        .select(`
          id,
          notice_id,
          respondent_name,
          respondent_email,
          respondent_type,
          representation_type,
          comments,
          status,
          created_at,
          notice:notices!inner(id, applicant_name, notice_type)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (repsError) throw repsError;

      setRepresentations(repsData as any || []);
    } catch (error: any) {
      console.error('Error loading dashboard:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAsReviewed(repId: number) {
    const { error } = await supabase
      .from('representations')
      .update({ status: 'reviewed', reviewed_at: new Date().toISOString() })
      .eq('id', repId);

    if (error) {
      console.error('Error updating representation:', error);
    } else {
      loadDashboardData(); // Refresh data
    }
  }

  const filteredRepresentations = selectedNoticeId
    ? representations.filter(r => r.notice_id === selectedNoticeId)
    : representations;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-lg text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Council Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">Manage published notices and view public representations</p>
            </div>
            <Link
              to="/publish"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              Publish New Notice
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-lg">
            <p className="text-sm font-medium text-slate-600">Total Notices</p>
            <p className="mt-2 text-4xl font-bold text-slate-900">{stats.totalNotices}</p>
          </div>
          <div className="rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
            <p className="text-sm font-medium text-blue-700">Published</p>
            <p className="mt-2 text-4xl font-bold text-blue-900">{stats.publishedNotices}</p>
          </div>
          <div className="rounded-3xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-white p-6 shadow-lg">
            <p className="text-sm font-medium text-purple-700">All Representations</p>
            <p className="mt-2 text-4xl font-bold text-purple-900">{stats.totalRepresentations}</p>
          </div>
          <div className="rounded-3xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg">
            <p className="text-sm font-medium text-orange-700">New / Unreviewed</p>
            <p className="mt-2 text-4xl font-bold text-orange-900">{stats.newRepresentations}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Published Notices */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Published Notices</h2>
            <div className="space-y-4">
              {notices.length === 0 ? (
                <p className="text-sm text-slate-500">No published notices yet.</p>
              ) : (
                notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="cursor-pointer rounded-2xl border border-slate-200 p-4 transition-all hover:border-blue-300 hover:shadow-md"
                    onClick={() => setSelectedNoticeId(notice.id === selectedNoticeId ? null : notice.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{notice.applicant_name}</h3>
                        <p className="text-sm text-slate-600">{notice.notice_type}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {notice.premises_address_json?.line1}, {notice.premises_address_json?.postcode}
                        </p>
                        {notice.reps_deadline && (
                          <p className="mt-1 text-xs text-slate-500">
                            Deadline: {new Date(notice.reps_deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            notice.representation_count > 0
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {notice.representation_count} {notice.representation_count === 1 ? 'Response' : 'Responses'}
                        </span>
                        {selectedNoticeId === notice.id && (
                          <span className="text-xs font-semibold text-blue-600">← Filtering</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Representations */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedNoticeId ? 'Filtered Representations' : 'Recent Representations'}
              </h2>
              {selectedNoticeId && (
                <button
                  onClick={() => setSelectedNoticeId(null)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="space-y-4">
              {filteredRepresentations.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {selectedNoticeId ? 'No representations for this notice.' : 'No representations yet.'}
                </p>
              ) : (
                filteredRepresentations.map((rep) => (
                  <div key={rep.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{rep.respondent_name}</p>
                        <p className="text-xs text-slate-500">{rep.respondent_email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            rep.representation_type === 'objection'
                              ? 'bg-red-100 text-red-700'
                              : rep.representation_type === 'support'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {rep.representation_type}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {rep.respondent_type}
                        </span>
                      </div>
                    </div>
                    <p className="mb-2 text-sm text-slate-700">{rep.comments}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Re: {rep.notice?.applicant_name} ({rep.notice?.notice_type})
                      </p>
                      {rep.status === 'new' && (
                        <button
                          onClick={() => markAsReviewed(rep.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {rep.status === 'reviewed' && (
                        <span className="text-xs font-semibold text-green-600">✓ Reviewed</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
