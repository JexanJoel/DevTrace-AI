import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// This page handles the redirect after a user connects GitHub from their profile.
// Supabase returns here with the linked identity — we read the GitHub username
// from the identity data and save it to the profiles table.

const GitHubCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your GitHub account...');

  useEffect(() => {
    const handle = async () => {
      try {
        // Wait for Supabase to process the OAuth tokens from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error('Could not get session');

        // Get the user with their identities
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Could not get user');

        // Find the GitHub identity
        const githubIdentity = user.identities?.find(id => id.provider === 'github');
        if (!githubIdentity) throw new Error('GitHub identity not found');

        // Extract username from identity metadata
        const githubUsername =
          githubIdentity.identity_data?.user_name ??
          githubIdentity.identity_data?.login ??
          githubIdentity.identity_data?.preferred_username ??
          null;

        if (!githubUsername) throw new Error('Could not read GitHub username');

        // Save to profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            github_username: githubUsername,
            github_connected: true,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setStatus('success');
        setMessage(`GitHub connected as @${githubUsername}`);
        toast.success(`GitHub connected as @${githubUsername}!`);
        setTimeout(() => navigate('/profile'), 1800);

      } catch (err: any) {
        console.error('GitHub callback error:', err);
        setStatus('error');
        setMessage(err?.message ?? 'Failed to connect GitHub');
        toast.error('Failed to connect GitHub account');
        setTimeout(() => navigate('/profile'), 2500);
      }
    };

    handle();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
            <p className="text-gray-700 font-semibold">Connecting GitHub...</p>
            <p className="text-gray-400 text-sm mt-1">Just a moment</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={30} className="text-green-500" />
            </div>
            <p className="text-gray-700 font-semibold">{message}</p>
            <p className="text-gray-400 text-sm mt-1">Redirecting to profile...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle size={30} className="text-red-400" />
            </div>
            <p className="text-gray-700 font-semibold">Connection failed</p>
            <p className="text-gray-400 text-sm mt-1">{message}</p>
            <p className="text-gray-400 text-sm mt-1">Redirecting back to profile...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GitHubCallbackPage;