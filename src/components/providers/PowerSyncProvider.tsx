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
    // By the time this renders, auth is guaranteed resolved (ProtectedRoute
    // blocks until loading=false and user is set), so user.id is always real.
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

    return () => { powerSync.disconnect(); };
  }, [user?.id]);

  return (
    <PowerSyncContext.Provider value={powerSync}>
      {children}
    </PowerSyncContext.Provider>
  );
};