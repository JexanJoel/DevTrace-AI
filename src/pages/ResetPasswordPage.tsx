import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Terminal, Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends an access_token in the URL hash after the magic link click.
  // We need to wait for onAuthStateChange to fire with SIGNED_IN / PASSWORD_RECOVERY.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true);
      }
    });
    // Also check if session already exists (page refresh case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const strength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6)  return { label: 'Too short', color: 'bg-red-400',    text: 'text-red-500' };
    if (password.length < 10) return { label: 'Fair',      color: 'bg-yellow-400', text: 'text-yellow-600' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
                               return { label: 'Good',      color: 'bg-blue-400',   text: 'text-blue-600' };
    return                            { label: 'Strong',    color: 'bg-green-500',  text: 'text-green-600' };
  })();

  const handleReset = async () => {
    if (password.length < 6)    return toast.error('Password must be at least 6 characters');
    if (password !== confirm)    return toast.error('Passwords do not match');
    if (!sessionReady)           return toast.error('Session not ready — try clicking the link again');

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    }
    setLoading(false);
  };

  if (!sessionReady) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-500 mx-auto mb-3" size={28} />
        <p className="text-gray-400 text-sm">Verifying your reset link...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Terminal size={17} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">DevTrace AI</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {!done ? (
            <>
              <div className="text-center mb-7">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={22} className="text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h1>
                <p className="text-gray-400 text-sm">Choose a strong password for your account</p>
              </div>

              <div className="space-y-4">
                {/* New password */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border-2 border-gray-100 focus:border-indigo-400 text-gray-900 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition placeholder-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {strength && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${strength.color} ${
                          strength.label === 'Too short' ? 'w-1/4' :
                          strength.label === 'Fair'      ? 'w-2/4' :
                          strength.label === 'Good'      ? 'w-3/4' : 'w-full'
                        }`} />
                      </div>
                      <p className={`text-xs mt-1 font-medium ${strength.text}`}>{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                      className={`w-full border-2 focus:border-indigo-400 text-gray-900 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition placeholder-gray-300 ${
                        confirm && confirm !== password
                          ? 'border-red-200 bg-red-50'
                          : confirm && confirm === password
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  disabled={loading || !password || !confirm}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={26} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-gray-400 text-sm">Redirecting you to the dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;