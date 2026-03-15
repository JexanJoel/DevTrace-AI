import { useState } from 'react';
import { 
  WifiOff, Lightbulb, ChevronRight, CheckCircle2, 
  FlaskConical, ClipboardList, Info,
  ChevronDown, ChevronUp, Library
} from 'lucide-react';
import type { OfflineGuidance } from '../../hooks/useOfflineMemory';

interface Props {
  guidance: OfflineGuidance;
  onViewSession: (id: string) => void;
  onReconnect?: () => void;
}

const OfflineAssistCard = ({ guidance, onViewSession, onReconnect }: Props) => {
  const [expandedFix, setExpandedFix] = useState<number | null>(null);

  const confidenceColor = 
    guidance.confidence === 'high' ? 'text-green-500 bg-green-50 border-green-100' : 
    guidance.confidence === 'medium' ? 'text-amber-500 bg-amber-50 border-amber-100' : 
    'text-gray-500 bg-gray-50 border-gray-100';

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Main Header / Banner */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <WifiOff size={24} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Offline AI Memory Assist</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${confidenceColor}`}>
                {guidance.confidence} Confidence
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              Based on <span className="font-semibold text-amber-700 dark:text-amber-400">{guidance.matchCount} similar past sessions</span> in your local history. 
              This is a synthesized suggestion, not a fresh model analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Likely Causes */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-amber-500" />
          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Likely Root Causes</h4>
        </div>
        <div className="space-y-2">
          {guidance.likelyCauses.map((cause, i) => (
            <div key={i} className="flex gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <div className="w-5 h-5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{cause}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Best Previous Fixes */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-amber-500" />
          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Best Past Fixes</h4>
        </div>
        <div className="space-y-3">
          {guidance.bestFixes.map((fix, i) => (
            <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              <button 
                onClick={() => setExpandedFix(expandedFix === i ? null : i)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{fix.title}</span>
                </div>
                {expandedFix === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expandedFix === i && (
                <div className="p-3 pt-0 space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">{fix.explanation}</p>
                  <pre className="bg-gray-900 rounded-lg p-3 text-[10px] text-gray-300 overflow-x-auto font-mono">
                    {fix.code}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Checklist */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
           <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={16} className="text-amber-500" />
            <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Combined Checklist</h4>
          </div>
          <div className="space-y-2">
            {guidance.checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tests & Files */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
           <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={16} className="text-amber-500" />
            <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Test Ideas</h4>
          </div>
          <div className="space-y-2">
            {guidance.testIdeas.map((test, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{test}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Sessions */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-amber-500" />
          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Based on previous records</h4>
        </div>
        <div className="space-y-2">
          {guidance.evidenceSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onViewSession(s.id)}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl hover:shadow-sm border border-gray-100 dark:border-gray-800 transition group text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 transition">{s.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium border border-amber-100 dark:border-amber-900/50">
                    {s.matchCount} token match
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-600 transition" />
            </button>
          ))}
        </div>
      </div>

      {/* Reconnect Banner */}
      <div className="text-center p-4">
        <p className="text-xs text-gray-400">
          Fresh AI analysis is currently unavailable offline.{' '}
          <button 
            onClick={onReconnect}
            className="text-indigo-600 font-semibold hover:underline"
          >
            Reconnect to sync and re-analyze.
          </button>
        </p>
      </div>

    </div>
  );
};

// Reusable History Component needed for the History icon
const History = ({ size = 16, className = "" }) => (
  <Library size={size} className={className} />
);

export default OfflineAssistCard;
