// src/components/providers/PowerSyncProvider.tsx
import { useEffect } from 'react';
import { PowerSyncContext } from '@powersync/react';
import { powerSync } from '../../lib/powersync';
import { SupabaseConnector } from '../../lib/SupabaseConnector';
import { useAuthStore } from '../../store/authStore';
import type { ReactNode } from 'react';

interface Props { children: ReactNode; }

export const PowerSyncProvider = ({ children }: Props) => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const connector = new SupabaseConnector();

    const init = async () => {
      try {
        await powerSync.init();
        powerSync.connect(connector).catch(() => {
          console.log('PowerSync connect failed — offline mode');
        });
      } catch (e) {
        console.error('PowerSync init error:', e);
      }
    };

    init();

    return () => {
      powerSync.disconnect();
    };
  }, [user]);

  // ── FIX: Always wrap with PowerSyncContext.Provider ──────────────────────
  // Previously, children were rendered WITHOUT the context until initialized,
  // then moved INSIDE it — causing a full remount. During that remount,
  // useQuery fired with uid='' and returned 0 results, which stuck.
  // Now we always provide the context so there's no remount at all.
  return (
    <PowerSyncContext.Provider value={powerSync}>
      {children}
    </PowerSyncContext.Provider>
  );
};