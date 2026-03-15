import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import type { ProjectActivity } from '../../hooks/useProjectCollaboration';

interface Props {
  feed: ProjectActivity[];
  getActivityLabel: (event: ProjectActivity) => string;
  getActivityIcon: (eventType: ProjectActivity['event_type']) => string;
  isSharedView?: boolean;
}

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
};

const COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
  'bg-amber-500', 'bg-emerald-500', 'bg-blue-500',
];
const colorForUser = (userId: string) => {
  const hash = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

const ProjectActivityFeed = ({ feed, getActivityLabel, getActivityIcon, isSharedView = false }: Props) => {
  const navigate = useNavigate();

  if (feed.length === 0) return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={14} className="text-indigo-500" />
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Activity Feed</h3>
      </div>
      <div className="text-center py-8">
        <Activity size={20} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-400">No activity yet</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Actions on sessions will appear here</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-indigo-500" />
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Activity Feed</h3>
        </div>
        <span className="text-xs text-gray-400">{feed.length} events</span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {feed.map((event) => (
          <div
            key={event.id}
            onClick={() => {
              if (event.session_id && event.event_type !== 'session_deleted') {
                const path = isSharedView
                  ? `/shared/session/${event.session_id}`
                  : `/sessions/${event.session_id}`;
                navigate(path);
              }
            }}
            className={`flex items-start gap-3 p-3 rounded-xl transition ${
              event.session_id && event.event_type !== 'session_deleted'
                ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                : ''
            }`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${colorForUser(event.user_id)}`}>
              {event.avatar_url
                ? <img src={event.avatar_url} className="w-full h-full rounded-full object-cover" alt={event.display_name} />
                : (event.display_name?.[0] ?? '?').toUpperCase()
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{getActivityIcon(event.event_type)}</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {getActivityLabel(event)}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(event.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectActivityFeed;