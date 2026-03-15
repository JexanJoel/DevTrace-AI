<div align="center">

<br/>

<img src="https://img.shields.io/badge/⌨️-DevTrace_AI-4f46e5?style=for-the-badge&labelColor=1e1b4b&color=4f46e5" height="36"/>

<h2>AI powered debugging assistant for developers</h2>

<br/>

<table><tr>
<td align="center"><a href="https://dev-trace-ai.vercel.app"><img src="https://img.shields.io/badge/🚀%20Live%20Demo-4f46e5?style=for-the-badge&logoColor=white"/></a></td>
<td align="center"><a href="https://github.com/JexanJoel/DevTrace-AI"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a></td>
<td align="center"><a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge"/></a></td>
<td align="center"><a href="https://www.powersync.com/"><img src="https://img.shields.io/badge/PowerSync_AI_Hackathon_2026-6366f1?style=for-the-badge"/></a></td>
<td align="center"><a href="https://github.com/sponsors/JexanJoel"><img src="https://img.shields.io/badge/💖%20Sponsor%20Me-e11d48?style=for-the-badge"/></a></td>
</tr></table>

<br/><br/>

</div>

---

## What is DevTrace AI?

DevTrace AI is your **permanent debugging memory** - log bugs, get instant AI analysis, save what works, and share with teammates. Works offline. Remembers everything.

<div align="center">

| | |
|:--|:--|
| 🔍 | Every bug gets a permanent structured record |
| 🤖 | Full AI breakdown - root cause, fixes, timeline |
| 🧬 | Debug DNA - your personal error fingerprint |
| 💾 | Saved as JSONB - persists across reloads |
| 📶 | Fully offline via PowerSync local SQLite |
| 🔗 | Share projects and sessions with teammates |

</div>

**The core problem it solves:** Debugging is slow and scattered. You repeat the same mistakes, forget what fixed what, and lose context every time you close a tab. DevTrace AI is your permanent debugging memory.

---

## How It Works

```
1. You paste an error          →  Log a debug session (error, stack trace, code, severity)
2. Click "Analyze Bug"         →  Groq + Llama 3.3 70B returns a full structured analysis
3. Read the 8 tab breakdown    →  Overview, Fixes, Timeline, Checklist, Chat, Tests, Logs, Structure
4. Save what worked            →  Fix goes to your Fix Library, tagged and searchable forever
5. Share with a teammate       →  They get read-only access via Shared with Me page
6. Generate your Debug DNA     →  Supabase Edge Function analyzes your patterns + Groq writes your fingerprint
```

### Read vs Write - the data flow

All **reads** come from a local SQLite database (PowerSync). Zero network latency - instant.

All **writes** go directly to Supabase Postgres. PowerSync detects the change and syncs it back down.

```
WRITE  →  supabase.from('table').insert()  →  Supabase Postgres
                                                      │
                                              PowerSync WAL listener
                                                      │
READ   ←  useQuery() from @powersync/react  ←  Local SQLite  (0ms, no spinner)
```

Offline? Writes go into a queue in `localStorage`. The moment you reconnect, they flush to Supabase automatically.

---

## The AI Debug Panel - 8 Tabs Per Bug

Every session gets a full structured breakdown powered by **Groq + Llama 3.3 70B**. The complete analysis is saved as JSONB in Supabase - persists across reloads, no re-analyzing needed.

- 🔍 **Overview** - Plain English explanation, root cause, symptom vs cause, category badge, confidence score, files to check
- ⚡ **Fixes** - 3 options (quick patch, proper fix, workaround) each with full code & pros/cons
- 🕐 **Timeline** - Visual step-by-step of how the crash happened from component mount to error throw
- ✅ **Checklist** - Interactive priority-ranked action list - check items off as you debug
- 💬 **Followup** - Context-aware AI chat - click suggested questions or type your own
- 🧪 **Tests** - AI-generated reproduction steps and test cases to verify the fix works
- 📋 **Logs** - Paste raw console or server logs - AI strips noise and surfaces what matters
- 🏗️ **Structure** - Paste your file tree - AI reviews architecture and flags problems

---

## Debug DNA — Your Personal Error Fingerprint

DevTrace AI builds a **personalized analysis of your debugging patterns** using a Supabase Edge Function + Groq.

