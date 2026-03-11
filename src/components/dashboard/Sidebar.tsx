import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Bug, BookOpen,
  User, Settings, Terminal, LogOut, BarChart2, X,
  Clock, Loader2, CheckCircle2, AlertCircle, ChevronUp, ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useSyncQueue } from '../../store/useSyncQueue';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

const NAV = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/projects',  icon: <FolderOpen size={18} />,      label: 'Projects' },
  { to: '/sessions',  icon: <Bug size={18} />,              label: 'Debug Sessions' },
  { to: '/fixes',     icon: <BookOpen size={18} />,         label: 'Fix Library' },
  { to: '/analytics', icon: <BarChart2 size={18} />,        label: 'Analytics' },
];

const BOTTOM_NAV = [
  { to: '/profile',  icon: <User size={18} />,     label: 'Profile' },
  { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
];

interface Props { onClose?: () => void; }

// Mini queue badge shown inside sidebar
const SidebarQueueBadge = () => {
  const { items, clearDone } = useSyncQueue();
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  const pending = items.filter(i => i.status === 'pending');
  const syncing = items.filter(i => i.status === 'syncing');
  const done    = items.filter(i => i.status === 'done');
  const errored = items.filter(i => i.status === 'error');
  const total      = items.length;
  const activeCount = pending.length + syncing.length;

  useEffect(() => {
    if (total > 0) setVisible(true);
    if (total > 0 && activeCount === 0 && errored.length === 0) {
      const t = setTimeout(() => {
        setVisible(false);
        clearDone();
        setExpanded(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [total, activeCount, errored.length]);

  if (!visible || total === 0) return null;

  const isSyncing  = syncing.length > 0;
  const allDone    = activeCount === 0 && errored.length === 0 && done.length > 0;
  const hasErrors  = errored.length > 0;
  const hasPending = pending.length > 0 && !isSyncing;

  const label =
    isSyncing  ? `Syncing ${syncing.length + pending.length} change${syncing.length + pending.length !== 1 ? 's' : ''}...` :
    allDone    ? 'All changes synced' :
    hasPending ? `${pending.length} change${pending.length !== 1 ? 's' : ''} pending` :
                 `${errored.length} failed`;

  const color =
    hasErrors  ? 'bg-red-500' :
    isSyncing  ? 'bg-indigo-600' :
    allDone    ? 'bg-emerald-500' :
                 'bg-orange-500';

  const Icon =
    isSyncing  ? <Loader2 size={11} className="animate-spin flex-shrink-0" /> :
    allDone    ? <CheckCircle2 size={11} className="flex-shrink-0" /> :
    hasPending ? <Clock size={11} className="flex-shrink-0" /> :
                 <AlertCircle size={11} className="flex-shrink-0" />;

  return (
    <div className="mb-1">
      {/* Expanded detail */}
      {expanded && (
        <div className="mb-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="max-h-36 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                {item.status === 'pending'  && <Clock        size={11} className="text-orange-400 flex-shrink-0" />}
                {item.status === 'syncing'  && <Loader2      size={11} className="text-indigo-500 animate-spin flex-shrink-0" />}
                {item.status === 'done'     && <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />}
                {item.status === 'error'    && <AlertCircle  size={11} className="text-red-500 flex-shrink-0" />}
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pill */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold ${color} transition`}>
        {Icon}
        <span className="flex-1 text-left truncate">{label}</span>
        {expanded ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
      </button>
    </div>
  );
};

const Sidebar = ({ onClose }: Props) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
    }`;

  return (
    <aside className="w-60 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">

      {/* Logo */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Terminal size={15} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">DevTrace AI</p>
            <p className="text-xs text-gray-400">Debug smarter</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — queue badge + profile + signout */}
      <div className="flex-shrink-0 p-3 pb-5 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <SidebarQueueBadge />
        {BOTTOM_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
            {item.icon} {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition">
          <LogOut size={18} /> Sign Out
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;