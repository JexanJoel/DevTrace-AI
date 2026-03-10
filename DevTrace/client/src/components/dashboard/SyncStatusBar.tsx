// src/components/dashboard/SyncStatusBar.tsx
import { useEffect, useState } from 'react';
import { powerSync } from '../../lib/powersync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

type SyncState = 'connected' | 'syncing' | 'synced' | 'offline' | 'connecting';

const SyncStatusBar = () => {
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const status = powerSync.currentStatus;
      if (!status) { setSyncState('connecting'); return; }

      if (!status.connected) {
        setSyncState('offline');
        setIsOffline(true);
        return;
      }

      setIsOffline(false);

      if (status.dataFlowStatus?.uploading || status.dataFlowStatus?.downloading) {
        setSyncState('syncing');
      } else if (status.lastSyncedAt) {
        setSyncState('synced');
        setLastSynced(new Date(status.lastSyncedAt));
      } else {
        setSyncState('connected');
      }
    };

    updateStatus();
    const unsub = powerSync.registerListener({ statusChanged: updateStatus });
    return () => unsub?.();
  }, []);

  const formatLastSynced = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isOffline) {
    return (
      <div className="w-full bg-orange-500 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2">
        <WifiOff size={13} />
        You're offline — changes are saved locally and will sync when reconnected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      {syncState === 'syncing' && (
        <><RefreshCw size={11} className="text-indigo-500 animate-spin" /><span className="text-indigo-600 dark:text-indigo-400">Syncing...</span></>
      )}
      {syncState === 'synced' && (
        <><CheckCircle2 size={11} className="text-green-500" /><span className="text-green-600 dark:text-green-400">Synced</span>{lastSynced && <span className="text-gray-400 flex items-center gap-0.5 ml-0.5"><Clock size={9} />{formatLastSynced(lastSynced)}</span>}</>
      )}
      {syncState === 'connected' && (
        <><Wifi size={11} className="text-green-500" /><span className="text-green-600 dark:text-green-400">Connected</span></>
      )}
      {syncState === 'connecting' && (
        <><RefreshCw size={11} className="text-gray-400 animate-spin" /><span className="text-gray-400">Connecting...</span></>
      )}
      {syncState === 'offline' && (
        <><WifiOff size={11} className="text-orange-500" /><span className="text-orange-600 dark:text-orange-400">Offline</span></>
      )}
    </div>
  );
};

export default SyncStatusBar;