Click **"Generate My DNA"** on the Debug DNA page and the Edge Function:

1. Queries your `debug_sessions` server-side using the Supabase service role
2. Computes category resolution rates, severity distribution, fix preferences, weekly activity, avg AI confidence, and busiest debugging day
3. Sends the structured stats to Groq + Llama 3.3 70B
4. Groq generates a **personalized narrative** — not just charts, but actual sentences about your specific patterns
5. Returns everything back to the client for display + Markdown export

```
User clicks "Generate My DNA"
         ↓
Supabase Edge Function (debug-dna)
         ↓
Server-side SQL aggregations on debug_sessions
         ↓
Groq + Llama 3.3 70B generates personalized narrative
         ↓
{ stats, narrative } returned to client
         ↓
Debug DNA page renders + export as Markdown
```

**What it shows:**
- AI-generated narrative about your debugging profile
- Category breakdown with resolution rates per error type
- "You Excel At" vs "Needs Attention" split
- Severity distribution across all sessions
- Weekly activity chart (last 4 weeks)
- Your habits — busiest day, preferred fix type, open vs resolved counts

---

## How DevTrace AI Uses Supabase

Supabase is the **source of truth and auth backbone** for the entire app. All data lives here, all auth flows through here, and PowerSync replicates from here via WAL.

### 🔐 Authentication

- **Email + Password** - `supabase.auth.signInWithPassword()`
- **GitHub OAuth** - `signInWithOAuth({ provider: 'github' })`
- **Google OAuth** - `signInWithOAuth({ provider: 'google' })`
- **Password Reset** - `resetPasswordForEmail()` → branded magic link email → `/reset-password` → `updateUser({ password })`
- **GitHub Linking** - `linkIdentity({ provider: 'github' })` → `/auth/callback` → username saved to `profiles`
- **Session sync** - `onAuthStateChange()` keeps Zustand `authStore` live across all tabs

> Zero custom auth code - Supabase handles all tokens, refresh, and session persistence.

---

### 🗄️ Database - Postgres + RLS

Every table has Row Level Security enabled. Users can only ever read and write **their own rows** - enforced at the database level, not in application code.

<table width="100%">
<tr><th align="left">Table</th><th align="left">Columns</th></tr>
<tr><td><code>profiles</code></td><td><code>name</code> · <code>avatar_url</code> · <code>github_username</code> · <code>github_connected</code> · <code>dark_mode</code></td></tr>
<tr><td><code>projects</code></td><td><code>name</code> · <code>description</code> · <code>language</code> · <code>github_url</code> · <code>session_count</code> · <code>error_count</code></td></tr>
<tr><td><code>debug_sessions</code></td><td><code>error_message</code> · <code>stack_trace</code> · <code>code_snippet</code> · <code>severity</code> · <code>status</code> · <code>ai_analysis</code> (JSONB) · <code>notes</code></td></tr>
<tr><td><code>fixes</code></td><td><code>title</code> · <code>fix_content</code> · <code>language</code> · <code>tags[]</code> · <code>use_count</code> · <code>session_id</code> · <code>project_id</code></td></tr>
<tr><td><code>shares</code></td><td><code>owner_id</code> · <code>invitee_id</code> · <code>resource_type</code> · <code>resource_id</code> · unique constraint prevents duplicate shares</td></tr>
</table>

Each table has RLS policies covering `SELECT` · `INSERT` · `UPDATE` · `DELETE` - all checking `auth.uid() = user_id`.

The `shares` table has its own policies — owners manage their shares, invitees read theirs, and `projects`/`debug_sessions` have additional SELECT policies granting invitees access to shared resources.

> 💡 The full 8-tab AI breakdown is stored as a single `ai_analysis` JSONB column - no extra tables, loads instantly on revisit, and syncs through PowerSync like any other column.

---

### ⚡ Edge Functions

DevTrace AI uses a **Supabase Edge Function** (`debug-dna`) for the Debug DNA feature:

- Runs server-side — uses the service role key to query Postgres directly
- Performs SQL aggregations not practical client-side (GROUP BY category, date math, resolution time)
- Calls Groq API server-side — API key never exposed to the browser
- Returns structured stats + AI narrative in a single response

---

### 🗃️ Storage

