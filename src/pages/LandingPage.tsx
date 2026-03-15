import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal, Bug, Sparkles, BookOpen,
  BarChart2, ArrowRight, Github,
  Share2, Menu, X, Wifi, WifiOff,
  Database, Zap, FolderOpen, Heart
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Sparkles size={22} />,
    title: 'AI Debug Panel — 8 Tabs',
    desc: 'Every bug gets a full breakdown: root cause, 3 fix options with code, crash timeline, interactive checklist, follow-up chat, test cases, log analyzer, and architecture review.',
    color: 'bg-indigo-50 text-indigo-500',
  },
  {
    icon: <WifiOff size={22} />,
    title: 'Fully Offline-First',
    desc: 'All data reads from local SQLite via PowerSync — zero spinners, zero network dependency. Create and browse sessions without internet. Auto-syncs on reconnect.',
    color: 'bg-orange-50 text-orange-500',
  },
  {
    icon: <Bug size={22} />,
    title: 'Session Tracking',
    desc: 'Log errors with stack traces, code snippets, expected behavior, environment, and severity. Every session is permanent, searchable, and never lost.',
    color: 'bg-red-50 text-red-500',
  },
  {
    icon: <BookOpen size={22} />,
    title: 'Fix Library',
    desc: 'Save AI fixes that worked. Filter by language, copy in one click, track usage count. Build a personal knowledge base of solutions across all your projects.',
    color: 'bg-green-50 text-green-500',
  },
  {
    icon: <Share2 size={22} />,
    title: 'Share with Teammates',
    desc: 'Share projects and sessions with other DevTrace users for read-only collaboration. Instant access — no email required, revokable anytime.',
    color: 'bg-purple-50 text-purple-500',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Analytics & Insights',
    desc: 'Project health scores, session streaks, resolution rates, AI confidence trends, and error patterns — all computed locally from your SQLite data.',
    color: 'bg-blue-50 text-blue-500',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Log the bug',
    desc: 'Paste your error, stack trace, and code snippet. Tag the severity and environment. Saved instantly — even offline.',
  },
  {
    step: '02',
    title: 'Get full AI analysis',
    desc: 'Groq + Llama 3.3 70B returns root cause, 3 fix options with code, a crash timeline, and an interactive checklist. Saved as JSONB — no re-analyzing needed.',
  },
  {
    step: '03',
    title: 'Save, share, and ship',
    desc: 'Save the fix to your library. Share the session with a teammate. Mark it resolved. Your debugging history lives forever.',
  },
];

