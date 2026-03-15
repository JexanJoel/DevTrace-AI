<div align="center">

<img src="https://img.shields.io/badge/🛠️-Technical_Documentation-4f46e5?style=for-the-badge&labelColor=1e1b4b&color=4f46e5" height="36"/>

## DevTrace AI Technical Manual
**Architecture, Contribution, and Zero-Backend Deep Dive.**

---

</div>

## 📌 Introduction

First off, thank you for considering contributing to DevTrace AI! This project is built for the **PowerSync AI Hackathon 2026** and pushes the boundaries of Local-First AI applications.

This document provides a comprehensive guide to our architecture, setup, and developer workflows.

---

## 🏗️ Zero-Backend Architecture

DevTrace AI is a **Zero-Backend** application. This means we do not maintain a traditional Node.js/Express server. Instead, we leverage the power of the **PowerSync + Supabase** stack.

### 🧩 The Three Layers

1.  **Storage & Auth (Supabase)**: Postgres is our source of truth. Row Level Security (RLS) handles all authorization logic directly at the database level.
2.  **Sync & Persistence (PowerSync)**: Acts as the "glue" between Postgres and the client. It replicates data via WAL and manages a local SQLite database in the browser for instant, offline-capable interactions.
3.  **Logic & AI (Supabase Edge Functions)**: All complex, high-privilege operations (like calling Groq AI or calculating Debug DNA) happen in serverless Deno Edge Functions.

### 🔄 Data Flow Lifecycle

> [!TIP]
> **Write Path**: `Client UI` -> `powerSync.execute()` -> `Local SQLite` -> `Sync Queue` -> `Supabase Postgres`.
> 
> **Read Path**: `Local SQLite` -> `useQuery()` -> `Client UI` (0ms latency, 100% offline).
> 
> **AI Path**: `Client UI` -> `Supabase Edge Function` (JWT Verified) -> `Groq API` -> `Direct Postgres Update` -> `WAL Sync` -> `Local SQLite`.

---

## 🛠️ Technical Setup

