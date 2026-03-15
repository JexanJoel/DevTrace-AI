import { Users, Wifi } from 'lucide-react';
import type { Collaborator } from '../../hooks/useCollaboration';

interface Props {
  collaborators: Collaborator[];
  currentUserId: string;
}

const getInitial = (name: string) =>
  (name ?? '?')[0].toUpperCase();

const COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
  'bg-amber-500', 'bg-emerald-500', 'bg-blue-500',
];

const CollaborationBanner = ({ collaborators, currentUserId }: Props) => {
  const others = collaborators.filter(c => c.user_id !== currentUserId);
  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-4 py-3">

      {/* Live dot */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
        </span>
        <Wifi size={13} className="text-indigo-500" />
      </div>

      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {others.slice(0, 4).map((c, i) => (
          <div
            key={c.user_id}
            title={c.display_name}
            className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${COLORS[i % COLORS.length]}`}
          >
            {c.avatar_url
              ? <img src={c.avatar_url} alt={c.display_name} className="w-full h-full rounded-full object-cover" />
              : getInitial(c.display_name)
            }
          </div>
        ))}
        {others.length > 4 && (
          <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
            +{others.length - 4}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 truncate">
          {others.length === 1
            ? `${others[0].display_name} is debugging with you`
            : `${others.map(c => c.display_name.split(' ')[0]).join(', ')} are debugging with you`
          }
        </p>
        <p className="text-xs text-indigo-500 dark:text-indigo-400">
          Checklist and chat sync live via PowerSync
        </p>
      </div>

      {/* Collab badge */}
      <div className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-xl flex-shrink-0">
        <Users size={11} />
        Live
      </div>
    </div>
  );
};

export default CollaborationBanner;