const TECH = [
  { label: 'PowerSync', sub: 'Offline SQLite sync', color: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  { label: 'Supabase', sub: 'Postgres + Auth + RLS', color: 'border-green-200 bg-green-50 text-green-700' },
  { label: 'Groq', sub: 'Llama 3.3 70B', color: 'border-orange-200 bg-orange-50 text-orange-700' },
  { label: 'React 18', sub: 'TypeScript + Vite', color: 'border-blue-200 bg-blue-50 text-blue-700' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Terminal size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">DevTrace AI</span>
            <span className="hidden sm:inline text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">Open Source</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="https://github.com/JexanJoel/DevTrace-AI" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition px-3 py-2">
              <Github size={16} /> GitHub
            </a>
            <button onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition px-3 py-2">
              Sign in
            </button>
            <button onClick={() => navigate('/register')}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition">
              Get started free
            </button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
            <a href="https://github.com/JexanJoel/DevTrace-AI" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2.5 rounded-xl hover:bg-gray-50">
              <Github size={16} /> GitHub
            </a>
            <button onClick={() => { navigate('/login'); setMenuOpen(false); }}
              className="w-full text-left text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2.5 rounded-xl hover:bg-gray-50">
              Sign in
            </button>
            <button onClick={() => { navigate('/register'); setMenuOpen(false); }}
              className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-xl transition">
              Get started free
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-white to-white pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 sm:w-[600px] h-64 sm:h-[600px] bg-indigo-200 opacity-20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <Sparkles size={12} /> Groq + Llama 3.3 70B
            </span>
            <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <WifiOff size={12} /> Works offline
            </span>
            <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <Database size={12} /> Powered by PowerSync + Supabase
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-5 sm:mb-6">
            Your permanent<br />
            <span className="text-indigo-600">debugging memory.</span>
          </h1>

          <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            Log bugs, get full AI analysis, save fixes, share with teammates.
            <br className="hidden sm:block" />
            Everything persists. Everything syncs. Everything works — even offline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl transition text-base shadow-lg shadow-indigo-200">
              Start debugging free <ArrowRight size={18} />
            </button>
            <a href="https://github.com/JexanJoel/DevTrace-AI" target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-semibold px-8 py-3.5 rounded-xl transition text-base">
              <Github size={18} /> View on GitHub
            </a>
          </div>

          <p className="text-sm text-gray-400 mt-4">Free forever · No credit card · Open source</p>
        </div>

        {/* Hero code card */}
        <div className="relative max-w-2xl mx-auto mt-12 sm:mt-16 px-2 sm:px-0">
          <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-gray-500 text-xs font-mono">devtrace · session #42</span>
              <span className="ml-auto flex items-center gap-1 text-xs text-orange-400 font-mono">
                <WifiOff size={10} /> offline
              </span>
            </div>
            <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm space-y-3 text-left">
              <div className="flex items-start gap-3">
                <span className="text-red-400 flex-shrink-0">✗</span>
                <div>
                  <p className="text-red-300">TypeError: Cannot read properties of undefined</p>
                  <p className="text-gray-500 text-xs mt-0.5">at ProductList.jsx:45 · severity: high</p>
                </div>
              </div>
              <div className="border-t border-gray-800 pt-3 flex items-start gap-3">
                <span className="text-indigo-400 flex-shrink-0">⚡</span>
                <div>
                  <p className="text-indigo-300">AI Analysis · 92% confidence · 8 tabs</p>
                  <p className="text-gray-400 text-xs mt-1">Root cause · 3 fixes · Timeline · Checklist · Chat · Tests</p>
                </div>
              </div>
              <div className="border-t border-gray-800 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <p className="text-green-300">Resolved · saved to Fix Library</p>
                </div>
                <span className="text-xs text-gray-500 font-mono">synced offline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack trust bar */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-gray-400 font-medium uppercase tracking-widest mb-5">Built on</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {TECH.map((t, i) => (
              <div key={i} className={`flex flex-col items-center px-5 py-3 rounded-xl border ${t.color} min-w-[100px]`}>
                <span className="font-bold text-sm">{t.label}</span>
                <span className="text-xs opacity-70 mt-0.5">{t.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offline callout */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
              <div className="flex-shrink-0 w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <WifiOff size={26} className="text-orange-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Works completely offline
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
                  Powered by <strong>PowerSync</strong> — all your data syncs to a local SQLite database in the browser.
                  Every read is instant. Every session you create offline is queued and synced automatically when you reconnect.
                  No spinners. No "you're offline" dead ends.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-orange-700 bg-white border border-orange-200 px-3 py-1.5 rounded-lg">
                    <Wifi size={13} /> Instant reads from local SQLite
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-700 bg-white border border-orange-200 px-3 py-1.5 rounded-lg">
                    <WifiOff size={13} /> Create sessions offline
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-700 bg-white border border-orange-200 px-3 py-1.5 rounded-lg">
                    <Zap size={13} /> Auto-sync on reconnect
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to debug seriously
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              Not just a fix generator — a complete debugging assistant
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:border-indigo-200 hover:shadow-md transition">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 ${f.color} rounded-2xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-400 text-base sm:text-lg">From error to fix in under 30 seconds</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 sm:mb-4 shadow-lg shadow-indigo-200">
                  <span className="text-white font-bold text-lg">{s.step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 sm:mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supabase + PowerSync section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Built on the best open infrastructure
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
              No custom backend. No ops burden. Just great tools doing what they do best.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Supabase */}
            <div className="bg-white rounded-2xl border border-green-100 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Database size={18} className="text-green-600" />
                </div>
                <span className="font-bold text-gray-900">Supabase</span>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Postgres with RLS on every table</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Email, GitHub & Google OAuth</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Magic link password reset</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Storage for avatars</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> WAL replication to PowerSync</li>
              </ul>
            </div>

            {/* PowerSync */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap size={18} className="text-indigo-600" />
                </div>
                <span className="font-bold text-gray-900">PowerSync</span>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Local SQLite in the browser</li>
                <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> All reads are instant — 0ms</li>
                <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Real-time sync via WAL stream</li>
                <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Offline write queue</li>
                <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Auto-sync on reconnect</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <Terminal size={22} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Stop Googling the same bug twice
            </h2>
            <p className="text-indigo-200 text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
              Free forever. Open source. Works offline.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button onClick={() => navigate('/register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-indigo-600 font-bold px-8 py-3.5 rounded-xl transition shadow-lg">
                Get started free <ArrowRight size={18} />
              </button>
              <a href="https://github.com/JexanJoel/DevTrace-AI" target="_blank" rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-semibold px-8 py-3.5 rounded-xl transition">
                <Github size={18} /> View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Terminal size={11} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">DevTrace AI</span>
            <span className="text-gray-400 text-sm">· Open Source</span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm text-center flex items-center gap-1">
            Built with <Heart size={11} className="text-red-400" /> for the PowerSync AI Hackathon 2026
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <a href="https://github.com/JexanJoel/DevTrace-AI" target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-700 transition flex items-center gap-1">
              <Github size={13} /> GitHub
            </a>
            <span>·</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;