Profile avatars are stored in a public Supabase Storage bucket called `avatars`, organized per user:

```
avatars/
└── {user_id}/
    └── avatar.ext   ← URL cache-busted with ?t={timestamp} on every upload
```

---

### 🔗 WAL Replication → PowerSync

A single Postgres publication called `powersync` connects Supabase to PowerSync:

```sql
create publication powersync
  for table profiles, projects, debug_sessions, fixes, shares;
```

PowerSync listens to this WAL stream and streams every change down to connected browser clients in real time.

---

## How DevTrace AI Uses PowerSync

PowerSync is the **offline engine**. It maintains a local SQLite database in the browser that the React app reads from directly - no network request, no loading spinner, no internet required.

### 📖 Read path - always instant

Every list, detail page, dashboard, and analytics view reads from local SQLite:

```typescript
// Zero network - hits local SQLite directly
const { data: sessions } = useQuery(
  'SELECT * FROM debug_sessions WHERE user_id = ? ORDER BY created_at DESC',
  [userId]
);
```

This pattern is used in every data hook: `useSessions.ts`, `useProjects.ts`, `useFixes.ts`, `useProfile.ts`.

---

### ✍️ Write path - Supabase first, PowerSync syncs back

```typescript
// Write goes to Supabase - PowerSync detects via WAL and syncs down automatically
await supabase.from('debug_sessions').insert({ ...newSession });
```

```
supabase.insert()  →  Supabase Postgres  →  WAL publication
                                                   ↓
                                        PowerSync Instance
                                                   ↓
                                          Local SQLite updated
                                                   ↓
                                       useQuery() reflects change
```

---

### 🟢 Online vs 🟠 Offline

<table width="100%">
<tr><th align="left">State</th><th align="left">What happens</th></tr>
<tr><td>🟢 App opens online</td><td>PowerSync connects and streams latest changes from Supabase</td></tr>
<tr><td>🟢 User reads data</td><td><code>useQuery()</code> returns from local SQLite - instant, 0ms</td></tr>
<tr><td>🟢 User creates a session</td><td><code>supabase.insert()</code> → WAL → PowerSync → SQLite updated</td></tr>
<tr><td>🟠 Internet drops</td><td>Orange banner appears - all existing data still fully readable</td></tr>
<tr><td>🟠 User creates offline</td><td>Saved to SQLite + queued in <code>localStorage</code></td></tr>
<tr><td>🟢 Internet returns</td><td>Queue flushes to Supabase, PowerSync syncs delta back down</td></tr>
</table>

---

### ⚙️ Sync rules

```yaml
bucket_definitions:
  user_data:
    parameters: SELECT request.user_id() as user_id
    data:
      - SELECT * FROM profiles       WHERE id = bucket.user_id
      - SELECT * FROM projects       WHERE user_id = bucket.user_id
      - SELECT * FROM debug_sessions WHERE user_id = bucket.user_id
      - SELECT * FROM fixes          WHERE user_id = bucket.user_id
      - SELECT * FROM shares         WHERE owner_id = bucket.user_id
```

Each user only receives their own rows - data isolation enforced at the sync layer on top of RLS.

---

### 📊 Live Sync Status page

DevTrace AI ships a dedicated `/sync-status` page showing the full architecture, live SQLite row counts across all 5 tables, sync health indicator, recent sync events, and the pending write queue with upload progress - all updating in real time.

---

## Sharing & Collaboration

DevTrace AI supports read-only sharing of projects and sessions between registered users.

### How it works

- **Share a project** → the invitee sees all debug sessions inside it (read-only)
- **Share a session** → the invitee sees just that one session (read-only)
- **No email required** - sharing is instant. The invitee logs into their DevTrace account and finds shared content under **Shared with Me** in the sidebar
- **Revokable** - the owner can remove access at any time from the Share modal

### Share flow

```
Owner opens project/session
       ↓
Clicks "Share" button
       ↓
Types invitee's email (must have a DevTrace account)
       ↓
Share row inserted into Supabase → RLS grants read access
       ↓
Invitee logs in → sees it under "Shared with Me"
       ↓
Read-only amber banner shown — no edit, delete, or AI controls
```

### Database design

