import { useState } from 'react';
import {
  Brain, Loader2, ChevronDown, ChevronUp, Sparkles,
  RefreshCw, AlertCircle, TrendingUp, AlertTriangle,
  CheckCircle2, BarChart2, Repeat2, Zap, Clock, Target
} from 'lucide-react';
import type { DebugSession } from '../../hooks/useSessions';
import useMastraAgent, { type MastraProjectResult } from '../../hooks/useMastraAgent';

interface Props {
  projectName: string;
  projectLanguage?: string;
  sessions: DebugSession[];
}

// ── Health verdict badge ──────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  excellent:       { bg: 'bg-green-50 dark:bg-green-950/30',   border: 'border-green-200 dark:border-green-900/50',   text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500',   label: 'Excellent' },
  good:            { bg: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-900/50',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500',    label: 'Good' },
  needs_attention: { bg: 'bg-amber-50 dark:bg-amber-950/30',   border: 'border-amber-200 dark:border-amber-900/50',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',   label: 'Needs Attention' },
  critical:        { bg: 'bg-red-50 dark:bg-red-950/30',       border: 'border-red-200 dark:border-red-900/50',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',     label: 'Critical' },
};

const SEVERITY_COLORS: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
};

const PRIORITY_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  immediate:   { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50',   icon: Zap,   label: 'Immediate' },
  short_term:  { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50', icon: Clock, label: 'Short-term' },
  long_term:   { color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50',   icon: Target, label: 'Long-term' },
};

const CATEGORY_COLORS: Record<string, string> = {
  react_state:   'bg-cyan-500',
  typescript:    'bg-blue-500',
  supabase_auth: 'bg-green-500',
  supabase_db:   'bg-emerald-500',
  supabase_rls:  'bg-yellow-500',
  powersync:     'bg-indigo-500',
  groq_api:      'bg-orange-500',
  env_config:    'bg-red-500',
  network:       'bg-slate-500',
  deployment:    'bg-violet-500',
  unknown:       'bg-gray-400',
};

// ── Structured result renderer ────────────────────────────────────────────────
const StructuredResult = ({ data, onRerun }: { data: MastraProjectResult; onRerun: () => void }) => {
  const [expandedPattern, setExpandedPattern] = useState<number | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const verdict = VERDICT_CONFIG[data.health_verdict] ?? VERDICT_CONFIG.good;

  return (
    <div className="p-5 space-y-5">

      {/* Health verdict banner */}
      <div className={`rounded-xl border p-4 space-y-2 ${verdict.bg} ${verdict.border}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${verdict.dot}`} />
          <p className={`text-sm font-bold ${verdict.text}`}>{verdict.label} Health</p>
        </div>
        <p className={`text-sm leading-relaxed ${verdict.text} opacity-90`}>{data.health_summary}</p>
      </div>

      {/* Category breakdown mini-chart */}
      {data.category_breakdown?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart2 size={13} className="text-purple-500" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Error Categories</p>
          </div>
          <div className="space-y-1.5">
            {data.category_breakdown.map((cat, i) => {
              const resolvedPct = cat.count > 0 ? Math.round((cat.resolved / cat.count) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0">
                    <p className="text-[10px] text-gray-500 truncate capitalize">{cat.category.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CATEGORY_COLORS[cat.category] ?? 'bg-gray-400'}`}
                      style={{ width: `${resolvedPct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{cat.count}</span>
                    <span className="text-[10px] text-gray-400">({cat.resolved} resolved)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recurring patterns */}
      {data.recurring_patterns?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Repeat2 size={13} className="text-indigo-500" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Recurring Patterns</p>
          </div>
          <div className="space-y-2">
            {data.recurring_patterns.map((p, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedPattern(expandedPattern === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900 flex-shrink-0">
                      ×{p.frequency}
                    </span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.pattern}</p>
                  </div>
                  {expandedPattern === i ? <ChevronUp size={13} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />}
                </button>
                {expandedPattern === i && (
                  <div className="px-4 pb-3 space-y-2 border-t border-gray-50 dark:border-gray-800 pt-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.description}</p>
                    {p.sessions_affected?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.sessions_affected.map((s, j) => (
                          <span key={j} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-lg">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Systemic issues */}
      {data.systemic_issues?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-500" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Systemic Issues</p>
          </div>
          <div className="space-y-2">
            {data.systemic_issues.map((issue, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 capitalize ${SEVERITY_COLORS[issue.severity] ?? SEVERITY_COLORS.low}`}>
                      {issue.severity}
                    </span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{issue.issue}</p>
                  </div>
                  {expandedIssue === i ? <ChevronUp size={13} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />}
                </button>
                {expandedIssue === i && (
                  <div className="px-4 pb-3 space-y-2 border-t border-gray-50 dark:border-gray-800 pt-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{issue.description}</p>
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 mb-0.5 uppercase tracking-wide">Architecture cause</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">{issue.root_architecture_cause}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical open issues */}
      {data.critical_open_issues?.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-red-500" />
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Needs Immediate Attention</p>
          </div>
          <div className="space-y-2">
            {data.critical_open_issues.map((item, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">{item.title}</p>
                <p className="text-xs text-red-600 dark:text-red-400">{item.why_critical}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution insight */}
      {data.resolution_insight && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-green-500" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Resolution Trend</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-5">{data.resolution_insight}</p>
        </div>
      )}

      {/* Top recommendations */}
      {data.top_recommendations?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-purple-500" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Top Recommendations</p>
          </div>
          <div className="space-y-2">
            {data.top_recommendations.map((rec, i) => {
              const priorityCfg = PRIORITY_CONFIG[rec.priority] ?? PRIORITY_CONFIG.long_term;
              const PriorityIcon = priorityCfg.icon;
              return (
                <div key={i} className={`border rounded-xl p-4 space-y-2 ${priorityCfg.color}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{rec.title}</p>
                    <span className="flex items-center gap-1 text-[10px] font-bold flex-shrink-0">
                      <PriorityIcon size={10} /> {priorityCfg.label}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{rec.action}</p>
                  <p className="text-[11px] opacity-75">Expected: {rec.expected_impact}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-gray-400">Mastra Project Analyzer Agent</p>
        <button
          onClick={onRerun}
          className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium transition"
        >
          <RefreshCw size={11} /> Re-analyze
        </button>
      </div>
    </div>
  );
};

// ── Prose fallback ────────────────────────────────────────────────────────────
const ProseResult = ({ text, onRerun }: { text: string; onRerun: () => void }) => (
  <div className="p-5 space-y-3">
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl px-4 py-2.5">
      <p className="text-xs text-amber-700 dark:text-amber-400">Agent returned unstructured response — re-run for enhanced output</p>
    </div>
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        if (line.startsWith('#') || /^\*\*\d+\./.test(line)) return <p key={i} className="text-xs font-bold text-purple-600 uppercase tracking-wide mt-3">{line.replace(/^#+\s|\*\*/g, '')}</p>;
        if (line.startsWith('- ')) return (
          <p key={i} className="text-sm text-gray-600 dark:text-gray-400 pl-4 flex gap-2">
            <span className="text-purple-400 flex-shrink-0">•</span>
            <span>{line.replace(/^-\s/, '')}</span>
          </p>
        );
        return <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{line}</p>;
      })}
    </div>
    <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
      <button onClick={onRerun} className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium transition">
        <RefreshCw size={11} /> Re-run for structured output
      </button>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const MastraProjectPanel = ({ projectName, projectLanguage, sessions }: Props) => {
  const { analyzeProject, loadingProject, projectResult, projectRaw, error, clearProject } = useMastraAgent();
  const [expanded, setExpanded] = useState(true);

  const hasResult = !!(projectResult || projectRaw);

  const handleAnalyze = async () => {
    clearProject();
    await analyzeProject({
      projectName,
      projectLanguage,
      sessions: sessions.map(s => ({
        title: s.title,
        status: s.status,
        severity: s.severity,
        error_message: s.error_message,
        ai_analysis: s.ai_analysis
          ? { category: s.ai_analysis.category, root_cause: s.ai_analysis.root_cause }
          : null,
      })),
    });
    setExpanded(true);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-purple-100 dark:border-purple-900 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-purple-50 dark:border-purple-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950 rounded-xl flex items-center justify-center">
            <BarChart2 size={15} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Mastra Project Analysis</h3>
            <p className="text-xs text-gray-400">Project Analyzer Agent · Pattern recognition</p>
          </div>
          <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
            Mastra Cloud
          </span>
        </div>
        {hasResult && (
          <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 transition">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Loading */}
      {loadingProject && (
        <div className="p-10 text-center space-y-3">
          <div className="relative mx-auto w-10 h-10">
            <Loader2 size={40} className="animate-spin text-purple-200 dark:text-purple-900" />
            <BarChart2 size={16} className="text-purple-600 absolute inset-0 m-auto" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Mastra agent analyzing patterns...</p>
          <p className="text-xs text-gray-400">Scanning {sessions.length} sessions for recurring issues and systemic problems</p>
        </div>
      )}

      {/* Error */}
      {error && !loadingProject && (
        <div className="p-6 text-center space-y-3">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={handleAnalyze} className="text-xs text-indigo-600 hover:underline font-medium">Try again</button>
        </div>
      )}

      {/* Ready */}
      {!loadingProject && !hasResult && !error && (
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 rounded-2xl flex items-center justify-center mx-auto">
            <Brain size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-gray-800 dark:text-gray-200 text-sm font-bold mb-1">Mastra Project Analyzer</p>
            <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
              Scans all {sessions.length} sessions to find recurring error patterns, diagnose systemic architecture issues, and generate prioritized recommendations.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><Repeat2 size={11} className="text-indigo-400" /> Pattern detection</span>
            <span className="flex items-center gap-1"><AlertTriangle size={11} className="text-amber-400" /> Systemic issues</span>
            <span className="flex items-center gap-1"><Zap size={11} className="text-purple-400" /> Prioritized fixes</span>
          </div>
          <button
            onClick={handleAnalyze}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition shadow-sm hover:shadow-md"
          >
            <Sparkles size={14} /> Analyze {sessions.length} Sessions
          </button>
        </div>
      )}

      {/* Structured result */}
      {projectResult && !loadingProject && expanded && (
        <StructuredResult data={projectResult} onRerun={handleAnalyze} />
      )}

      {/* Prose fallback */}
      {projectRaw && !loadingProject && expanded && (
        <ProseResult text={projectRaw} onRerun={handleAnalyze} />
      )}

    </div>
  );
};

export default MastraProjectPanel;