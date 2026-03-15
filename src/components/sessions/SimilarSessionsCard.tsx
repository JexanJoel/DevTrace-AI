import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { powerSync } from '../../lib/powersync';
import { SeverityBadge } from './StatusBadge';

interface SimilarSession {
  id: string;
  title: string;
  error_message: string;
  status: string;
  severity: string;
  created_at: string;
  match_count: number;
}

interface Props {
  currentSessionId: string;
  errorMessage?: string;
  userId: string;
}

// Extract meaningful tokens from an error message —
// strip punctuation, dedupe, drop common noise words
const extractTokens = (text: string): string[] => {
  const NOISE = new Set([
    'at', 'in', 'of', 'is', 'not', 'the', 'a', 'an', 'to', 'and',
    'or', 'for', 'on', 'with', 'from', 'by', 'this', 'that', 'be',
    'was', 'are', 'has', 'have', 'it', 'its', 'undefined', 'null',
    'error', 'cannot', 'could', 'would', 'should', 'does', 'did',
  ]);

  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 3 && !NOISE.has(t))
  )].slice(0, 8); // max 8 tokens to keep query fast
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

const SimilarSessionsCard = ({ currentSessionId, errorMessage, userId }: Props) => {
  const navigate = useNavigate();
  const [similar, setSimilar] = useState<SimilarSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!errorMessage?.trim()) {
      setLoading(false);
      return;
    }

    const find = async () => {
      setLoading(true);
      try {
        const tokens = extractTokens(errorMessage);
        if (tokens.length === 0) { setLoading(false); return; }

        // Query all other sessions for this user from local SQLite — zero network
        const allSessions = await powerSync.getAll<{
          id: string;
          title: string;
          error_message: string | null;
          status: string;
          severity: string;
          created_at: string;
        }>(
          `SELECT id, title, error_message, status, severity, created_at
           FROM debug_sessions
           WHERE user_id = ? AND id != ? AND error_message IS NOT NULL
           ORDER BY created_at DESC
           LIMIT 100`,
          [userId, currentSessionId]
        );

        // Score each session by how many tokens match its error message
        const scored = allSessions
          .map(s => {
            const haystack = (s.error_message ?? '').toLowerCase();
            const matchCount = tokens.filter(t => haystack.includes(t)).length;
            return { ...s, match_count: matchCount };
          })
          .filter(s => s.match_count >= 2) // at least 2 token matches
          .sort((a, b) => b.match_count - a.match_count)
          .slice(0, 3); // top 3 matches

        setSimilar(scored as SimilarSession[]);
      } catch (err) {
        console.error('SimilarSessionsCard error:', err);
      } finally {
        setLoading(false);
      }
    };

    find();
  }, [currentSessionId, errorMessage, userId]);

  // Don't render anything if loading or no matches
  if (loading || similar.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 sm:p-5 min-w-0">

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-amber-50 dark:bg-amber-950 rounded-xl flex items-center justify-center flex-shrink-0">
          <Lightbulb size={14} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            You've seen this before
          </p>
          <p className="text-xs text-gray-400">
            {similar.length} similar bug{similar.length !== 1 ? 's' : ''} found in your history — queried locally, zero network
          </p>
        </div>
      </div>

      {/* Matches */}
      <div className="space-y-2">
        {similar.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(`/sessions/${s.id}`)}
            className="w-full text-left bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-100 dark:border-amber-900 rounded-xl p-3 transition group"
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                  {s.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate font-mono">
                  {s.error_message.slice(0, 80)}{s.error_message.length > 80 ? '…' : ''}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <SeverityBadge severity={s.severity as any} />
                  {s.status === 'resolved' ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 size={11} /> Resolved
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 capitalize">{s.status.replace('_', ' ')}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={10} /> {timeAgo(s.created_at)}
                  </span>
                  <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                    {s.match_count} keyword{s.match_count !== 1 ? 's' : ''} match
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-amber-500 transition flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        Click any match to see how you handled it before
      </p>
    </div>
  );
};

export default SimilarSessionsCard;