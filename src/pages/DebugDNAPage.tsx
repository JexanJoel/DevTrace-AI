import { useState } from 'react';
import {
  Dna, Loader2, Sparkles, TrendingUp, TrendingDown,
  Clock, Calendar, Zap, Target, BarChart2, Download,
  RefreshCw, AlertTriangle, CheckCircle, Bug, Flame,
  Lightbulb, ChevronDown, ChevronUp, Activity
} from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import useDebugDNA from '../hooks/useDebugDNA';
import type { CategoryStat } from '../hooks/useDebugDNA';

// ─── constants ───────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low: 'text-green-600 bg-green-50 border-green-200',
};

const WEEK_LABELS = ['This week', 'Last week', '2w ago', '3w ago'];

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Pull 2–3 short actionable tips out of a freeform AI narrative */
function extractTips(narrative: string): string[] {
  const sentences = narrative
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 160);

  // Prefer sentences that feel like advice
  const adviceKeywords = ['try', 'consider', 'focus', 'improve', 'avoid', 'leverage', 'prioritize', 'review', 'spend'];
  const tips = sentences.filter(s =>
    adviceKeywords.some(kw => s.toLowerCase().includes(kw))
  ).slice(0, 3);

  // Fall back to first few sentences if no advice-style ones found
  return tips.length >= 2 ? tips : sentences.slice(0, 3);
}

/** Derive a fake-but-plausible streak from weekly buckets */
function deriveStreak(weeklyBuckets: number[]): number {
  // Treat each bucket as a week; count consecutive non-zero weeks from most recent
  let streak = 0;
  for (const count of weeklyBuckets) {
    if (count > 0) streak++;
    else break;
  }
  return streak;
}

// ─── sub-components ──────────────────────────────────────────────────────────

const CategoryBar = ({ stat, color }: { stat: CategoryStat; color: string }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[55%]">{stat.category}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-400 hidden sm:inline">{stat.total} sessions</span>
        <span className={`text-xs font-bold ${stat.resolutionRate >= 70 ? 'text-green-600' : stat.resolutionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
          {stat.resolutionRate}%
        </span>
      </div>
    </div>
    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.max(stat.resolutionRate, 3)}%` }}
      />
    </div>
  </div>
);

// ── Feature 1: Streak badge ──
const StreakBadge = ({ streak }: { streak: number }) => (
  <div className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-xl px-3 py-1.5">
    <Flame size={14} className={streak >= 3 ? 'text-orange-300' : 'text-white/60'} />
    <span className="text-white font-bold text-sm">{streak}</span>
    <span className="text-white/70 text-xs">wk streak</span>
  </div>
);

