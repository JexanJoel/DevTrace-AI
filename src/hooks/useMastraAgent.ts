import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// ── Structured types returned by enhanced prompts ─────────────────────────────

export interface MastraSessionResult {
  root_cause: string;
  plain_english: string;
  confidence: number;
  category: string;
  why_this_happens: string;
  exact_fix: {
    title: string;
    language: string;
    before: string;
    after: string;
    explanation: string;
  };
  alternative_fixes: Array<{
    title: string;
    code: string;
    tradeoff: string;
  }>;
  verification_steps: string[];
  related_risks: string[];
  files_to_check: string[];
}

export interface MastraProjectResult {
  health_verdict: 'excellent' | 'good' | 'needs_attention' | 'critical';
  health_summary: string;
  recurring_patterns: Array<{
    pattern: string;
    frequency: number;
    description: string;
    sessions_affected: string[];
  }>;
  systemic_issues: Array<{
    issue: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    root_architecture_cause: string;
  }>;
  critical_open_issues: Array<{
    title: string;
    why_critical: string;
  }>;
  resolution_insight: string;
  top_recommendations: Array<{
    title: string;
    priority: 'immediate' | 'short_term' | 'long_term';
    action: string;
    expected_impact: string;
  }>;
  category_breakdown: Array<{
    category: string;
    count: number;
    resolved: number;
  }>;
}

// ── Helper ────────────────────────────────────────────────────────────────────

const callMastraEdgeFunction = async (
  action: string,
  payload: Record<string, unknown>
): Promise<{ result: any; isStructured: boolean }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mastra-agent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return { result: data.result, isStructured: data.isStructured ?? false };
};

// ── Hook ──────────────────────────────────────────────────────────────────────

const useMastraAgent = () => {
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);

  // Structured result (when agent returns valid JSON)
  const [sessionResult, setSessionResult] = useState<MastraSessionResult | null>(null);
  const [projectResult, setProjectResult] = useState<MastraProjectResult | null>(null);

  // Raw fallback (when agent returns prose instead of JSON)
  const [sessionRaw, setSessionRaw] = useState<string | null>(null);
  const [projectRaw, setProjectRaw] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // ── Session Debugger ──────────────────────────────────────────────────────
  const debugSession = useCallback(async (params: {
    errorMessage: string;
    stackTrace?: string;
    codeSnippet?: string;
    sessionTitle?: string;
    projectLanguage?: string;
  }) => {
    setLoadingSession(true);
    setError(null);
    setSessionResult(null);
    setSessionRaw(null);

    try {
      const { result, isStructured } = await callMastraEdgeFunction('debugSession', params);
      if (isStructured) {
        setSessionResult(result as MastraSessionResult);
      } else {
        setSessionRaw(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      }
      return result;
    } catch (err: any) {
      setError(err.message ?? 'Mastra agent failed');
      return null;
    } finally {
      setLoadingSession(false);
    }
  }, []);

  // ── Project Analyzer ──────────────────────────────────────────────────────
  const analyzeProject = useCallback(async (params: {
    projectName: string;
    projectLanguage?: string;
    sessions: Array<{
      title: string;
      status: string;
      severity: string;
      error_message?: string;
      ai_analysis?: { category?: string; root_cause?: string } | null;
    }>;
  }) => {
    setLoadingProject(true);
    setError(null);
    setProjectResult(null);
    setProjectRaw(null);

    try {
      const { result, isStructured } = await callMastraEdgeFunction('analyzeProject', params);
      if (isStructured) {
        setProjectResult(result as MastraProjectResult);
      } else {
        setProjectRaw(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      }
      return result;
    } catch (err: any) {
      setError(err.message ?? 'Mastra agent failed');
      return null;
    } finally {
      setLoadingProject(false);
    }
  }, []);

  const clearSession = useCallback(() => { setSessionResult(null); setSessionRaw(null); }, []);
  const clearProject = useCallback(() => { setProjectResult(null); setProjectRaw(null); }, []);

  return {
    debugSession,
    loadingSession,
    sessionResult,
    sessionRaw,
    analyzeProject,
    loadingProject,
    projectResult,
    projectRaw,
    error,
    clearSession,
    clearProject,
  };
};

export default useMastraAgent;