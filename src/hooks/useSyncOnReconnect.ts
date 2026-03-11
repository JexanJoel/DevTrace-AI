// src/hooks/useSyncOnReconnect.ts
// Flushes all pending localStorage items to Supabase when internet reconnects
import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { syncQueueAddItem, syncQueueUpdateItem } from '../store/useSyncQueue';

// ── CREATE queues ─────────────────────────────────────────────────────────────
const CREATE_KEYS = [
  { key: 'projects', table: 'projects',      labelField: 'name',  action: 'create_project' },
  { key: 'sessions', table: 'debug_sessions', labelField: 'title', action: 'create_session' },
  { key: 'fixes',    table: 'fixes',          labelField: 'title', action: 'save_fix'       },
] as const;

// ── UPDATE/DELETE queues ──────────────────────────────────────────────────────
const UPDATE_KEYS = [
  { key: 'devtrace_pending_project_updates', table: 'projects',       action_update: 'rename_project', action_delete: 'delete_project', labelField: 'name' },
  { key: 'devtrace_pending_session_updates', table: 'debug_sessions', action_update: 'update_session', action_delete: 'delete_session', labelField: 'title' },
  { key: 'devtrace_pending_fix_updates',     table: 'fixes',          action_update: 'save_fix',       action_delete: 'delete_fix',     labelField: 'title' },
] as const;

export const useSyncOnReconnect = () => {
  const isOnline = useOnlineStatus();
  const { user } = useAuthStore();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) { wasOffline.current = true; return; }
    if (!wasOffline.current || !user) return;
    wasOffline.current = false;

    // ── Flush CREATE queues ──────────────────────────────────────────────────
    CREATE_KEYS.forEach(async ({ key, table, labelField, action }) => {
      const storageKey = `devtrace_pending_${key}`;
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const items: any[] = JSON.parse(raw);
        if (!items.length) return;

        for (const item of items) {
          const { _pending, ...data } = item;
          const qid = `reconnect_create_${key}_${item.id}`;
          const label = `Sync ${key.slice(0, -1)} "${item[labelField] ?? item.id}"`;
          syncQueueAddItem({ id: qid, action: action as any, label, status: 'syncing' });

          const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
          if (!error) {
            const current: any[] = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
            localStorage.setItem(storageKey, JSON.stringify(current.filter(i => i.id !== item.id)));
            syncQueueUpdateItem(qid, { status: 'done' });
          } else {
            syncQueueUpdateItem(qid, { status: 'error' });
          }
        }
      } catch (e) { console.error(`Reconnect create sync failed for ${key}:`, e); }
    });

    // ── Flush UPDATE/DELETE queues ───────────────────────────────────────────
    UPDATE_KEYS.forEach(async ({ key, table, action_update, action_delete, labelField }) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const items: Array<{ id: string; type: 'update' | 'delete'; data?: any }> = JSON.parse(raw);
        if (!items.length) return;

        const remaining: typeof items = [];

        for (const item of items) {
          const qid = `reconnect_${item.type}_${table}_${item.id}_${Date.now()}`;
          const label = item.type === 'delete'
            ? `Delete ${table.replace('debug_', '')} (queued)`
            : `Update ${table.replace('debug_', '')} "${item.data?.[labelField] ?? item.id}"`;

          syncQueueAddItem({ id: qid, action: (item.type === 'delete' ? action_delete : action_update) as any, label, status: 'syncing' });

          let error: any = null;
          if (item.type === 'delete') {
            ({ error } = await supabase.from(table).delete().eq('id', item.id));
          } else {
            ({ error } = await supabase.from(table).update(item.data).eq('id', item.id));
          }

          if (!error) {
            syncQueueUpdateItem(qid, { status: 'done' });
          } else {
            remaining.push(item); // keep for next reconnect
            syncQueueUpdateItem(qid, { status: 'error' });
          }
        }

        localStorage.setItem(key, JSON.stringify(remaining));
      } catch (e) { console.error(`Reconnect update sync failed for ${key}:`, e); }
    });

  }, [isOnline, user]);
};