import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, Clock, ChevronRight, Loader2, Eye, FolderOpen } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { StatusBadge, SeverityBadge } from '../components/sessions/StatusBadge';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import type { Project } from '../hooks/useProjects';
import type { DebugSession } from '../hooks/useSessions';

const SharedProjectView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [sharedBy, setSharedBy] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return;
      setLoading(true);

      // Verify share exists for this user
      const { data: share } = await supabase
        .from('shares')
        .select('owner_id, created_at')
        .eq('resource_type', 'project')
        .eq('resource_id', id)
        .eq('invitee_id', user.id)
        .single();

      if (!share) { setNotFound(true); setLoading(false); return; }

      // Fetch owner name
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', share.owner_id)
        .single();
      setSharedBy(ownerProfile?.name || ownerProfile?.email || 'Someone');

      // Fetch project (RLS now allows this via the new policy)
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      if (!proj) { setNotFound(true); setLoading(false); return; }
      setProject(proj);

      // Fetch sessions inside this project
      const { data: sess } = await supabase
        .from('debug_sessions')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      setSessions((sess ?? []).map((s: any) => ({
        ...s,
        ai_analysis: s.ai_analysis
          ? (typeof s.ai_analysis === 'string' ? JSON.parse(s.ai_analysis) : s.ai_analysis)
          : null,
      })));

      setLoading(false);
    };
    load();
  }, [id, user?.id]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) return (
    <DashboardLayout title="Shared Project">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={28} />
      </div>
    </DashboardLayout>
  );

  if (notFound) return (
    <DashboardLayout title="Shared Project">
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 mb-4">This project isn't shared with you or no longer exists.</p>
        <button onClick={() => navigate('/shared')} className="text-indigo-600 font-medium text-sm">
          Back to Shared with Me
        </button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={project?.name ?? 'Shared Project'}>
      <div className="space-y-5">

        {/* Back */}
        <button onClick={() => navigate('/shared')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
          <ArrowLeft size={14} /> Shared with Me
        </button>

        {/* Read-only banner */}
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
          <Eye size={15} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Read only</strong> · Shared by <span className="font-semibold">{sharedBy}</span>
          </p>
        </div>

        {/* Project header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center flex-shrink-0">
              <FolderOpen size={18} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white break-words">{project?.name}</h2>
              {project?.description && (
                <p className="text-sm text-gray-400 mt-1">{project.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={11} /> Created {project?.created_at ? new Date(project.created_at).toLocaleDateString() : ''}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Sessions',  value: sessions.length,                                         color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-950' },
              { label: 'Open',      value: sessions.filter(s => s.status === 'open').length,         color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-950' },
              { label: 'Resolved',  value: sessions.filter(s => s.status === 'resolved').length,     color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <Bug size={15} className="text-indigo-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Debug Sessions ({sessions.length})</h3>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Bug size={18} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No sessions in this project yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {sessions.map(session => (
                <div key={session.id}
                  onClick={() => navigate(`/shared/session/${session.id}`)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition group">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    session.status === 'open' ? 'bg-red-500' :
                    session.status === 'in_progress' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 transition">
                      {session.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <SeverityBadge severity={session.severity} />
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(session.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={session.status} />
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default SharedProjectView;