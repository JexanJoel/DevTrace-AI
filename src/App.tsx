import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabaseClient';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { PowerSyncProvider } from './components/providers/PowerSyncProvider';
import OfflineBanner from './components/shared/OfflineBanner';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GitHubCallbackPage from './pages/GitHubCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SessionsPage from './pages/SessionsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import FixLibraryPage from './pages/FixLibraryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AIInsightsPage from './pages/AIInsightsPage';
import SyncStatusPage from './pages/SyncStatusPage';
import SharedWithMePage from './pages/SharedWithMePage';
import SharedProjectView from './pages/SharedProjectView';
import SharedSessionView from './pages/SharedSessionView';
import DebugDNAPage from './pages/DebugDNAPage';

// ── Wrap protected pages with PowerSync ───────────────────────────────────────
// PowerSyncProvider must render AFTER auth is confirmed so useQuery hooks
// never fire with uid=''. Wrapping here ensures PowerSync only inits for
// authenticated users, with the real user.id already in the store.
const AuthenticatedApp = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <PowerSyncProvider>
      {children}
    </PowerSyncProvider>
  </ProtectedRoute>
);

const App = () => {
  const { setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user as any ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user as any ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <OfflineBanner />
        <div className="flex-1">
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: { background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' },
          }} />
          <Routes>
            {/* Public — no PowerSync needed */}
            <Route path="/"                element={<LandingPage />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
            <Route path="/auth/callback"   element={<GitHubCallbackPage />} />

            {/* Protected — PowerSync wraps each page individually */}
            <Route path="/dashboard"          element={<AuthenticatedApp><DashboardPage /></AuthenticatedApp>} />
            <Route path="/profile"            element={<AuthenticatedApp><ProfilePage /></AuthenticatedApp>} />
            <Route path="/settings"           element={<AuthenticatedApp><SettingsPage /></AuthenticatedApp>} />
            <Route path="/projects"           element={<AuthenticatedApp><ProjectsPage /></AuthenticatedApp>} />
            <Route path="/projects/:id"       element={<AuthenticatedApp><ProjectDetailPage /></AuthenticatedApp>} />
            <Route path="/sessions"           element={<AuthenticatedApp><SessionsPage /></AuthenticatedApp>} />
            <Route path="/sessions/:id"       element={<AuthenticatedApp><SessionDetailPage /></AuthenticatedApp>} />
            <Route path="/fixes"              element={<AuthenticatedApp><FixLibraryPage /></AuthenticatedApp>} />
            <Route path="/analytics"          element={<AuthenticatedApp><AnalyticsPage /></AuthenticatedApp>} />
            <Route path="/ai-insights"        element={<AuthenticatedApp><AIInsightsPage /></AuthenticatedApp>} />
            <Route path="/debug-dna"          element={<AuthenticatedApp><DebugDNAPage /></AuthenticatedApp>} />
            <Route path="/sync-status"        element={<AuthenticatedApp><SyncStatusPage /></AuthenticatedApp>} />
            <Route path="/shared"             element={<AuthenticatedApp><SharedWithMePage /></AuthenticatedApp>} />
            <Route path="/shared/project/:id" element={<AuthenticatedApp><SharedProjectView /></AuthenticatedApp>} />
            <Route path="/shared/session/:id" element={<AuthenticatedApp><SharedSessionView /></AuthenticatedApp>} />
            <Route path="*"                   element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;