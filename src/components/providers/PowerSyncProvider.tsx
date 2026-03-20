// src/components/providers/PowerSyncProvider.tsx
import { useEffect, useState } from 'react';
import { PowerSyncContext } from '@powersync/react';
import { powerSync } from '../../lib/powersync';
import { SupabaseConnector } from '../../lib/SupabaseConnector';
import { useAuthStore } from '../../store/authStore';
import type { ReactNode } from 'react';

interface Props { children: ReactNode; }

export const PowerSyncProvider = ({ children }: Props) => {
  const { user, loading: authLoading } = useAuthStore();
  const [psReady, setPsReady] = useState(false);

  useEffect(() => {
    // ── FIX: Don't init until Supabase auth has fully resolved ────────────
    // On first render, user=null because getSession() is async.
    // If we init PowerSync before auth resolves, useQuery fires with
    // uid='' → returns [] → React caches the empty result → projects = 0 forever.
    // Waiting for authLoading=false ensures user.id is real before any query runs.
    if (authLoading) return;

    const connector = new SupabaseConnector();

    const init = async () => {
      try {
        await powerSync.init();
        if (user) {
          powerSync.connect(connector).catch(() => {
            console.log('PowerSync connect failed — offline mode');
          });
        }
      } catch (e) {
        console.error('PowerSync init error:', e);
      } finally {
        setPsReady(true);
      }
    };

    init();

    return () => {
      if (user) powerSync.disconnect();
    };
  }, [authLoading, user?.id]);

  // Block rendering until auth + powersync are both ready
  // so useQuery never fires with an empty uid
  if (authLoading || !psReady) return null;

  return (
    <PowerSyncContext.Provider value={powerSync}>
      {children}
    </PowerSyncContext.Provider>
  );
};