import { useState, useEffect } from 'react';
import { X, Share2, Loader2, Trash2, UserCheck, Mail, Users } from 'lucide-react';
import useShares from '../../hooks/useShares';
import type { Share } from '../../hooks/useShares';

interface Props {
  resourceType: 'project' | 'session';
  resourceId: string;
  resourceName: string;
  onClose: () => void;
}

const ShareModal = ({ resourceType, resourceId, resourceName, onClose }: Props) => {
  const { createShare, revokeShare, getSharesForResource } = useShares();

  const [email, setEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [existingShares, setExistingShares] = useState<Share[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, [resourceId]);

  const loadShares = async () => {
    setLoadingShares(true);
    const shares = await getSharesForResource(resourceType, resourceId);
    setExistingShares(shares);
    setLoadingShares(false);
  };

  const handleShare = async () => {
    if (!email.trim()) return;
    setSharing(true);
    const ok = await createShare(resourceType, resourceId, email.trim());
    if (ok) {
      setEmail('');
      await loadShares();
    }
    setSharing(false);
  };

  const handleRevoke = async (shareId: string) => {
    setRevoking(shareId);
    const ok = await revokeShare(shareId);
    if (ok) setExistingShares(prev => prev.filter(s => s.id !== shareId));
    setRevoking(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center">
              <Share2 size={15} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Share {resourceType}</p>
              <p className="text-xs text-gray-400 truncate max-w-[220px]">{resourceName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Info banner */}
          <div className="flex items-start gap-2.5 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-xl border border-indigo-100 dark:border-indigo-900">
            <UserCheck size={15} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Invited users get <strong>read-only</strong> access. They must have an existing DevTrace AI account.
              {resourceType === 'project' && ' They will see all debug sessions inside this project.'}
            </p>
          </div>

          {/* Email input */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Invite by email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="their@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleShare()}
                  className="w-full border-2 border-gray-100 dark:border-gray-700 focus:border-indigo-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition placeholder-gray-300"
                />
              </div>
              <button
                onClick={handleShare}
                disabled={sharing || !email.trim()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-40 flex-shrink-0"
              >
                {sharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>

          {/* Existing shares */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Shared with ({existingShares.length})
              </p>
            </div>

            {loadingShares ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-gray-400" />
              </div>
            ) : existingShares.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Users size={18} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Not shared with anyone yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingShares.map(share => (
                  <div key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {(share.invitee_name || share.invitee_email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        {share.invitee_name && share.invitee_name !== share.invitee_email && (
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{share.invitee_name}</p>
                        )}
                        <p className="text-xs text-gray-400 truncate">{share.invitee_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-lg">
                        Read only
                      </span>
                      <button
                        onClick={() => handleRevoke(share.id)}
                        disabled={revoking === share.id}
                        className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 flex items-center justify-center text-gray-400 hover:text-red-500 transition"
                        title="Revoke access"
                      >
                        {revoking === share.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;