```sql
create table shares (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade,
  invitee_id uuid references auth.users on delete cascade,
  resource_type text not null check (resource_type in ('project', 'session')),
  resource_id uuid not null,
  created_at timestamptz default now(),
  unique(invitee_id, resource_type, resource_id)
);
```

RLS on `projects` and `debug_sessions` has additional SELECT policies allowing invitees to read rows they've been granted access to — enforced entirely at the database level.

---

## Full Feature List

### 🐛 Debugging

- **Session Tracking** - Log errors with stack trace, code snippet, expected behavior, environment, and severity (critical / high / medium / low)
- **AI Debug Panel** - 8-tab full breakdown - every bug analyzed by Groq + Llama 3.3 70B, saved permanently as JSONB
- **Follow-up Chat** - Context-aware AI chat inside every session - click suggested questions or type your own
- **Fix Library** - Save working fixes, filter by language, copy in one click, track use count across projects
- **Export as Markdown** - Export any debug session as a `.md` file for sharing or archiving

### 🧬 Debug DNA

- **Personal Error Fingerprint** - Supabase Edge Function queries your session history server-side and computes your debugging patterns
- **AI Narrative** - Groq generates a personalized written profile of your strengths, weaknesses, and habits
- **Category Resolution Rates** - See which error types you crush and which ones beat you
- **Strengths & Weaknesses** - "You Excel At" vs "Needs Attention" split cards
- **Weekly Activity Chart** - Sessions logged per week over the last 4 weeks
- **Severity Distribution** - How you classify your bugs across critical / high / medium / low
- **Export DNA Report** - Download your full Debug DNA as Markdown

### 📁 Organization

- **Projects** - Group debug sessions by project, link GitHub repos, track session and error counts
- **Project Health Score** - 0–100 score - deducted for open critical/high issues, inactivity, and low resolution rate
- **Session Streak** - Tracks consecutive debug days - badge upgrades white → yellow → fiery 🔥 at 7+ days
- **GitHub Connect** - Link your GitHub account from Profile - avatar, username, and disconnect in one place

### 🔗 Sharing

- **Share Projects** - Invite any registered DevTrace user by email to view a project and all its sessions
- **Share Sessions** - Share individual debug sessions with teammates
- **Read-only access** - Invitees can view everything but cannot edit, delete, or run AI analysis
- **Revoke anytime** - Owner can remove access instantly from the Share modal
- **Shared with Me page** - Dedicated sidebar page listing all projects and sessions shared with you

### 📊 Insights & Analytics

- **Analytics Page** - Resolution rates, error trends, severity breakdowns, time-to-fix - visualized with Recharts
- **AI Insights Page** - Category breakdown across all sessions, confidence distribution, most flagged files
- **Sync Status Page** - Live architecture diagram, 5-table SQLite row counts, sync health, event log, write queue

### 🔐 Auth & Profile

- **Email + Password** - Sign up / log in with email - branded magic link password reset included
- **GitHub & Google OAuth** - One-click social sign in via Supabase Auth
- **GitHub Linking** - `linkIdentity()` from Profile page - username auto-read from OAuth identity metadata
- **Avatar Upload** - Profile picture stored in Supabase Storage with per-user bucket paths

### 📶 Offline & Sync

- **Offline-First Reads** - All data reads from local SQLite via PowerSync - zero spinners, zero network dependency
- **Offline Write Queue** - Create sessions and projects offline - auto-synced to Supabase on reconnect
- **Real-Time Sync** - PowerSync streams Supabase WAL changes to local SQLite instantly when online
- **Offline Banner** - Orange banner with pending write count shown whenever you're disconnected

### 🎨 UX

- **Dark Mode** - Full dark theme saved to your profile and applied globally
- **Mobile Responsive** - Collapsible sidebar, all pages fully usable on phones and tablets
- **Toast Notifications** - Non-intrusive feedback for every action - success, error, and info states

---

## Tech Stack

<div align="center">

