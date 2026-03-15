import { useState, useCallback } from 'react';
import { powerSync } from '../lib/powersync';
import type { AIAnalysis, FixOption } from '../lib/groqClient';

export interface OfflineGuidance {
  confidence: 'high' | 'medium' | 'low';
  matchCount: number;
  likelyCauses: string[];
  bestFixes: FixOption[];
  checklist: string[];
  testIdeas: string[];
  filesToCheck: string[];
  evidenceSessions: { id: string; title: string; matchCount: number }[];
}

// Extract meaningful tokens from an error message (reused/enhanced from SimilarSessionsCard)
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
  )].slice(0, 10);
};

const useOfflineMemory = () => {
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<OfflineGuidance | null>(null);

  const getOfflineGuidance = useCallback(async (errorMessage: string, currentSessionId: string, userId: string) => {
    if (!errorMessage.trim()) return null;
    
    setLoading(true);
    try {
      const tokens = extractTokens(errorMessage);
      if (tokens.length === 0) {
        setLoading(false);
        return null;
      }

      // 1. Retrieval: Find sessions with AI analysis
      // Note: We filter for error_message IS NOT NULL and ai_analysis IS NOT NULL
      const candidates = await powerSync.getAll<any>(
        `SELECT id, title, error_message, ai_analysis
         FROM debug_sessions
         WHERE user_id = ? AND id != ? AND ai_analysis IS NOT NULL
         LIMIT 100`,
        [userId, currentSessionId]
      );

      // 2. Scoring
      const scored = candidates
        .map(s => {
          const haystack = (s.error_message ?? '').toLowerCase();
          const matchCount = tokens.filter(t => haystack.includes(t)).length;
          return { ...s, matchCount };
        })
        .filter(s => s.matchCount >= 2)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 5); // top 5 matches

      if (scored.length === 0) {
        setGuidance(null);
        return null;
      }

      // 3. Knowledge Extraction & Synthesis
      const causesMap = new Map<string, number>();
      const fixesMap = new Map<string, FixOption>();
      const fixesCount = new Map<string, number>();
      const checklistSet = new Set<string>();
      const testsSet = new Set<string>();
      const filesSet = new Set<string>();

      scored.forEach(session => {
        try {
          const analysis: AIAnalysis = typeof session.ai_analysis === 'string' 
            ? JSON.parse(session.ai_analysis) 
            : session.ai_analysis;

          if (analysis.root_cause) {
            const cause = analysis.root_cause.split('.')[0]; // take first sentence
            causesMap.set(cause, (causesMap.get(cause) ?? 0) + 1);
          }

          analysis.fixes?.forEach(f => {
            const key = f.title.toLowerCase();
            if (!fixesMap.has(key)) fixesMap.set(key, f);
            fixesCount.set(key, (fixesCount.get(key) ?? 0) + 1);
          });

          analysis.checklist?.forEach(c => checklistSet.add(c.item));
          analysis.test_cases?.forEach(t => testsSet.add(t));
          analysis.files_to_check?.forEach(f => filesSet.add(f));
        } catch (e) {
          console.warn('Failed to parse ai_analysis for session', session.id);
        }
      });

      // Sort and limit synthesized data
      const sortedCauses = Array.from(causesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cause]) => cause)
        .slice(0, 4);

      const topFixes = Array.from(fixesCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => fixesMap.get(key)!)
        .slice(0, 3);

      const result: OfflineGuidance = {
        confidence: scored[0].matchCount >= 4 ? 'high' : scored.length >= 3 ? 'medium' : 'low',
        matchCount: scored.length,
        likelyCauses: sortedCauses,
        bestFixes: topFixes,
        checklist: Array.from(checklistSet).slice(0, 6),
        testIdeas: Array.from(testsSet).slice(0, 5),
        filesToCheck: Array.from(filesSet).slice(0, 5),
        evidenceSessions: scored.map(s => ({ id: s.id, title: s.title, matchCount: s.matchCount })),
      };

      setGuidance(result);
      return result;
    } catch (err) {
      console.error('getOfflineGuidance error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { guidance, loading, getOfflineGuidance };
};

export default useOfflineMemory;
