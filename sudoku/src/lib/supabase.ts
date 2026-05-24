// =====================================================================
// Supabase client — lazy init, safe if config missing
// =====================================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig: boolean = !!(url && anonKey);

let _supabase: SupabaseClient | null = null;

function makeStubClient(): SupabaseClient {
  // Stub that fails gracefully — every method returns a rejected promise
  // so callers can handle the missing-config case.
  const err = new Error('Supabase not configured');
  const stubMethod = () => Promise.reject(err);
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return undefined; // not a thenable
      return new Proxy(stubMethod, handler);
    },
    apply() {
      return Promise.reject(err);
    },
  };
  return new Proxy({}, handler) as SupabaseClient;
}

export const supabase: SupabaseClient = hasSupabaseConfig
  ? (_supabase = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }))
  : makeStubClient();

if (!hasSupabaseConfig) {
  console.warn('[Supabase] No VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — running in offline demo mode');
}

export function getSupabase(): SupabaseClient | null {
  return _supabase;
}
