// src/store/useSyncQueue.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export type QueueAction =
  | 'create_project' | 'rename_project' | 'delete_project'
  | 'create_session' | 'update_session' | 'delete_session'
  | 'save_fix' | 'delete_fix';

export interface QueueItem {
  id: string;
  action: QueueAction;
  label: string;
  status: 'pending' | 'syncing' | 'done' | 'error';
  createdAt: number;
}

interface SyncQueueState {
  items: QueueItem[];
  addItem: (item: Omit<QueueItem, 'createdAt'>) => void;
  updateItem: (id: string, updates: Partial<QueueItem>) => void;
  removeItem: (id: string) => void;
  clearDone: () => void;
  loadFromDB: (userId: string) => Promise<void>;
}

// ── DB persistence helpers ────────────────────────────────────────────────────
const persistToDB = async (item: QueueItem, userId: string) => {
  try {
    await supabase.from('action_queue').upsert({
      id: item.id,
      user_id: userId,
      action: item.action,
      label: item.label,
      status: item.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch {}
};

const updateInDB = async (id: string, status: string) => {
  try {
    await supabase
      .from('action_queue')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {}
};

const deleteFromDB = async (id: string) => {
  try { await supabase.from('action_queue').delete().eq('id', id); } catch {}
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const useSyncQueue = create<SyncQueueState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const full: QueueItem = { ...item, createdAt: Date.now() };
    set((state) => ({ items: [full, ...state.items] }));
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) persistToDB(full, data.user.id);
    });
  },

  updateItem: (id, updates) => {
    set((state) => ({
      items: state.items.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
    if (updates.status) updateInDB(id, updates.status);
  },

  removeItem: (id) => {
    set((state) => ({ items: state.items.filter(i => i.id !== id) }));
    deleteFromDB(id);
  },

  clearDone: () => {
    const done = get().items.filter(i => i.status === 'done').map(i => i.id);
    set((state) => ({ items: state.items.filter(i => i.status !== 'done') }));
    done.forEach(deleteFromDB);
  },

  loadFromDB: async (userId: string) => {
    try {
      const { data } = await supabase
        .from('action_queue')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!data?.length) return;

      // ── FIX: 'syncing' and 'pending' items from a previous session can
      // never resolve — the callbacks that would call syncQueueUpdateItem
      // are gone. Treat them as 'error' so the user can see and dismiss them.
      const STALE_STATUSES = new Set(['syncing', 'pending']);
      const staleIds: string[] = [];

      const items: QueueItem[] = data.map(row => {
        const isStale = STALE_STATUSES.has(row.status);
        if (isStale) staleIds.push(row.id);
        return {
          id: row.id,
          action: row.action as QueueAction,
          label: row.label,
          status: isStale ? 'error' : (row.status as QueueItem['status']),
          createdAt: new Date(row.created_at ?? row.updated_at).getTime(),
        };
      });

      set({ items });

      // Reflect the corrected status in DB so next reload is clean too
      await Promise.all(staleIds.map(id => updateInDB(id, 'error')));
    } catch {}
  },
}));

// ── Module-level helpers (safe outside React) ─────────────────────────────────
export const syncQueueAddItem = (item: Omit<QueueItem, 'createdAt'>) =>
  useSyncQueue.getState().addItem(item);

export const syncQueueUpdateItem = (id: string, updates: Partial<QueueItem>) =>
  useSyncQueue.getState().updateItem(id, updates);