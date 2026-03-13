import { useState, useEffect } from 'react';
import { Github, Mail, User, Save, Loader2, Shield, Key } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import AvatarUpload from '../components/profile/AvatarUpload';
import useProfile from '../hooks/useProfile';
import { useAuthStore } from '../store/authStore';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();

  const [name, setName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setGithubUsername(profile.github_username || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ name: name.trim(), github_username: githubUsername.trim() });
    setSaving(false);
  };

  const getInitials = () => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    return user?.email?.[0].toUpperCase() ?? 'U';
  };

  const authProvider = (user as any)?.app_metadata?.provider ?? 'email';

  if (loading) return (
    <DashboardLayout title="Profile">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={28} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Profile">
      <div className="space-y-6">

        {/* Hero card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">

          {/* Avatar + name — stacks on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5">
              <div className="flex-shrink-0">
                <AvatarUpload
                  currentUrl={profile?.avatar_url ?? null}
                  initials={getInitials()}
                  onUpload={uploadAvatar}
                />
              </div>
              <div className="hidden sm:block w-px h-16 bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {name || 'Your Name'}
                </h2>
                <p className="text-sm text-gray-400 mt-1 break-all">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center sm:justify-start">
                  <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 px-2.5 py-1 rounded-full font-semibold capitalize">
                    {authProvider}
                  </span>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                    ● Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats — horizontal scroll on mobile, row on desktop */}
            <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-6 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0">
              <div className="text-center flex-shrink-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.created_at
                    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
                    : 0}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">Days active</p>
              </div>
              <div className="w-px h-10 bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
              <div className="text-center flex-shrink-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white capitalize">{authProvider}</p>
                <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">Auth provider</p>
              </div>
              <div className="w-px h-10 bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
              <div className="text-center flex-shrink-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">Member since</p>
              </div>
            </div>

          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Personal Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> Personal Info
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Your full name" value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-2 border-gray-100 dark:border-gray-700 focus:border-indigo-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition placeholder-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={user?.email ?? ''} disabled
                      className="w-full border-2 border-gray-100 dark:border-gray-700 text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-not-allowed" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">GitHub Username</label>
                  <div className="relative">
                    <Github size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="your-github-username" value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="w-full border-2 border-gray-100 dark:border-gray-700 focus:border-indigo-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition placeholder-gray-300" />
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50 text-sm">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Key size={16} className="text-indigo-500" /> Account Info
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Account ID', value: (user?.id?.slice(0, 8) ?? '') + '...' },
                  { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—' },
                  { label: 'Auth provider', value: authProvider },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0 gap-3">
                    <span className="text-xs text-gray-400 flex-shrink-0">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize text-right truncate">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-100 dark:border-green-900 p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">Account Secured</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Protected by Supabase Auth</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;