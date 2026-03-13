import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Terminal, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) return toast.error('Enter your email address');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

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

          {!sent ? (
            <>
              <div className="text-center mb-7">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={22} className="text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>
                <p className="text-gray-400 text-sm">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="w-full border-2 border-gray-100 focus:border-indigo-400 text-gray-900 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition placeholder-gray-300"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={26} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                We sent a password reset link to
              </p>
              <p className="text-indigo-600 font-semibold text-sm mb-5 break-all">{email}</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-5">
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition font-medium"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;