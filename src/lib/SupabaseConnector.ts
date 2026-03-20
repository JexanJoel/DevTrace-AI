// src/lib/SupabaseConnector.ts
import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  UpdateType,
} from '@powersync/web';
import type { PowerSyncBackendConnector } from '@powersync/web';
import { supabase } from './supabaseClient';

// These errors mean the op is permanently invalid — discard, don't retry.
// NOTE: 42501 (insufficient privilege / RLS denial) is intentionally NOT here.
// If RLS blocks an op, we want it to surface as an error so it's visible,
// not silently swallowed. Fix the missing RLS policy instead.
const FATAL_CODES = [
  /^22...$/,  // Data Exception (bad data type, out of range, etc.)
  /^23...$/,  // Integrity Constraint Violation (duplicate key, FK violation, etc.)
];

const isFatal = (code: string) => FATAL_CODES.some(r => r.test(code));

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error('No Supabase session');
    return {
      endpoint: import.meta.env.VITE_POWERSYNC_URL as string,
      token: session.access_token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    let lastOp: CrudEntry | null = null;
    try {
      for (const op of transaction.crud) {
        lastOp = op;
        await this.applyOperation(op);
      }
      await transaction.complete();
    } catch (error: any) {
      const code = String(error?.code ?? error?.message ?? '');
      if (isFatal(code)) {
        // Permanently bad op — discard so it doesn't block the queue forever
        console.warn('Discarding fatal PowerSync op:', lastOp, error);
        await transaction.complete();
      } else {
        // Transient or auth error — PowerSync will retry automatically
        console.warn('PowerSync upload will retry:', error);
        throw error;
      }
    }
  }

  private async applyOperation(op: CrudEntry) {
    const table = op.table;
    const id = op.id;
    const data = op.opData ?? {};

    switch (op.op) {
      case UpdateType.PUT:
        await supabase.from(table).upsert({ id, ...data }).throwOnError();
        break;
      case UpdateType.PATCH:
        await supabase.from(table).update(data).eq('id', id).throwOnError();
        break;
      case UpdateType.DELETE:
        await supabase.from(table).delete().eq('id', id).throwOnError();
        break;
    }
  }
}