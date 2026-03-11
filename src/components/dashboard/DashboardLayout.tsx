import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import DevTraceChatbot from '../shared/DevTraceChatbot';
import SyncQueueIndicator from '../shared/SyncQueueIndicator';
import { useSyncQueue } from '../../store/useSyncQueue';

interface Props {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: Props) => {
  const { user } = useAuthStore();
  const { loadTheme } = useThemeStore();
  const { addItem } = useSyncQueue();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) loadTheme(user.id);
  }, [user]);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 flex flex-1">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Right side */}
      <div className="flex flex-col flex-1 lg:ml-60 min-w-0 min-h-screen">

        <div className="sticky top-0 z-30">
          <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        </div>

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>

      </div>

      {/* DEBUG — remove after testing */}
      <button
        onClick={() => addItem({ id: `test_${Date.now()}`, action: 'create_project', label: 'Test action', status: 'pending' })}
        className="fixed bottom-24 left-5 z-[100] bg-gray-900 text-white px-3 py-2 text-xs rounded-lg shadow">
        Test Queue
      </button>

      {/* Bottom-left: sync queue */}
      <SyncQueueIndicator />

      {/* Bottom-right: chatbot */}
      <DevTraceChatbot />

    </div>
  );
};

export default DashboardLayout;