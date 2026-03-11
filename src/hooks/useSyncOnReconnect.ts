// src/hooks/useSyncOnReconnect.ts
// When internet reconnects, flush all pending localStorage items to Supabase
import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { syncQueueAddItem, syncQueueUpdateItem } from '../store/useSyncQueue';

const KEYS = ['projects', 'sessions', 'fixes'] as const;
const TABLE: Record<string, string> = {
  projects: 'projects',
  sessions: 'debug_sessions',
  fixes:    'fixes',
};

export const useSyncOnReconnect = () => {
  const isOnline = useOnlineStatus();
  const { user } = useAuthStore();
  const wasOffline = useRef(false);

  useEffect(() => {
    // Track when we go offline
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    // Only sync if we were previously offline
    if (!wasOffline.current || !user) return;
    wasOffline.current = false;

    // Flush all pending queues
    KEYS.forEach(async (key) => {
      const storageKey = `devtrace_pending_${key}`;
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const items: any[] = JSON.parse(raw);
        if (!items.length) return;

        for (const item of items) {
          const { _pending, ...data } = item;
          const qid = `reconnect_${key}_${item.id}`;
          const label =
            key === 'projects' ? `Sync project "${item.name}"` :
            key === 'sessions' ? `Sync session "${item.title}"` :
                                 `Sync fix "${item.title}"`;

          syncQueueAddItem({ id: qid, action: `create_${key === 'sessions' ? 'session' : key === 'fixes' ? 'fix' : 'project'}` as any, label, status: 'syncing' });

          const { error } = await supabase.from(TABLE[key]).upsert(data, { onConflict: 'id' });

          if (!error) {
            // Remove from localStorage
            const current = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
            const updated = current.filter((i: any) => i.id !== item.id);
            localStorage.setItem(storageKey, JSON.stringify(updated));
            syncQueueUpdateItem(qid, { status: 'done' });
          } else {
            syncQueueUpdateItem(qid, { status: 'error' });
          }
        }
      } catch (e) {
        console.error(`Reconnect sync failed for ${key}:`, e);
      }
    });
  }, [isOnline, user]);
};