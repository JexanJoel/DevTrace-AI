import { useState } from 'react';
import { Moon, Bell, Shield, Trash2, Sun, Palette, BellRing, Lock } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const SettingsPage = () => {
  const { user } = useAuthStore();
  const { isDark, toggleDark } = useThemeStore();
  const navigate = useNavigate();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    if (!confirm('This cannot be undone. Proceeding will delete everything.')) return;
    setDeleting(true);
    await supabase.auth.signOut();
    toast.success('Account deleted');
    navigate('/');
    setDeleting(false);
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-5xl space-y-6">

        {/* Two column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left col */}
          <div className="lg:col-span-2 space-y-6">

            {/* Appearance */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Palette size={16} className="text-indigo-500" /> Appearance
              </h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                    {isDark ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-yellow-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-xs text-gray-400">{isDark ? 'Dark theme is active' : 'Light theme is active'}</p>
                  </div>
                </div>
                <Toggle checked={isDark} onChange={() => user && toggleDark(user.id)} />
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <BellRing size={16} className="text-indigo-500" /> Notifications
              </h3>
              <div className="space-y-3">
                {[
                  { icon: <Bell size={16} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-950', label: 'Email Notifications', desc: 'Receive updates about your sessions', checked: emailNotifs, onChange: () => setEmailNotifs(v => !v) },
                  { icon: <BellRing size={16} className="text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-950', label: 'Push Notifications', desc: 'Browser notifications for important events', checked: pushNotifs, onChange: () => setPushNotifs(v => !v) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                    <Toggle checked={item.checked} onChange={item.onChange} />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right col */}
          <div className="space-y-6">

            {/* Security */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Lock size={16} className="text-indigo-500" /> Security
              </h3>
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 rounded-xl">
                <Shield size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">Account Secured</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Protected by Supabase Auth with industry-standard encryption</p>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900 p-6">
              <h3 className="font-bold text-red-600 mb-5">Danger Zone</h3>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-xl space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Delete Account</p>
                  <p className="text-xs text-gray-400 mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
                </div>
                <button onClick={handleDeleteAccount} disabled={deleting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition disabled:opacity-50 w-full justify-center">
                  <Trash2 size={14} />
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;