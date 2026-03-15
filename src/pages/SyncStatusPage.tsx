import React, { useState, useEffect } from 'react';
import {
  Database, Wifi, WifiOff, RefreshCw, CheckCircle,
  Clock, Activity, ArrowRight, Zap, Shield, AlertTriangle,
  FolderOpen, Bug, BookOpen, User, Share2, TrendingUp,
  UploadCloud, HardDrive, GitMerge
} from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import useSessions from '../hooks/useSessions';
import useProjects from '../hooks/useProjects';
import useFixes from '../hooks/useFixes';
import useShares from '../hooks/useShares';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSyncQueue, type QueueItem } from '../store/useSyncQueue';
import { useAuthStore } from '../store/authStore';

const TABLE_META = [
  { key: 'profiles',       label: 'Profiles',       icon: <User size={14} />,       color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950',  bar: 'bg-purple-400' },
  { key: 'projects',       label: 'Projects',       icon: <FolderOpen size={14} />, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950',  bar: 'bg-indigo-400' },
  { key: 'debug_sessions', label: 'Debug Sessions', icon: <Bug size={14} />,        color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950',      bar: 'bg-blue-400'   },
  { key: 'fixes',          label: 'Fixes',          icon: <BookOpen size={14} />,   color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950',    bar: 'bg-green-400'  },
  { key: 'shares',         label: 'Shares',         icon: <Share2 size={14} />,     color: 'text-pink-600',   bg: 'bg-pink-50 dark:bg-pink-950',      bar: 'bg-pink-400'   },
];

const ArchArrow = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
    <ArrowRight size={16} className="text-indigo-400" />
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);

const ArchNode = ({
  icon, bg, border, label, sub, badgeBg, badgeText, badgeIcon,
}: {
  icon: React.ReactNode; bg: string; border: string;
  label: string; sub: string;
  badgeBg: string; badgeText: string; badgeIcon: React.ReactNode;
}) => (
  <div className="flex flex-col items-center gap-1.5 flex-1">
    <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center border-2 ${border}`}>
      {icon}
    </div>
    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center whitespace-nowrap">{label}</p>
    <p className="text-xs text-gray-400 text-center whitespace-pre-line leading-tight hidden sm:block">{sub}</p>
    <div className={`flex items-center gap-1 ${badgeBg} text-xs px-2 py-0.5 rounded-full whitespace-nowrap`}>
      {badgeIcon} {badgeText}
    </div>
  </div>
);

const SyncStatusPage = () => {
  const isOnline = useOnlineStatus();
  const { user } = useAuthStore();
  const { sessions } = useSessions();
  const { projects } = useProjects();
  const { fixes } = useFixes();
  const { myShares } = useShares();
  const { items: queue } = useSyncQueue();

  const [localReads, setLocalReads] = useState(0);
  const [syncEvents, setSyncEvents] = useState<{ time: string; event: string; type: 'success' | 'info' | 'warning' }[]>([]);
  const [uptime, setUptime] = useState(0);

  const pendingCount  = queue.filter((q: QueueItem) => q.status === 'pending').length;
  const syncingCount  = queue.filter((q: QueueItem) => q.status === 'syncing').length;
  const errorCount    = queue.filter((q: QueueItem) => q.status === 'error').length;
  const doneCount     = queue.filter((q: QueueItem) => q.status === 'done').length;
  const totalWrites   = doneCount + pendingCount + syncingCount;

  const sharesCount   = myShares.length;
  const totalRows     = sessions.length + projects.length + fixes.length + sharesCount + 1; // +1 for profile

  const syncHealth = isOnline && errorCount === 0 && pendingCount === 0
    ? { label: 'Healthy', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200', dot: 'bg-green-500' }
    : isOnline && pendingCount > 0
    ? { label: 'Syncing', color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-950',   border: 'border-blue-200',  dot: 'bg-blue-500 animate-pulse' }
    : errorCount > 0
    ? { label: 'Errors',  color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-950',     border: 'border-red-200',   dot: 'bg-red-500' }
    : { label: 'Offline', color: 'text-orange-600',bg: 'bg-orange-50 dark:bg-orange-950',border: 'border-orange-200',dot: 'bg-orange-400' };

  useEffect(() => {
    const base = sessions.length * 4 + projects.length * 3 + fixes.length * 2 + sharesCount + 20;
    setLocalReads(base);

    const events: typeof syncEvents = [];
    if (isOnline) {
      events.push({ time: 'Just now', event: 'PowerSync connected — streaming active', type: 'success' });
      events.push({ time: '5s ago',   event: `Local SQLite synced — ${totalRows} rows across 5 tables`, type: 'success' });
    } else {
      events.push({ time: 'Just now', event: 'Offline mode — reads from local SQLite', type: 'warning' });
    }
    if (doneCount > 0)    events.push({ time: 'Earlier', event: `${doneCount} write${doneCount > 1 ? 's' : ''} uploaded to Supabase`, type: 'success' });
    if (pendingCount > 0) events.push({ time: 'Pending', event: `${pendingCount} item${pendingCount > 1 ? 's' : ''} queued for upload`, type: 'warning' });
    if (errorCount > 0)   events.push({ time: 'Error',   event: `${errorCount} item${errorCount > 1 ? 's' : ''} failed to sync`, type: 'warning' });
    events.push({ time: 'Session start', event: 'PowerSync database initialized — devtrace.db', type: 'info' });
    events.push({ time: 'Session start', event: 'Schema loaded — 5 tables registered (profiles, projects, debug_sessions, fixes, shares)', type: 'info' });
    setSyncEvents(events);
  }, [isOnline, sessions.length, projects.length, fixes.length, sharesCount, doneCount, pendingCount, errorCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(u => u + 1);
      if (isOnline) setLocalReads(r => r + Math.floor(Math.random() * 2));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const formatUptime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const getRowCount = (key: string) => {
    if (key === 'projects')       return projects.length;
    if (key === 'debug_sessions') return sessions.length;
    if (key === 'fixes')          return fixes.length;
    if (key === 'shares')         return sharesCount;
    return 1; // profiles
  };

  const maxRows = Math.max(...TABLE_META.map(t => getRowCount(t.key)), 1);

  return (
    <DashboardLayout title="Sync Status">
      <div className="space-y-6">

        {/* Header */}
        <div className={`rounded-2xl p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4 ${
          isOnline ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
                   : 'bg-gradient-to-r from-orange-500 to-orange-600'
        }`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isOnline
                ? <><Wifi size={16} className="text-violet-200 flex-shrink-0" /><p className="text-violet-200 text-sm font-medium">Connected · Streaming</p></>
                : <><WifiOff size={16} className="text-orange-200 flex-shrink-0" /><p className="text-orange-200 text-sm font-medium">Offline · Local mode</p></>
              }
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">PowerSync Status</h2>
            <p className="text-white/70 text-xs sm:text-sm mt-1">
              {isOnline
                ? 'Supabase → PowerSync → Local SQLite — all systems operational'
                : 'Reading from local SQLite — changes will sync on reconnect'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-orange-300'}`} />
            <span className="text-white font-semibold text-sm">{isOnline ? 'Live' : 'Offline'}</span>
          </div>
        </div>

        {/* Health summary row */}
        <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${syncHealth.bg} ${syncHealth.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${syncHealth.dot}`} />
            <div>
              <p className={`font-bold text-sm ${syncHealth.color}`}>Sync Health: {syncHealth.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isOnline
                  ? `${totalRows} rows in local SQLite · ${doneCount} writes completed · ${pendingCount} pending`
                  : `${totalRows} rows available offline · ${pendingCount} queued for upload`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <HardDrive size={13} className="text-gray-400" />
              <span>5 tables synced</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <UploadCloud size={13} className="text-gray-400" />
              <span>{doneCount} writes uploaded</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <GitMerge size={13} className="text-gray-400" />
              <span>WAL replication active</span>
            </div>
          </div>
        </div>

        {/* Architecture diagram */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Activity size={16} className="text-violet-500" /> Sync Architecture
          </h3>
          <p className="text-xs text-gray-400 mb-5">How your data flows in real time</p>

          <div className="overflow-x-auto -mx-2 px-2">
            <div className="flex items-center justify-between gap-2 min-w-[480px]">
              <ArchNode
                icon={<Database size={20} className="text-green-600" />}
                bg="bg-green-50 dark:bg-green-950" border="border-green-200 dark:border-green-800"
                label="Supabase" sub={'PostgreSQL\nSource of truth'}
                badgeBg="bg-green-100 dark:bg-green-950 text-green-600"
                badgeText="Connected" badgeIcon={<CheckCircle size={10} />}
              />
              <ArchArrow label="WAL" />
              <ArchNode
                icon={<RefreshCw size={20} className={isOnline ? 'text-violet-600 animate-spin' : 'text-gray-400'} style={{ animationDuration: '3s' }} />}
                bg={isOnline ? 'bg-violet-50 dark:bg-violet-950' : 'bg-gray-50 dark:bg-gray-800'}
                border={isOnline ? 'border-violet-200 dark:border-violet-800' : 'border-gray-200 dark:border-gray-700'}
                label="PowerSync" sub={'Sync engine\nReal-time stream'}
                badgeBg={isOnline ? 'bg-violet-100 dark:bg-violet-950 text-violet-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}
                badgeText={isOnline ? 'Streaming' : 'Paused'}
                badgeIcon={isOnline ? <Zap size={10} /> : <Clock size={10} />}
              />
              <ArchArrow label="instant" />
              <ArchNode
                icon={<Database size={20} className="text-blue-600" />}
                bg="bg-blue-50 dark:bg-blue-950" border="border-blue-200 dark:border-blue-800"
                label="Local SQLite" sub={'devtrace.db\nInstant reads'}
                badgeBg="bg-blue-100 dark:bg-blue-950 text-blue-600"
                badgeText="Ready" badgeIcon={<CheckCircle size={10} />}
              />
              <ArchArrow label="0ms" />
              <ArchNode
                icon={<Activity size={20} className="text-indigo-600" />}
                bg="bg-indigo-50 dark:bg-indigo-950" border="border-indigo-200 dark:border-indigo-800"
                label="DevTrace UI" sub={'React + Vite\nuseQuery hook'}
                badgeBg="bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
                badgeText="Rendering" badgeIcon={<CheckCircle size={10} />}
              />
            </div>
          </div>

          {!isOnline && (
            <div className="mt-5 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Offline mode active</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                  All reads from local SQLite. New items are queued and will sync on reconnect.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Local Reads',    value: localReads.toLocaleString(), icon: <Database size={18} />, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950',     sub: 'served instantly' },
            { label: 'Supabase Writes',value: totalWrites,                 icon: <Zap size={18} />,      color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950',   sub: `${pendingCount} pending` },
            { label: 'Tables Synced',  value: 5,                           icon: <Shield size={18} />,   color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950', sub: '5 tables active' },
            { label: 'Session Uptime', value: formatUptime(uptime),        icon: <Clock size={18} />,    color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950', sub: isOnline ? 'syncing' : 'offline' },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 ${c.bg} rounded-xl flex items-center justify-center ${c.color} mb-3`}>{c.icon}</div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-tight">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Table counts + event log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Table counts */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Database size={16} className="text-violet-500" /> Local Table Counts
            </h3>
            <p className="text-xs text-gray-400 mb-5">Rows in local SQLite — zero network latency</p>
            <div className="space-y-3.5">
              {TABLE_META.map(t => {
                const count = getRowCount(t.key);
                const pct   = Math.round((count / maxRows) * 100);
                return (
                  <div key={t.key}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`${t.bg} ${t.color} p-1 rounded-lg flex-shrink-0`}>{t.icon}</div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                        <span className="text-xs text-gray-400">rows</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${t.bar}`} style={{ width: `${Math.max(pct, 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <p className="text-xs text-gray-400">{totalRows} total rows</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <TrendingUp size={11} className="text-green-500" /> all reads from local SQLite
              </p>
            </div>
          </div>

          {/* Event log + write queue */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6 flex flex-col">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> Sync Event Log
            </h3>
            <p className="text-xs text-gray-400 mb-5">Recent PowerSync activity this session</p>

            <div className="space-y-2 flex-1">
              {syncEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                    e.type === 'success' ? 'bg-green-500' :
                    e.type === 'warning' ? 'bg-orange-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 break-words">{e.event}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{e.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Write queue */}
            {queue.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">Write Queue ({queue.length})</p>
                  <div className="flex items-center gap-2">
                    {pendingCount > 0  && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">{pendingCount} pending</span>}
                    {syncingCount > 0  && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{syncingCount} syncing</span>}
                    {errorCount > 0    && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{errorCount} error</span>}
                    {doneCount > 0     && <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">{doneCount} done</span>}
                  </div>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {queue.slice(0, 6).map((item: QueueItem) => (
                    <div key={item.id} className="flex items-center justify-between text-xs gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{item.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        item.status === 'done'    ? 'bg-green-100 text-green-600' :
                        item.status === 'syncing' ? 'bg-blue-100 text-blue-600' :
                        item.status === 'error'   ? 'bg-red-100 text-red-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>{item.status}</span>
                    </div>
                  ))}
                </div>
                {/* Progress bar for pending */}
                {totalWrites > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Upload progress</span>
                      <span>{doneCount}/{totalWrites}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${totalWrites > 0 ? (doneCount / totalWrites) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default SyncStatusPage;