### Prerequisites
- **Node.js**: v18+
- **Supabase**: [Create a project](https://supabase.com) - free tier works
- **PowerSync**: [Create an account](https://powersync.com) - free tier works
- **Groq**: [Get an API Key](https://console.groq.com) - free

### Step 1: Clone and Install
```bash
git clone https://github.com/JexanJoel/DevTrace-AI.git
cd DevTrace-AI
npm install
```

### Step 2: Supabase setup

**2a.** Create a new project at [supabase.com](https://supabase.com)

**2b.** Go to **SQL Editor** and run the following schemas in order:

<details>
<summary>📋 <b>Click to expand - 1. Base Schema (profiles, projects, sessions, fixes, shares)</b></summary>

```sql
-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  github_username text,
  github_connected boolean default false,
  avatar_url text,
  onboarded boolean default false,
  dark_mode boolean default false,
  created_at timestamp with time zone default timezone('utc', now())
);

create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, new.raw_user_meta_data->>'email'))
  on conflict (id) do update set email = coalesce(excluded.email, new.raw_user_meta_data->>'email');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can look up other profiles" on profiles for select using (true);

-- Projects
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  description text,
  language text,
  github_url text,
  error_count int default 0,
  session_count int default 0,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

alter table projects enable row level security;
create policy "Users can view own projects"   on projects for select using (auth.uid() = user_id);
create policy "Users can create projects"     on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);
create policy "Shared project viewers can read" on projects for select using (
  exists (select 1 from shares where shares.resource_id = projects.id and shares.resource_type = 'project' and shares.invitee_id = auth.uid())
);

-- Debug Sessions
create table debug_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  project_id uuid references projects on delete cascade,
  title text not null,
  error_message text,
  stack_trace text,
  code_snippet text,
  expected_behavior text,
  environment text default 'development',
  severity text default 'medium',
  status text default 'open',
  ai_fix text,
  ai_analysis jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

alter table debug_sessions enable row level security;
create policy "Users can view own sessions"   on debug_sessions for select using (auth.uid() = user_id);
create policy "Users can create sessions"     on debug_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on debug_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on debug_sessions for delete using (auth.uid() = user_id);
create policy "Shared session viewers can read" on debug_sessions for select using (
  exists (select 1 from shares where shares.resource_id = debug_sessions.id and shares.resource_type = 'session' and shares.invitee_id = auth.uid())
);
create policy "Sessions in shared projects can read" on debug_sessions for select using (
  exists (select 1 from shares where shares.resource_id = debug_sessions.project_id and shares.resource_type = 'project' and shares.invitee_id = auth.uid())
);

-- Fixes
create table fixes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  session_id uuid references debug_sessions on delete set null,
  project_id uuid references projects on delete set null,
  title text not null,
  error_pattern text,
  fix_content text not null,
  language text,
  tags text[],
  use_count int default 0,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table fixes enable row level security;
create policy "Users can view own fixes"   on fixes for select using (auth.uid() = user_id);
create policy "Users can create fixes"     on fixes for insert with check (auth.uid() = user_id);
create policy "Users can update own fixes" on fixes for update using (auth.uid() = user_id);
create policy "Users can delete own fixes" on fixes for delete using (auth.uid() = user_id);

-- Shares
create table shares (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade,
  invitee_id uuid references auth.users on delete cascade,
  resource_type text not null check (resource_type in ('project', 'session')),
  resource_id uuid not null,
  created_at timestamptz default now(),
  unique(invitee_id, resource_type, resource_id)
);

alter table shares enable row level security;
create policy "Owners can manage shares"       on shares for all    using (owner_id = auth.uid());
create policy "Invitees can view their shares" on shares for select using (invitee_id = auth.uid());

-- updated_at triggers
create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = timezone('utc', now()); return new; end;
$$ language plpgsql;

create trigger projects_updated_at before update on projects for each row execute procedure update_updated_at();
create trigger sessions_updated_at before update on debug_sessions for each row execute procedure update_updated_at();

-- PowerSync WAL publication
create publication powersync for table profiles, projects, debug_sessions, fixes, shares;
```
</details>

<details>
<summary>👥 <b>Click to expand - 2. Session Collaboration Schema</b></summary>

```sql
-- Session presence
create table if not exists session_presence (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references debug_sessions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  avatar_url text,
  last_seen_at timestamp with time zone default now(),
  joined_at timestamp with time zone default now(),
  unique(session_id, user_id)
);

alter table session_presence enable row level security;
create policy "Session participants can view presence" on session_presence for select using (
  auth.uid() = user_id
  or exists (select 1 from shares where shares.resource_id = session_presence.session_id and shares.resource_type = 'session' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
  or exists (select 1 from debug_sessions where debug_sessions.id = session_presence.session_id and debug_sessions.user_id = auth.uid())
);
create policy "Users manage own presence" on session_presence for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Session checklist
create table if not exists session_checklist (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references debug_sessions on delete cascade not null,
  item_index integer not null,
  checked boolean default false,
  checked_by uuid references auth.users on delete set null,
  checked_by_name text,
  checked_at timestamp with time zone,
  unique(session_id, item_index)
);

alter table session_checklist enable row level security;
create policy "Session participants can view checklist" on session_checklist for select using (
  exists (select 1 from debug_sessions where debug_sessions.id = session_checklist.session_id and debug_sessions.user_id = auth.uid())
  or exists (select 1 from shares where shares.resource_id = session_checklist.session_id and shares.resource_type = 'session' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
);
create policy "Session participants can update checklist" on session_checklist for all
  using (
    exists (select 1 from debug_sessions where debug_sessions.id = session_checklist.session_id and debug_sessions.user_id = auth.uid())
    or exists (select 1 from shares where shares.resource_id = session_checklist.session_id and shares.resource_type = 'session' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
  )
  with check (
    exists (select 1 from debug_sessions where debug_sessions.id = session_checklist.session_id and debug_sessions.user_id = auth.uid())
    or exists (select 1 from shares where shares.resource_id = session_checklist.session_id and shares.resource_type = 'session' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
  );

-- Session chat
create table if not exists session_chat (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references debug_sessions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  avatar_url text,
  message text not null,
  created_at timestamp with time zone default now()
);

alter table session_chat enable row level security;
create policy "Session participants can view chat" on session_chat for select using (
  exists (select 1 from debug_sessions where debug_sessions.id = session_chat.session_id and debug_sessions.user_id = auth.uid())
  or exists (select 1 from shares where shares.resource_id = session_chat.session_id and shares.resource_type = 'session' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
);
create policy "Session participants can send messages" on session_chat for insert with check (
  auth.uid() = user_id and (
    exists (select 1 from debug_sessions where debug_sessions.id = session_chat.session_id and debug_sessions.user_id = auth.uid())
    or exists (select 1 from shares where shares.resource_id = session_chat.session_id and shares.resource_type = 'session' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
  )
);

alter publication powersync add table session_presence;
alter publication powersync add table session_checklist;
alter publication powersync add table session_chat;
```
</details>

<details>
<summary>📋 <b>Click to expand - 3. Project Collaboration Schema</b></summary>

```sql
-- Project presence
create table if not exists project_presence (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  avatar_url text,
  last_seen_at timestamp with time zone default now(),
  joined_at timestamp with time zone default now(),
  unique(project_id, user_id)
);

alter table project_presence enable row level security;
create policy "Project participants can view presence" on project_presence for select using (
  auth.uid() = user_id
  or exists (select 1 from projects where projects.id = project_presence.project_id and projects.user_id = auth.uid())
  or exists (select 1 from shares where shares.resource_id = project_presence.project_id and shares.resource_type = 'project' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
);
create policy "Users manage own project presence" on project_presence for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Project activity feed
create table if not exists project_activity (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  avatar_url text,
  event_type text not null,
  session_id uuid references debug_sessions on delete cascade,
  session_title text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

alter table project_activity enable row level security;
create policy "Project participants can view activity" on project_activity for select using (
  exists (select 1 from projects where projects.id = project_activity.project_id and projects.user_id = auth.uid())
  or exists (select 1 from shares where shares.resource_id = project_activity.project_id and shares.resource_type = 'project' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
);
create policy "Project participants can log activity" on project_activity for insert with check (
  auth.uid() = user_id and (
    exists (select 1 from projects where projects.id = project_activity.project_id and projects.user_id = auth.uid())
    or exists (select 1 from shares where shares.resource_id = project_activity.project_id and shares.resource_type = 'project' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
  )
);

-- Project chat
create table if not exists project_chat (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  display_name text,
  avatar_url text,
  message text not null,
  created_at timestamp with time zone default now()
);

alter table project_chat enable row level security;
create policy "Project participants can view chat" on project_chat for select using (
  exists (select 1 from projects where projects.id = project_chat.project_id and projects.user_id = auth.uid())
  or exists (select 1 from shares where shares.resource_id = project_chat.project_id and shares.resource_type = 'project' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
);
create policy "Project participants can send messages" on project_chat for insert with check (
  auth.uid() = user_id and (
    exists (select 1 from projects where projects.id = project_chat.project_id and projects.user_id = auth.uid())
    or exists (select 1 from shares where shares.resource_id = project_chat.project_id and shares.resource_type = 'project' and (shares.owner_id = auth.uid() or shares.invitee_id = auth.uid()))
  )
);

alter publication powersync add table project_presence;
alter publication powersync add table project_activity;
alter publication powersync add table project_chat;
```
</details>

**2c.** Go to **Authentication -> URL Configuration** and set your site and redirect URLs.

**2d.** Go to **Authentication -> Providers** -> enable **GitHub** and **Google**.

**2e.** Go to **Storage** -> create a bucket called `avatars` -> set to **public**.

**2f.** Create Edge Function `debug-dna` from `supabase/functions/debug-dna/index.ts`.

**2g.** Create Edge Function `analyze-bug` from `supabase/functions/analyze-bug/index.ts`.

**2h.** Add secrets to Supabase: `GROQ_API_KEY` and `SERVICE_ROLE_KEY`.

---

### Step 3: PowerSync setup

**3a.** Create account at [powersync.com](https://www.powersync.com).

**3b.** Connect to your Supabase Postgres URI.

**3c.** Paste the full sync rules (5 bucket definitions — see `POWERSYNC_SYNC_RULES.json` in repo).

**3d.** Deploy and copy your PowerSync instance URL.

---

### Step 4: Environment variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_POWERSYNC_URL=https://your-instance.powersync.journeyapps.com
```

> No `VITE_GROQ_API_KEY` needed — all Groq calls are server-side via Edge Function.

---

### Step 5: Run

```bash
npm run dev
# -> http://localhost:5173
```

---

## 🏗️ Project Structure

```
src/
├── components/          # Dashboard, Sessions, Projects UI
├── hooks/              # PowerSync Mutations (useSessions, useCollaboration, etc.)
├── lib/                # Supabase/PowerSync Config, AI Client
├── pages/              # Main application views
└── providers/           # Context providers (PowerSync, Auth)

supabase/
└── functions/
    ├── analyze-bug/    # Server-side AI logic
    └── debug-dna/      # Server-side stats logic
```

---

## 🤝 Contribution Guidelines

### Branching Strategy
- `master`: Production-ready code.
- `feature/*`: New features.
- `fix/*`: Bug fixes.

### PR Process
1. Fork the repo and create your branch.
2. Ensure `npm run lint` passes.
3. Update documentation if you change setup steps.
4. Submit PR with detailed description.

---

## ❓ FAQ & Troubleshooting

> [!WARNING]
> **App stuck on "Syncing"?**
> Check your PowerSync connection URL and ensure your Supabase WAL publication includes all 11 tables.

**Q: Can I add another AI provider?**
A: Yes. Update the `analyze-bug` Edge Function to point to any OpenAI-compatible endpoint.

---

<div align="center">
  <br/>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge"/></a> &nbsp; <a href="CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/🤝-Code_of_Conduct-4f46e5?style=for-the-badge&labelColor=1e1b4b&color=4f46e5"/></a>
  <br/>
  <br/>
  <i>DevTrace AI: Building the future of collaborative debugging.</i>
</div>
