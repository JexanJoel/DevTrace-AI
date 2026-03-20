// src/components/shared/SyncStatusBar.tsx
import { useEffect, useState } from 'react';
import { powerSync } from '../../lib/powersync';
import { WifiOff, RefreshCw, CheckCircle2, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

type SyncState = 'connecting' | 'syncing' | 'synced' | 'offline';

const SyncStatusBar = () => {
  const isOnline = useOnlineStatus();
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => {
      const status = powerSync.currentStatus;

      if (!isOnline || !status?.connected) {
        setSyncState('offline');
        return;
      }

      const isActive = status.dataFlowStatus?.uploading || status.dataFlowStatus?.downloading;

      if (status.lastSyncedAt) {
        // ── FIX: once we have a lastSyncedAt, always show synced/syncing
        // correctly. Don't get stuck showing 'syncing' forever just because
        // a background download is in progress after the first full sync.
        setLastSynced(new Date(status.lastSyncedAt));
        setSyncState(isActive ? 'syncing' : 'synced');
      } else if (isActive) {
        // Initial sync — no lastSyncedAt yet, data is flowing
        setSyncState('syncing');
      } else {
        // Connected but nothing has synced yet
        setSyncState('connecting');
      }
    };

    update();
    const unsub = powerSync.registerListener({ statusChanged: update });
    return () => unsub?.();
  }, [isOnline]); // re-run when online status changes too

  // Refresh the "Xs ago" label every 15s without re-subscribing to PowerSync
  useEffect(() => {
    if (syncState !== 'synced') return;
    const t = setInterval(() => {
      setSyncState(s => s); // force re-render to update formatTime
    }, 15_000);
    return () => clearInterval(t);
  }, [syncState]);

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  const configs = {
    offline:    { icon: <WifiOff    size={10} />,                            label: 'Offline',     cls: 'bg-orange-50 dark:bg-orange-950 text-orange-600 border-orange-200 dark:border-orange-800' },
    connecting: { icon: <RefreshCw  size={10} className="animate-spin" />,   label: 'Connecting',  cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700' },
    syncing:    { icon: <RefreshCw  size={10} className="animate-spin" />,   label: 'Syncing...',  cls: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-indigo-200 dark:border-indigo-800' },
    synced:     { icon: <CheckCircle2 size={10} />,                          label: lastSynced ? `Synced ${formatTime(lastSynced)}` : 'Synced', cls: 'bg-green-50 dark:bg-green-950 text-green-600 border-green-200 dark:border-green-800' },
  };

  const key = !isOnline ? 'offline' : syncState;
  const { icon, label, cls } = configs[key];

  return (
    <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all duration-300 ${cls}`}>
      {icon}
      <span>{label}</span>
      {key === 'synced' && <Wifi size={9} className="ml-0.5 opacity-60" />}
    </div>
  );
};

export default SyncStatusBar;