// ── Feature 2: AI Tips cards ──
const AITipsSection = ({ narrative }: { narrative: string }) => {
  const tips = extractTips(narrative);
  if (tips.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-indigo-100 dark:border-indigo-900 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950 rounded-xl flex items-center justify-center">
          <Lightbulb size={15} className="text-amber-500" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">Quick Wins</h3>
        <span className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-100 dark:border-amber-900 px-2 py-0.5 rounded-full font-medium ml-auto">
          AI Tips
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950 rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-900"
          >
            <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-2">
              <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Feature 3: Bug type radar (simple proportional dot-matrix) ──
const BugRadar = ({ categoryStats }: { categoryStats: CategoryStat[] }) => {
  if (categoryStats.length === 0) return null;
  const total = categoryStats.reduce((s, c) => s + c.total, 0) || 1;
  const colors = ['bg-violet-400', 'bg-indigo-400', 'bg-blue-400', 'bg-cyan-400', 'bg-teal-400', 'bg-green-400'];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Activity size={16} className="text-cyan-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">Bug Radar</h3>
      </div>
      <p className="text-xs text-gray-400 mb-5">Volume share by category</p>

      {/* Stacked bar */}
      <div className="flex h-4 rounded-full overflow-hidden mb-4 gap-px">
        {categoryStats.map((c, i) => (
          <div
            key={i}
            className={`${colors[i % colors.length]} transition-all duration-700`}
            style={{ width: `${Math.max((c.total / total) * 100, 1)}%` }}
            title={`${c.category}: ${c.total}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {categoryStats.map((c, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[i % colors.length]}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{c.category}</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white ml-auto flex-shrink-0">
              {Math.round((c.total / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Collapsible section wrapper (mobile UX) ──
const CollapsibleSection = ({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
      >
        <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {icon} {title}
        </span>
        {open
          ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && <div className="px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>}
    </div>
  );
};

// ─── page ─────────────────────────────────────────────────────────────────────

const DebugDNAPage = () => {
  const { result, loading, error, generate } = useDebugDNA();
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    if (!result) return;
    const { stats, narrative } = result;
    const md = `# My Debug DNA — DevTrace AI\n\n## AI Narrative\n\n${narrative}\n\n## Stats\n\n- Total sessions: ${stats.total}\n- Resolution rate: ${stats.resolutionRate}%\n- Open: ${stats.open} · Resolved: ${stats.resolved}\n- Avg resolution time: ${stats.avgResolutionHours}h\n- Busiest day: ${stats.busiestDay}\n- Top fix type: ${stats.topFixType}\n- Avg AI confidence: ${stats.avgConfidence}%\n\n## Category Breakdown\n\n${stats.categoryStats.map(c => `- ${c.category}: ${c.total} sessions, ${c.resolutionRate}% resolved`).join('\n')}\n\n_Generated by DevTrace AI_`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debug-dna.md';
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const streak = result ? deriveStreak(result.stats.weeklyBuckets) : 0;

  return (
    <DashboardLayout title="Debug DNA">
      <div className="space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-7">
          <div className="flex flex-col gap-4">

            {/* top row: icon + streak */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Dna size={16} className="text-white" />
                </div>
                <span className="text-white/80 text-xs sm:text-sm font-medium">
                  Supabase Edge + Groq
                </span>
              </div>
              {result && streak > 0 && <StreakBadge streak={streak} />}
            </div>

            {/* title + description */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Your Debug DNA</h2>
              <p className="text-violet-200 text-xs sm:text-sm mt-1 max-w-md">
                Personalized analysis of your debugging patterns, strengths, and blind spots.
              </p>
            </div>

            {/* action buttons — stack on mobile */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-indigo-600 font-bold px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-60 shadow-lg"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
                  : result
                  ? <><RefreshCw size={15} /> Regenerate</>
                  : <><Sparkles size={15} /> Generate My DNA</>
                }
              </button>
              {result && (
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-1.5 border border-white/30 hover:border-white/60 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  <Download size={14} />
                  {exported ? 'Exported!' : 'Export .md'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {!result && !loading && !error && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-violet-50 dark:bg-violet-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Dna size={26} className="text-violet-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Your debugging fingerprint awaits</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
              Click below to analyze your session history and get a personalized breakdown of your debugging patterns.
            </p>
            <button
              onClick={generate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition mx-auto"
            >
              <Sparkles size={15} /> Generate My Debug DNA
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 sm:p-12 text-center">
            <Loader2 size={30} className="animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="font-semibold text-gray-900 dark:text-white">Analyzing your sessions...</p>
            <p className="text-gray-400 text-sm mt-1">Supabase Edge Function is computing your patterns</p>
          </div>
        )}

        {/* ── No sessions error ── */}
        {error === 'no_sessions' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 sm:p-12 text-center">
            <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bug size={22} className="text-yellow-500" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">No sessions yet</p>
            <p className="text-gray-400 text-sm">Create some debug sessions first — your DNA needs data to analyze.</p>
          </div>
        )}

        {/* ── Generic error ── */}
        {error && error !== 'no_sessions' && (
          <div className="bg-red-50 dark:bg-red-950 rounded-2xl border border-red-200 dark:border-red-900 p-4 sm:p-5 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">Generation failed</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <>
            {/* AI Narrative */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-violet-100 dark:border-violet-900 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-violet-600" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Your Debugging Profile</h3>
                <span className="text-xs bg-violet-50 dark:bg-violet-950 text-violet-600 border border-violet-100 dark:border-violet-900 px-2 py-0.5 rounded-full font-medium ml-auto whitespace-nowrap">
                  AI Generated
                </span>
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                {result.narrative.split('\n\n').filter(p => p.trim()).map((para, i) => (
                  <p key={i} className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{para}</p>
                ))}
              </div>
            </div>

            {/* ── NEW: AI Quick Win Tips ── */}
            <AITipsSection narrative={result.narrative} />

            {/* Key stats — 2 cols on mobile, 4 on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              {[
                { label: 'Total Sessions',  value: result.stats.total,                                                                    icon: <Bug size={16} />,    color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950',     sub: 'all time' },
                { label: 'Resolution Rate', value: `${result.stats.resolutionRate}%`,                                                     icon: <Target size={16} />, color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950',   sub: `${result.stats.resolved} resolved` },
                { label: 'Avg Fix Time',    value: result.stats.avgResolutionHours > 0 ? `${result.stats.avgResolutionHours}h` : '—',     icon: <Clock size={16} />,  color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950', sub: 'per session' },
                { label: 'AI Confidence',   value: result.stats.avgConfidence > 0 ? `${result.stats.avgConfidence}%` : '—',               icon: <Zap size={16} />,    color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950', sub: 'avg confidence' },
              ].map((c, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 sm:p-5">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 ${c.bg} rounded-xl flex items-center justify-center ${c.color} mb-2.5 sm:mb-3`}>{c.icon}</div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-none">{c.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Category + strengths/weaknesses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

              {/* Category resolution rates */}
              <CollapsibleSection
                title="Category Breakdown"
                icon={<BarChart2 size={15} className="text-indigo-500" />}
              >
                <p className="text-xs text-gray-400 mb-4 -mt-1">Resolution rate by error category</p>
                <div className="space-y-4">
                  {result.stats.categoryStats.map((stat, i) => (
                    <CategoryBar
                      key={i}
                      stat={stat}
                      color={stat.resolutionRate >= 70 ? 'bg-green-400' : stat.resolutionRate >= 40 ? 'bg-yellow-400' : 'bg-red-400'}
                    />
                  ))}
                  {result.stats.categoryStats.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Analyze more sessions to see category patterns</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Strengths + weaknesses + habits */}
              <div className="space-y-4">

                {result.stats.bestCategories.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-green-100 dark:border-green-900 p-4 sm:p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <TrendingUp size={14} className="text-green-500" /> You Excel At
                    </h3>
                    <div className="space-y-2">
                      {result.stats.bestCategories.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-950 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">{c.category}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-green-600 flex-shrink-0 ml-2">{c.resolutionRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.stats.hardestCategories.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900 p-4 sm:p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <TrendingDown size={14} className="text-red-500" /> Needs Attention
                    </h3>
                    <div className="space-y-2">
                      {result.stats.hardestCategories.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-950 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">{c.category}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-red-600 flex-shrink-0 ml-2">{c.resolutionRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Habits */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Calendar size={14} className="text-indigo-500" /> Your Habits
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Busiest day',       value: result.stats.busiestDay,               valueClass: 'text-gray-900 dark:text-white' },
                      { label: 'Preferred fix type', value: result.stats.topFixType || '—',        valueClass: 'capitalize text-gray-900 dark:text-white' },
                      { label: 'Open sessions',      value: String(result.stats.open),             valueClass: 'text-orange-600' },
                      { label: 'In progress',        value: String(result.stats.inProgress),       valueClass: 'text-blue-600' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                        <span className="text-gray-500 truncate">{row.label}</span>
                        <span className={`font-semibold flex-shrink-0 ${row.valueClass}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── NEW: Bug Radar ── */}
            <BugRadar categoryStats={result.stats.categoryStats} />

            {/* Severity distribution — 2 cols mobile, 4 on sm+ */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 text-sm sm:text-base">
                <Target size={15} className="text-orange-500" /> Severity Distribution
              </h3>
              <p className="text-xs text-gray-400 mb-4 sm:mb-5">How you classify your bugs</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {['critical', 'high', 'medium', 'low'].map(sev => {
                  const count = result.stats.severityMap[sev] ?? 0;
                  const pct = result.stats.total > 0 ? Math.round((count / result.stats.total) * 100) : 0;
                  return (
                    <div key={sev} className={`rounded-xl border p-3 sm:p-4 text-center ${SEVERITY_TEXT[sev]}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${SEVERITY_COLORS[sev]} mx-auto mb-1.5 sm:mb-2`} />
                      <p className="text-lg sm:text-xl font-bold">{count}</p>
                      <p className="text-xs font-semibold capitalize mt-0.5">{sev}</p>
                      <p className="text-xs opacity-70 mt-0.5">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly activity */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp size={15} className="text-blue-500" /> Recent Activity
              </h3>
              <p className="text-xs text-gray-400 mb-4 sm:mb-5">Sessions logged per week</p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {result.stats.weeklyBuckets.map((count, i) => {
                  const maxVal = Math.max(...result.stats.weeklyBuckets, 1);
                  const pct = Math.round((count / maxVal) * 100);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden h-16 sm:h-20 flex items-end">
                        <div
                          className="w-full bg-indigo-400 rounded-xl transition-all duration-700"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{count}</p>
                      <p className="text-xs text-gray-400 text-center leading-tight hidden xs:block">{WEEK_LABELS[i]}</p>
                      {/* Abbreviated labels for very small screens */}
                      <p className="text-xs text-gray-400 text-center leading-tight xs:hidden">
                        {['Now', '-1w', '-2w', '-3w'][i]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default DebugDNAPage;