import { useEffect, useState, useRef } from 'react';
import { Bell, Menu, Moon, Sun, Search, CloudOff, HardDrive, RefreshCw,
         Clock, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabaseClient';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSyncQueue } from '../../store/useSyncQueue';
import SyncStatusBar from './SyncStatusBar';

interface Props {
  title: string;
  onMenuClick: () => void;
}

const Topbar = ({ title, onMenuClick }: Props) => {
  const { user } = useAuthStore();
  const { isDark, toggleDark } = useThemeStore();
  const isOnline = useOnlineStatus();
  const { items, clearDone, removeItem } = useSyncQueue();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url, name').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        setDisplayName(data?.name ?? user.email?.split('@')[0] ?? 'User');
      });
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const email    = user?.email ?? '';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  // Queue state
  const pending  = items.filter(i => i.status === 'pending');
  const syncing  = items.filter(i => i.status === 'syncing');
  const done     = items.filter(i => i.status === 'done');
  const errored  = items.filter(i => i.status === 'error');
  const activeCount = pending.length + syncing.length + errored.length;

  // Badge colour
  const badgeColor =
    errored.length  > 0 ? 'bg-red-500' :
    syncing.length  > 0 ? 'bg-indigo-500' :
    pending.length  > 0 ? 'bg-orange-500' :
    done.length     > 0 ? 'bg-emerald-500' : '';

  // Auto-clear "done" items after 3s
  useEffect(() => {
    if (items.length > 0 && activeCount === 0 && errored.length === 0 && done.length > 0) {
      const t = setTimeout(() => clearDone(), 3000);
      return () => clearTimeout(t);
    }
  }, [items.length, activeCount, done.length, errored.length]);

  const statusLabel =
    syncing.length > 0 ? `Syncing ${syncing.length + pending.length} change${syncing.length + pending.length !== 1 ? 's' : ''}...` :
    pending.length > 0 ? `${pending.length} change${pending.length !== 1 ? 's' : ''} pending` :
    errored.length > 0 ? `${errored.length} action${errored.length !== 1 ? 's' : ''} failed` :
    done.length    > 0 ? 'All changes synced' : 'No pending changes';

  const statusColor =
    syncing.length > 0 ? 'text-indigo-600 dark:text-indigo-400' :
    pending.length > 0 ? 'text-orange-500 dark:text-orange-400' :
    errored.length > 0 ? 'text-red-500 dark:text-red-400' :
    done.length    > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                         'text-gray-400';

  return (
    <header className="h-16 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 sm:px-6 gap-2">

      <button onClick={onMenuClick}
        className="lg:hidden w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 transition flex-shrink-0">
        <Menu size={20} />
      </button>

      <h1 className="font-bold text-gray-900 dark:text-white text-base truncate flex-shrink-0">{title}</h1>
      <div className="flex-1" />

      {/* Offline pills */}
      {!isOnline && (
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
            <CloudOff size={10} /> Cloud AI unavailable
          </span>
          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
            <HardDrive size={10} /> Local data available
          </span>
          <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
            <RefreshCw size={10} /> Syncs on reconnect
          </span>
        </div>
      )}

      <SyncStatusBar />

      <div className="hidden sm:flex relative flex-shrink-0">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search..."
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-300 transition placeholder-gray-400 w-44" />
      </div>

      <button onClick={() => user && toggleDark(user.id)}
        className="flex-shrink-0 w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 transition">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Bell with queue dropdown */}
      <div ref={bellRef} className="relative flex-shrink-0">
        <button
          onClick={() => setBellOpen(o => !o)}
          className="relative w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 transition">
          <Bell size={18} />
          {/* Badge — only when there are items */}
          {items.length > 0 && badgeColor && (
            <span className={`absolute top-1.5 right-1.5 min-w-[8px] h-2 ${badgeColor} rounded-full ${activeCount > 0 ? 'animate-pulse' : ''}`} />
          )}
          {items.length === 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
          )}
        </button>

        {/* Dropdown */}
        {bellOpen && (
          <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Action Queue</p>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                )}
                <button onClick={() => setBellOpen(false)}
                  className="w-6 h-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400">
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Queue items */}
            {items.length === 0 ? (
              <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Bell size={18} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No pending changes</p>
                <p className="text-xs text-gray-300">Actions you take will appear here</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    {item.status === 'pending'  && <Clock        size={14} className="text-orange-400 flex-shrink-0" />}
                    {item.status === 'syncing'  && <Loader2      size={14} className="text-indigo-500 animate-spin flex-shrink-0" />}
                    {item.status === 'done'     && <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />}
                    {item.status === 'error'    && <AlertCircle  size={14} className="text-red-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">{item.label}</p>
                      <p className={`text-xs mt-0.5 ${
                        item.status === 'pending' ? 'text-orange-400' :
                        item.status === 'syncing' ? 'text-indigo-400' :
                        item.status === 'done'    ? 'text-emerald-500' : 'text-red-400'
                      }`}>
                        {item.status === 'pending' ? 'Queued — will sync when online' :
                         item.status === 'syncing' ? 'Syncing...' :
                         item.status === 'done'    ? 'Synced ✓' : 'Failed — retry when online'}
                      </p>
                    </div>
                    {(item.status === 'error' || item.status === 'done') && (
                      <button onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {done.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => { clearDone(); setBellOpen(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                  Clear completed
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700" alt={displayName} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none max-w-[120px] truncate">{displayName}</p>
          <p className="text-xs text-gray-400 leading-none mt-0.5 max-w-[120px] truncate">{email}</p>
        </div>
      </div>

    </header>
  );
};

export default Topbar;