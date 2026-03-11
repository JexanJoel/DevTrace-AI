// src/hooks/useDashboardStats.ts — reads from PowerSync SQLite + pending queue
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@powersync/react';
import { usePendingQueue } from './usePendingQueue';
import type { DebugSession } from './useSessions';
import type { Project } from './useProjects';

export interface DashboardStats {
  totalProjects: number;
  totalSessions: number;
  totalErrors: number;
  resolvedCount: number;
  resolvedPercent: number;
  recentSessions: DebugSession[];
  recentProjects: { id: string; name: string; language: string | null; updated_at: string; session_count: number; error_count: number }[];
}

const useDashboardStats = () => {
  const { user } = useAuthStore();
  const uid = user?.id ?? '';

  // Pending queues (offline-created items not yet in PowerSync)
  const { pending: pendingProjects } = usePendingQueue<Project>('projects');
  const { pending: pendingSessions } = usePendingQueue<DebugSession>('sessions');

  const { data: syncedProjects = [] } = useQuery(
    'SELECT id FROM projects WHERE user_id = ?', [uid]
  );
  const { data: syncedSessions = [] } = useQuery(
    'SELECT id, status, error_message FROM debug_sessions WHERE user_id = ?', [uid]
  );
  const { data: recentSessionsRaw = [] } = useQuery(
    `SELECT ds.*, p.name as project_name, p.language as project_language
     FROM debug_sessions ds
     LEFT JOIN projects p ON ds.project_id = p.id
     WHERE ds.user_id = ?
     ORDER BY ds.created_at DESC LIMIT 5`, [uid]
  );
  const { data: recentProjectsRaw = [] } = useQuery(
    `SELECT id, name, language, updated_at, session_count, error_count
     FROM projects WHERE user_id = ?
     ORDER BY updated_at DESC LIMIT 3`, [uid]
  );

  // Merge synced + pending, deduplicate by id
  const syncedProjectIds = new Set(syncedProjects.map((p: any) => p.id));
  const syncedSessionIds = new Set(syncedSessions.map((s: any) => s.id));

  const allProjects = [
    ...pendingProjects.filter(p => !syncedProjectIds.has(p.id)),
    ...syncedProjects,
  ];
  const allSessions = [
    ...pendingSessions.filter(s => !syncedSessionIds.has(s.id)),
    ...syncedSessions,
  ];

  const totalProjects  = allProjects.length;
  const totalSessions  = allSessions.length;
  const resolvedCount  = allSessions.filter((s: any) => s.status === 'resolved').length;
  const totalErrors    = allSessions.filter((s: any) => s.error_message).length;
  const resolvedPercent = totalSessions > 0 ? Math.round((resolvedCount / totalSessions) * 100) : 0;

  // Recent sessions — prefer synced data, fall back to pending for brand new items
  const recentSessionIds = new Set(recentSessionsRaw.map((s: any) => s.id));
  const pendingRecentSessions = pendingSessions
    .filter(s => !recentSessionIds.has(s.id))
    .slice(0, 5);

  const formattedSessions = [
    ...pendingRecentSessions,
    ...recentSessionsRaw.map((s: any) => ({
      ...s,
      project: s.project_name ? { name: s.project_name, language: s.project_language } : undefined,
    })),
  ].slice(0, 5);

  // Recent projects — same merge
  const recentProjectIds = new Set(recentProjectsRaw.map((p: any) => p.id));
  const pendingRecentProjects = pendingProjects
    .filter(p => !recentProjectIds.has(p.id))
    .slice(0, 3);

  const recentProjects = [
    ...pendingRecentProjects,
    ...recentProjectsRaw,
  ].slice(0, 3);

  const stats: DashboardStats = {
    totalProjects,
    totalSessions,
    totalErrors,
    resolvedCount,
    resolvedPercent,
    recentSessions: formattedSessions as DebugSession[],
    recentProjects: recentProjects as any[],
  };

  return { stats, loading: false, fetchStats: () => {} };
};

export default useDashboardStats;