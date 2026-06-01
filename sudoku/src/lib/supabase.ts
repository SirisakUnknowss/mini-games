// =====================================================================
// Supabase client — lazy init, safe if config missing
// =====================================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig: boolean = !!(url && anonKey);

let _supabase: SupabaseClient | null = null;

function makeStubClient(): SupabaseClient {
  // Stub that supports full chaining (.from().select().eq()…) and resolves to
  // { data: null, error } so every caller's try/catch works normally.
  const noConfig = { data: null, error: new Error('Supabase not configured — offline demo mode'), count: null, status: 503, statusText: 'Offline' };

  // A "thenable" stub: awaiting it gives noConfig, calling any method gives another stub
  function makeChain(): any {
    const chain: any = function () { return makeChain(); };
    // Make it awaitable — resolves to noConfig
    chain.then = (res: any, rej: any) => Promise.resolve(noConfig).then(res, rej);
    chain.catch = (fn: any) => Promise.resolve(noConfig).catch(fn);
    // Auth stubs that callers actually check
    chain.data = { user: null, session: null };
    chain.error = null;
    // Proxy any further property access / call to another chain
    return new Proxy(chain, {
      get(t, prop) {
        if (prop in t) return t[prop]; // .then / .catch / .data / .error
        return makeChain();            // .select / .eq / .order / etc.
      },
    });
  }

  return new Proxy({}, {
    get(_t, prop) {
      if (prop === 'auth') {
        // auth.getUser() / auth.onAuthStateChange() etc.
        return new Proxy({}, {
          get(_a, method) {
            if (method === 'onAuthStateChange') {
              return (_cb: any) => ({ data: { subscription: { unsubscribe() {} } } });
            }
            return makeChain();
          },
        });
      }
      return makeChain();
    },
  }) as SupabaseClient;
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
