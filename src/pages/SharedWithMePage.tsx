import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, FolderOpen, Bug, Clock, ChevronRight, Loader2, Users } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import useShares from '../hooks/useShares';
import { useAuthStore } from '../store/authStore';

const SharedWithMePage = () => {
  const navigate = useNavigate();
  const { sharedWithMe, loading, refetchSharedWithMe } = useShares();
  const { loading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading) refetchSharedWithMe();
  }, [authLoading]);

  const projects = sharedWithMe.filter(s => s.resource_type === 'project');
  const sessions = sharedWithMe.filter(s => s.resource_type === 'session');

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <DashboardLayout title="Shared with Me">
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Share2 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Shared with Me</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Projects and sessions other DevTrace users have shared with you
              </p>
            </div>
          </div>

          {/* Counts */}
          {!loading && sharedWithMe.length > 0 && (
            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900">
                <FolderOpen size={14} className="text-blue-500" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950 px-3 py-2 rounded-xl border border-purple-100 dark:border-purple-900">
                <Bug size={14} className="text-purple-500" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-indigo-500" size={28} />
          </div>
        ) : sharedWithMe.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={26} className="text-gray-300" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">Nothing shared with you yet</p>
            <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto">
              When another DevTrace user shares a project or session with you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Shared Projects */}
            {projects.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                  <FolderOpen size={16} className="text-blue-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Shared Projects</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {projects.map(share => (
                    <div
                      key={share.id}
                      onClick={() => navigate(`/shared/project/${share.resource_id}`)}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition group"
                    >
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FolderOpen size={16} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 transition">
                          {share.resource_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">
                            Shared by <span className="font-medium text-gray-600 dark:text-gray-300">{share.owner_name}</span>
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {timeAgo(share.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-600">
                          Read only
                        </span>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Sessions */}
            {sessions.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                  <Bug size={16} className="text-purple-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Shared Sessions</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {sessions.map(share => (
                    <div
                      key={share.id}
                      onClick={() => navigate(`/shared/session/${share.resource_id}`)}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition group"
                    >
                      <div className="w-9 h-9 bg-purple-50 dark:bg-purple-950 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bug size={16} className="text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 transition">
                          {share.resource_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">
                            Shared by <span className="font-medium text-gray-600 dark:text-gray-300">{share.owner_name}</span>
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {timeAgo(share.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-600">
                          Read only
                        </span>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SharedWithMePage;