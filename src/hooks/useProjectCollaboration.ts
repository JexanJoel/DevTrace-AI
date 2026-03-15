import { useEffect, useCallback } from 'react';
import { useQuery } from '@powersync/react';
import { powerSync } from '../lib/powersync';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  last_seen_at: string;
  joined_at: string;
}

export type ActivityEventType =
  | 'session_created'
  | 'session_resolved'
  | 'session_analyzed'
  | 'session_updated'
  | 'session_deleted';

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  event_type: ActivityEventType;
  session_id: string;
  session_title: string;
  metadata: string; // JSON string
  created_at: string;
}

export interface ProjectChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  message: string;
  created_at: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

const getUserMeta = (user: any) => {
  const meta = user?.user_metadata ?? {};
  const displayName: string = meta?.full_name ?? meta?.name ?? user?.email ?? 'Anonymous';
  const avatarUrl: string = meta?.avatar_url ?? '';
  return { displayName, avatarUrl };
};

// ── Hook ──────────────────────────────────────────────────────────────────────

const useProjectCollaboration = (projectId: string) => {
  const { user } = useAuthStore();

  // ── Live queries from local SQLite ────────────────────────────────────────

  const { data: rawCollaborators = [] } = useQuery<ProjectCollaborator>(
    `SELECT * FROM project_presence WHERE project_id = ? ORDER BY joined_at ASC`,
    [projectId]
  );

  const { data: activityFeed = [] } = useQuery<ProjectActivity>(
    `SELECT * FROM project_activity WHERE project_id = ? ORDER BY created_at DESC LIMIT 50`,
    [projectId]
  );

  const { data: chatMessages = [] } = useQuery<ProjectChatMessage>(
    `SELECT * FROM project_chat WHERE project_id = ? ORDER BY created_at ASC`,
    [projectId]
  );

  // Active = seen in last 2 minutes
  const activeCollaborators = rawCollaborators.filter(c => {
    return Date.now() - new Date(c.last_seen_at).getTime() < 2 * 60 * 1000;
  });

  const otherCollaborators = activeCollaborators.filter(c => c.user_id !== user?.id);
  const isCollaborative = otherCollaborators.length > 0;

  // ── Presence heartbeat ────────────────────────────────────────────────────

  const upsertPresence = useCallback(async () => {
    if (!user || !projectId) return;
    const { displayName, avatarUrl } = getUserMeta(user);
    const now = new Date().toISOString();

    const existing = await powerSync.getAll<{ id: string }>(
      `SELECT id FROM project_presence WHERE project_id = ? AND user_id = ? LIMIT 1`,
      [projectId, user.id]
    );

    if (existing.length > 0) {
      await powerSync.execute(
        `UPDATE project_presence SET last_seen_at = ?, display_name = ?, avatar_url = ? WHERE project_id = ? AND user_id = ?`,
        [now, displayName, avatarUrl, projectId, user.id]
      );
    } else {
      await powerSync.execute(
        `INSERT INTO project_presence (id, project_id, user_id, display_name, avatar_url, last_seen_at, joined_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), projectId, user.id, displayName, avatarUrl, now, now]
      );
    }
  }, [user, projectId]);

  const removePresence = useCallback(async () => {
    if (!user || !projectId) return;
    await powerSync.execute(
      `DELETE FROM project_presence WHERE project_id = ? AND user_id = ?`,
      [projectId, user.id]
    );
  }, [user, projectId]);

  useEffect(() => {
    if (!user || !projectId) return;
    upsertPresence();
    const interval = setInterval(upsertPresence, 30_000);
    return () => {
      clearInterval(interval);
      removePresence();
    };
  }, [user?.id, projectId]);

  // ── Activity logging ──────────────────────────────────────────────────────

  const logActivity = useCallback(async (
    eventType: ActivityEventType,
    sessionId: string,
    sessionTitle: string,
    metadata?: Record<string, any>
  ) => {
    if (!user || !projectId) return;
    const { displayName, avatarUrl } = getUserMeta(user);

    await powerSync.execute(
      `INSERT INTO project_activity (id, project_id, user_id, display_name, avatar_url, event_type, session_id, session_title, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), projectId, user.id, displayName, avatarUrl,
        eventType, sessionId, sessionTitle,
        metadata ? JSON.stringify(metadata) : null,
        new Date().toISOString(),
      ]
    );
  }, [user, projectId]);

  // ── Chat ──────────────────────────────────────────────────────────────────

  const sendMessage = async (message: string) => {
    if (!user || !message.trim()) return;
    const { displayName, avatarUrl } = getUserMeta(user);

    await powerSync.execute(
      `INSERT INTO project_chat (id, project_id, user_id, display_name, avatar_url, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), projectId, user.id, displayName, avatarUrl, message.trim(), new Date().toISOString()]
    );
  };

  // ── Activity helpers ──────────────────────────────────────────────────────

  const getActivityLabel = (event: ProjectActivity): string => {
    const name = event.display_name || 'Someone';
    switch (event.event_type) {
      case 'session_created':   return `${name} created "${event.session_title}"`;
      case 'session_resolved':  return `${name} resolved "${event.session_title}"`;
      case 'session_analyzed':  return `${name} ran AI analysis on "${event.session_title}"`;
      case 'session_updated':   return `${name} updated "${event.session_title}"`;
      case 'session_deleted':   return `${name} deleted a session`;
      default:                  return `${name} did something`;
    }
  };

  const getActivityIcon = (eventType: ActivityEventType): string => {
    switch (eventType) {
      case 'session_created':   return '🐛';
      case 'session_resolved':  return '✅';
      case 'session_analyzed':  return '⚡';
      case 'session_updated':   return '✏️';
      case 'session_deleted':   return '🗑️';
      default:                  return '📝';
    }
  };

  return {
    // Presence
    activeCollaborators,
    otherCollaborators,
    isCollaborative,

    // Activity feed
    activityFeed,
    logActivity,
    getActivityLabel,
    getActivityIcon,

    // Chat
    chatMessages,
    sendMessage,

    currentUserName: getUserMeta(user).displayName || 'You',
    currentUserId: user?.id ?? '',
  };
};

export default useProjectCollaboration;