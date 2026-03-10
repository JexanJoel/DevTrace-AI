// src/hooks/useProjects.ts — PowerSync version, fully offline-capable
import { useQuery } from '@powersync/react';
import { powerSync } from '../lib/powersync';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';

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
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  language?: string;
  github_url?: string;
}

const useProjects = () => {
  const { user } = useAuthStore();
  const uid = user?.id ?? '';

  const { data: projects = [] } = useQuery<Project>(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', [uid]
  );

  // getProject reads from local SQLite — works offline
  const getProject = async (id: string): Promise<Project | null> => {
    const results = await powerSync.getAll<Project>(
      'SELECT * FROM projects WHERE id = ? LIMIT 1', [id]
    );
    return results[0] ?? null;
  };

  const createProject = async (data: CreateProjectInput) => {
    if (!user) return null;
    const id = uuidv4();
    const now = new Date().toISOString();
    const { data: result, error } = await supabase
      .from('projects')
      .insert({ id, user_id: user.id, error_count: 0, session_count: 0, created_at: now, updated_at: now, ...data })
      .select().single();
    if (error) { console.error(error); return null; }
    return result;
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    const { error } = await supabase.from('projects')
      .update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    return !error;
  };

  return { projects, loading: false, getProject, createProject, updateProject, deleteProject };
};

export default useProjects;