<table width="100%">
<tr><th></th><th align="left">Technology</th><th align="left">Role</th></tr>
<tr><td>⚛️</td><td><b>React 18 + TypeScript + Vite</b></td><td>Frontend framework + type safety + build tool</td></tr>
<tr><td>🎨</td><td><b>Tailwind CSS</b></td><td>Utility-first styling + dark mode</td></tr>
<tr><td>🐻</td><td><b>Zustand</b></td><td>Lightweight global state (auth, sync queue)</td></tr>
<tr><td>🟢</td><td><b>Supabase</b></td><td>Postgres · Auth · Storage · RLS · WAL replication · Edge Functions</td></tr>
<tr><td>⚡</td><td><b>PowerSync</b></td><td>Local SQLite sync · offline reads · real-time streaming</td></tr>
<tr><td>🤖</td><td><b>Groq + Llama 3.3 70B</b></td><td>Ultra-fast AI inference — debug analysis + Debug DNA narrative</td></tr>
<tr><td>📊</td><td><b>Recharts</b></td><td>Analytics charts and data visualization</td></tr>
<tr><td>🚀</td><td><b>Vercel</b></td><td>Zero-config deployment + preview URLs</td></tr>
</table>

</div>

<br/>

<div align="center">

<table><tr>
<td align="center"><img src="https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB"/></td>
<td align="center"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white"/></td>
<td align="center"><img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white"/></td>
<td align="center"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white"/></td>
</tr><tr>
<td align="center"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/></td>
<td align="center"><img src="https://img.shields.io/badge/PowerSync-6366F1?style=flat-square&logoColor=white"/></td>
<td align="center"><img src="https://img.shields.io/badge/Groq_AI-F55036?style=flat-square&logoColor=white"/></td>
<td align="center"><img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white"/></td>
</tr></table>

