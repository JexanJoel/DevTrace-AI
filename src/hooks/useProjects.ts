import { useQuery } from '@powersync/react';
import { powerSync } from '../lib/powersync';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { usePendingQueue } from './usePendingQueue';
import { syncQueueAddItem, syncQueueUpdateItem } from '../store/useSyncQueue';
import { v4 as uuidv4 } from 'uuid';
import { useOnlineStatus } from './useOnlineStatus';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  language?: string;
  github_url?: string;
  error_count: number;
  session_count: number;
  created_at: string;
  updated_at: string;
  _pending?: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  language?: string;
  github_url?: string;
}

// Pending updates/deletes queue key
const UPDATES_KEY = 'devtrace_pending_project_updates';

const getPendingUpdates = (): Array<{ id: string; type: 'update' | 'delete'; data?: Partial<Project> }> => {
  try { return JSON.parse(localStorage.getItem(UPDATES_KEY) ?? '[]'); } catch { return []; }
};
const setPendingUpdates = (items: any[]) => localStorage.setItem(UPDATES_KEY, JSON.stringify(items));

const useProjects = () => {
  const { user } = useAuthStore();
  const uid = user?.id ?? '';
  const { pending, addPending, removePending } = usePendingQueue<Project>('projects');
  const isOnline = useOnlineStatus();

  const { data: syncedProjects = [] } = useQuery<Project>(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', [uid]
  );

  const syncedIds = new Set(syncedProjects.map(p => p.id));
  const pendingOnly = pending.filter(p => !syncedIds.has(p.id));

  const projects = [
    ...pendingOnly,
    ...syncedProjects,
  ].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
   .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const getProject = async (id: string): Promise<Project | null> => {
    const p = pending.find(p => p.id === id);
    if (p) return p;
    const results = await powerSync.getAll<Project>('SELECT * FROM projects WHERE id = ? LIMIT 1', [id]);
    return results[0] ?? null;
  };

  const createProject = async (data: CreateProjectInput) => {
    if (!user) return null;
    const id = uuidv4();
    const qid = `create_project_${id}`;
    const now = new Date().toISOString();
    const row: Project = {
      id, user_id: user.id, error_count: 0, session_count: 0,
      created_at: now, updated_at: now, _pending: true, ...data,
    };

    addPending(row);
    syncQueueAddItem({ id: qid, action: 'create_project', label: `Create project "${data.name}"`, status: 'pending' });
    await new Promise(r => setTimeout(r, 80));
    syncQueueUpdateItem(qid, { status: 'syncing' });

    const { error } = await supabase.from('projects').insert({
      id, user_id: user.id, error_count: 0, session_count: 0,
      created_at: now, updated_at: now, ...data,
    });

    if (!error) {
      removePending(id);
      syncQueueUpdateItem(qid, { status: 'done' });
    } else {
      syncQueueUpdateItem(qid, { status: isOnline ? 'error' : 'pending' });
    }
    return row;
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    const qid = `update_project_${id}_${Date.now()}`;
    const label = data.name ? `Rename project to "${data.name}"` : 'Update project';

    // Optimistically update local pending list if present
    const inPending = pending.find(p => p.id === id);
    if (inPending) {
      addPending({ ...inPending, ...data, updated_at: new Date().toISOString() });
    }

    syncQueueAddItem({ id: qid, action: 'rename_project', label, status: 'pending' });
    await new Promise(r => setTimeout(r, 80));
    syncQueueUpdateItem(qid, { status: 'syncing' });

    const { error } = await supabase.from('projects')
      .update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);

    if (!error) {
      syncQueueUpdateItem(qid, { status: 'done' });
      return true;
    }

    // Offline — queue for later
    if (!isOnline) {
      const updates = getPendingUpdates();
      updates.push({ id, type: 'update', data: { ...data, updated_at: new Date().toISOString() } });
      setPendingUpdates(updates);
      syncQueueUpdateItem(qid, { status: 'pending' });
      return true; // optimistic success
    }

    syncQueueUpdateItem(qid, { status: 'error' });
    return false;
  };

  const deleteProject = async (id: string) => {
    const qid = `delete_project_${id}`;
    const project = projects.find(p => p.id === id);
    const label = `Delete project "${project?.name ?? id}"`;

    syncQueueAddItem({ id: qid, action: 'delete_project', label, status: 'pending' });
    await new Promise(r => setTimeout(r, 80));
    syncQueueUpdateItem(qid, { status: 'syncing' });

    removePending(id);
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (!error) {
      syncQueueUpdateItem(qid, { status: 'done' });
      return true;
    }

    // Offline — queue for later
    if (!isOnline) {
      const updates = getPendingUpdates();
      updates.push({ id, type: 'delete' });
      setPendingUpdates(updates);
      syncQueueUpdateItem(qid, { status: 'pending' });
      return true;
    }

    syncQueueUpdateItem(qid, { status: 'error' });
    return false;
  };

  return { projects, loading: false, getProject, createProject, updateProject, deleteProject };
};

export default useProjects;