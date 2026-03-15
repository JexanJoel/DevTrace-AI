import { PowerSyncDatabase } from '@powersync/web';
import { WASQLiteOpenFactory } from '@powersync/web';
import { column, Schema, Table } from '@powersync/web';

const profiles = new Table({
  name: column.text,
  email: column.text,
  github_username: column.text,
  avatar_url: column.text,
  onboarded: column.integer,
  dark_mode: column.integer,
  created_at: column.text,
});

const projects = new Table({
  user_id: column.text,
  name: column.text,
  description: column.text,
  language: column.text,
  github_url: column.text,
  error_count: column.integer,
  session_count: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const debug_sessions = new Table({
  user_id: column.text,
  project_id: column.text,
  title: column.text,
  error_message: column.text,
  stack_trace: column.text,
  code_snippet: column.text,
  expected_behavior: column.text,
  environment: column.text,
  severity: column.text,
  status: column.text,
  ai_fix: column.text,
  ai_analysis: column.text,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const fixes = new Table({
  user_id: column.text,
  session_id: column.text,
  project_id: column.text,
  title: column.text,
  error_pattern: column.text,
  fix_content: column.text,
  language: column.text,
  tags: column.text,
  use_count: column.integer,
  created_at: column.text,
});

// ── Session collaboration tables ──────────────────────────────────────────────

const session_presence = new Table({
  session_id: column.text,
  user_id: column.text,
  display_name: column.text,
  avatar_url: column.text,
  last_seen_at: column.text,
  joined_at: column.text,
});

const session_checklist = new Table({
  session_id: column.text,
  item_index: column.integer,
  checked: column.integer,
  checked_by: column.text,
  checked_by_name: column.text,
  checked_at: column.text,
});

const session_chat = new Table({
  session_id: column.text,
  user_id: column.text,
  display_name: column.text,
  avatar_url: column.text,
  message: column.text,
  created_at: column.text,
});

// ── Project collaboration tables ──────────────────────────────────────────────

// Who is currently viewing a project
const project_presence = new Table({
  project_id: column.text,
  user_id: column.text,
  display_name: column.text,
  avatar_url: column.text,
  last_seen_at: column.text,
  joined_at: column.text,
});

// Activity feed — session created/resolved/analyzed events
const project_activity = new Table({
  project_id: column.text,
  user_id: column.text,
  display_name: column.text,
  avatar_url: column.text,
  event_type: column.text,
  session_id: column.text,
  session_title: column.text,
  metadata: column.text,  // JSON string
  created_at: column.text,
});

// Project-level team chat
const project_chat = new Table({
  project_id: column.text,
  user_id: column.text,
  display_name: column.text,
  avatar_url: column.text,
  message: column.text,
  created_at: column.text,
});

export const AppSchema = new Schema({
  profiles,
  projects,
  debug_sessions,
  fixes,
  session_presence,
  session_checklist,
  session_chat,
  project_presence,
  project_activity,
  project_chat,
});

export type Database = (typeof AppSchema)['types'];

export const powerSync = new PowerSyncDatabase({
  schema: AppSchema,
  database: new WASQLiteOpenFactory({
    dbFilename: 'devtrace.db',
    flags: {
      disableSSRWarning: true,
    },
  }),
});