</div>

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) account - free tier works
- [Groq](https://console.groq.com) API key - free
- [PowerSync](https://www.powersync.com) account - free tier works

---

### Step 1 - Clone and install

```bash
git clone https://github.com/JexanJoel/DevTrace-AI.git
cd DevTrace-AI
npm install
```

---

### Step 2 - Supabase setup

**2a.** Create a new project at [supabase.com](https://supabase.com)

**2b.** Go to **SQL Editor** and run the full schema:

<details>
<summary>📋 Click to expand - full SQL schema</summary>

```sql
-- Profiles (auto-created on signup via trigger)
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

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email')
  )
  on conflict (id) do update
    set email = coalesce(excluded.email, new.raw_user_meta_data->>'email');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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
  exists (
    select 1 from shares
    where shares.resource_id = projects.id
    and shares.resource_type = 'project'
    and shares.invitee_id = auth.uid()
  )
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
  exists (
    select 1 from shares
    where shares.resource_id = debug_sessions.id
    and shares.resource_type = 'session'
    and shares.invitee_id = auth.uid()
  )
);
create policy "Sessions in shared projects can read" on debug_sessions for select using (
  exists (
    select 1 from shares
    where shares.resource_id = debug_sessions.project_id
    and shares.resource_type = 'project'
    and shares.invitee_id = auth.uid()
  )
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
create trigger projects_updated_at before update on projects
  for each row execute procedure update_updated_at();
create trigger sessions_updated_at before update on debug_sessions
  for each row execute procedure update_updated_at();

-- PowerSync WAL publication (required)
create publication powersync for table profiles, projects, debug_sessions, fixes, shares;
```

</details>

**2c.** Go to **Authentication → URL Configuration** and set:

```
Site URL:      https://your-app.vercel.app
Redirect URLs: https://your-app.vercel.app/reset-password
               https://your-app.vercel.app/auth/callback
               https://your-app.vercel.app/dashboard
               http://localhost:5173/reset-password
               http://localhost:5173/auth/callback
               http://localhost:5173/dashboard
```

**2d.** Go to **Authentication → Providers** → enable **GitHub** and **Google**

**2e.** Go to **Storage** → create a bucket called `avatars` → set to **public**

**2f.** Go to **Edge Functions → Create function** → name it `debug-dna` → paste the function code from `supabase/functions/debug-dna/index.ts`

**2g.** Go to **Settings → Edge Functions → Secrets** and add:

```
GROQ_API_KEY       = your_groq_api_key
SERVICE_ROLE_KEY   = your_supabase_service_role_key
```

---

### Step 3 - PowerSync setup

**3a.** Create a free account at [powersync.com](https://www.powersync.com)

**3b.** Create a new instance → connect it to your Supabase project using the **direct Postgres connection URI** (found in Supabase → Settings → Database → Connection string → URI)

**3c.** In the **Sync Rules** editor, paste:

```json
{
  "bucket_definitions": {
    "user_data": {
      "parameters": "SELECT request.user_id() as user_id",
      "data": [
        "SELECT * FROM profiles WHERE id = bucket.user_id",
        "SELECT * FROM projects WHERE user_id = bucket.user_id",
        "SELECT * FROM debug_sessions WHERE user_id = bucket.user_id",
        "SELECT * FROM fixes WHERE user_id = bucket.user_id",
        "SELECT * FROM shares WHERE owner_id = bucket.user_id"
      ]
    }
  }
}
```

**3d.** Click **Deploy** → copy your **PowerSync instance URL**

---

### Step 4 - Environment variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_POWERSYNC_URL=https://your-instance.powersync.journeyapps.com
```

---

### Step 5 - Run

```bash
npm run dev
# → http://localhost:5173
```

---

## Project Structure

```
src/
├── components/
│   ├── dashboard/          # DashboardLayout, Sidebar, TopBar
│   ├── sessions/           # AIDebugPanel (8 tabs), CreateSessionModal, StatusBadge
│   ├── projects/           # ProjectCard (with health score), CreateProjectModal
│   ├── profile/            # AvatarUpload
│   ├── shared/             # ProtectedRoute, OfflineBanner, ShareModal
│   └── providers/          # PowerSyncProvider
│
├── hooks/
│   ├── useSessions.ts      # PowerSync reads + Supabase writes
│   ├── useProjects.ts      # PowerSync reads + Supabase writes
│   ├── useFixes.ts         # PowerSync reads + Supabase writes
│   ├── useProfile.ts       # PowerSync reads + Supabase writes
│   ├── useShares.ts        # Share creation, revocation, lookup
│   ├── useDebugDNA.ts      # Calls debug-dna Edge Function, manages result state
│   ├── useDashboardStats.ts
│   ├── usePendingQueue.ts  # Offline write queue (localStorage → Supabase)
│   └── useOnlineStatus.ts  # Network detection
│
├── lib/
│   ├── groqClient.ts       # analyzeSession, sendFollowUp, analyzeLogs, analyzeStructure
│   ├── projectHealth.ts    # Health score formula (pure client-side, no API calls)
│   ├── supabaseClient.ts
│   └── powersync.ts        # Schema + PowerSyncDatabase singleton
│
├── pages/
│   ├── DashboardPage.tsx         # Stats overview + session streak
│   ├── ProjectsPage.tsx
│   ├── ProjectDetailPage.tsx     # Per-project stats + health score + share button
│   ├── SessionsPage.tsx
│   ├── SessionDetailPage.tsx     # AI Debug Panel - all 8 tabs + share + export
│   ├── FixLibraryPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── AIInsightsPage.tsx        # AI usage stats + category breakdown
│   ├── DebugDNAPage.tsx          # Personal error fingerprint + AI narrative
│   ├── SyncStatusPage.tsx        # Live PowerSync architecture + 5-table row counts
│   ├── SharedWithMePage.tsx      # Lists all projects/sessions shared with you
│   ├── SharedProjectView.tsx     # Read-only project view for invitees
│   ├── SharedSessionView.tsx     # Read-only session view for invitees
│   ├── ProfilePage.tsx           # Avatar, GitHub connect/disconnect
│   ├── SettingsPage.tsx
│   ├── LoginPage.tsx             # Email + GitHub + Google + forgot password link
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx    # Send magic link reset email
│   ├── ResetPasswordPage.tsx     # Set new password after clicking link
│   └── GitHubCallbackPage.tsx    # OAuth callback - reads identity, saves to profile
│
└── store/
    ├── authStore.ts
    └── useSyncQueue.ts           # Global sync queue (Zustand)

supabase/
└── functions/
    └── debug-dna/
        └── index.ts              # Edge Function - SQL aggregations + Groq narrative
```

---

## FAQ

<details>
<summary><b>Is it free to run?</b></summary>
<br/>
Yes. Groq, Supabase, and PowerSync all have generous free tiers. You can self-host DevTrace AI at zero cost.
</details>

<details>
<summary><b>Is my data private?</b></summary>
<br/>
Yes. All data lives in your own Supabase project. Row Level Security is enforced on every table at the database level - no one else can read your sessions, projects, or fixes unless you explicitly share them.
</details>

<details>
<summary><b>Does offline mode really work?</b></summary>
<br/>
Yes. PowerSync syncs all your data to a local SQLite database in the browser on first load. After that, reads are instant with zero network dependency. New sessions and fixes created offline are saved locally and automatically uploaded when you reconnect.
</details>

<details>
<summary><b>How does sharing work?</b></summary>
<br/>
Open any project or session and click the Share button. Type the email of another registered DevTrace user. They'll immediately see it under "Shared with Me" in their sidebar the next time they log in. You can revoke access at any time from the same Share modal. No email is sent - it's account-to-account sharing only.
</details>

<details>
<summary><b>What is Debug DNA?</b></summary>
<br/>
Debug DNA is a personalized analysis of your debugging patterns generated by a Supabase Edge Function. It queries your session history server-side, computes category resolution rates, severity distributions, weekly activity, and your habits, then sends the data to Groq which writes a personal narrative about your specific strengths and weaknesses as a debugger. Export it as Markdown anytime.
</details>

<details>
<summary><b>What exactly does the AI debug panel return?</b></summary>
<br/>
A structured JSON analysis with: plain English summary, root cause, symptom vs cause, issue category, confidence score (0–100), 3 fix options with full code blocks, a crash timeline, an interactive checklist, suggested follow-up questions, reproduction steps, and test cases. Saved as JSONB so it persists across reloads.
</details>

<details>
<summary><b>Do I need a backend server?</b></summary>
<br/>
No custom backend needed. Supabase handles auth, database, storage, and Edge Functions. PowerSync handles sync. Groq is called from the browser for debug analysis and from the Edge Function for Debug DNA. No Express server or Node.js backend required.
</details>

---

## Contributing

Contributions, issues, and feature requests are welcome.

```bash
# 1. Fork the repo on GitHub

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and commit
git commit -m 'feat: add your feature'

# 4. Push to your fork
git push origin feature/your-feature-name

# 5. Open a Pull Request
```

Please open an issue first for large changes so we can align on approach before you invest time building it.

---

## Hackathon

DevTrace AI is submitted to the **PowerSync AI Hackathon 2026**.

<table width="100%">
<tr><th align="left">Prize</th><th align="left">Why this qualifies</th></tr>
<tr><td>🥇 <b>Core Prize</b></td><td>AI-powered developer tool built within the hackathon window using PowerSync as the core sync layer</td></tr>
<tr><td>🏅 <b>Best Submission Using Supabase</b></td><td>Supabase drives auth (Email · GitHub · Google OAuth · magic link password reset · GitHub account linking), Postgres with RLS on all 5 tables, Storage for avatars, WAL replication feeding PowerSync, shares table for collaboration, and an Edge Function for Debug DNA server-side computation</td></tr>
<tr><td>🏅 <b>Best Local-First App</b></td><td>All reads from local SQLite via PowerSync's <code>useQuery()</code>, offline write queue with auto-sync on reconnect, shares table synced offline, and a live Sync Status page showing the full architecture and queue state in real time</td></tr>
</table>

---

## Support 

If DevTrace AI helped you, you can support my open-source work here: 

- **GitHub Sponsors:** https://github.com/sponsors/JexanJoel

Your support helps me keep shipping, improving, and maintaining useful projects.

---

## License

MIT - free to use, fork, and build on.

---

<div align="center">

<br/>

Built for the **PowerSync AI Hackathon 2026** by [JexanJoel](https://github.com/JexanJoel)

<br/>

<table><tr>
<td align="center"><a href="https://dev-trace-ai.vercel.app"><img src="https://img.shields.io/badge/🚀%20Try%20it%20live-4f46e5?style=for-the-badge"/></a></td>
<td align="center"><a href="https://github.com/JexanJoel/DevTrace-AI/issues"><img src="https://img.shields.io/badge/🐛%20Report%20Bug-dc2626?style=for-the-badge"/></a></td>
<td align="center"><a href="https://github.com/JexanJoel/DevTrace-AI/issues"><img src="https://img.shields.io/badge/✨%20Request%20Feature-16a34a?style=for-the-badge"/></a></td>
</tr></table>

<br/>

</div>