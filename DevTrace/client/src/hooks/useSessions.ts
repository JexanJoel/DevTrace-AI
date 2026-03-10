// src/hooks/useSessions.ts — PowerSync version, fully offline-capable
import { useQuery } from '@powersync/react';
import { powerSync } from '../lib/powersync';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';

export type Status = 'open' | 'in_progress' | 'resolved';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface DebugSession {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  error_message?: string;
  stack_trace?: string;
  severity: Severity;
  status: Status;
  ai_fix?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  project?: { name: string; language?: string };
}

export interface CreateSessionInput {
  title: string;
  project_id?: string;
  error_message?: string;
  stack_trace?: string;
  severity?: Severity;
  status?: Status;
  notes?: string;
}

const useSessions = (projectId?: string) => {
  const { user } = useAuthStore();
  const uid = user?.id ?? '';

  const query = projectId
    ? 'SELECT * FROM debug_sessions WHERE user_id = ? AND project_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM debug_sessions WHERE user_id = ? ORDER BY created_at DESC';
  const params = projectId ? [uid, projectId] : [uid];

  const { data: sessions = [] } = useQuery<DebugSession>(query, params);

  // getSession reads from local SQLite — works offline
  const getSession = async (id: string): Promise<DebugSession | null> => {
    const results = await powerSync.getAll<any>(
      `SELECT ds.*, p.name as project_name, p.language as project_language
       FROM debug_sessions ds
       LEFT JOIN projects p ON ds.project_id = p.id
       WHERE ds.id = ? LIMIT 1`, [id]
    );
    if (!results.length) return null;
    const s = results[0];
    return {
      ...s,
      project: s.project_name ? { name: s.project_name, language: s.project_language } : undefined,
    } as DebugSession;
  };

  const createSession = async (data: CreateSessionInput) => {
    if (!user) return null;
    const id = uuidv4();
    const now = new Date().toISOString();
    // Write to Supabase — PowerSync queues it if offline
    const { data: result, error } = await supabase
      .from('debug_sessions')
      .insert({ id, user_id: user.id, status: 'open', severity: 'medium', created_at: now, updated_at: now, ...data })
      .select().single();
    if (error) { console.error(error); return null; }
    return result;
  };

  const updateSession = async (id: string, data: Partial<DebugSession>) => {
    const { error } = await supabase
      .from('debug_sessions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    return !error;
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('debug_sessions').delete().eq('id', id);
    return !error;
  };

  return { sessions, loading: false, getSession, createSession, updateSession, deleteSession };
};

export default useSessions;