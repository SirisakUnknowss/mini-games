// =====================================================================
// Auth — Supabase wrapper
// See docs/02-technical/auth.md
// =====================================================================
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthResult {
  ok: boolean;
  user?: User;
  error?: string;
}

/** Sign in anonymously (auto-create user with UUID, no email) */
export async function signInAnonymously(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) return { ok: false, error: error?.message ?? 'Unknown error' };
  return { ok: true, user: data.user };
}

/** Sign up with email + password */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) return { ok: false, error: error?.message };
  return { ok: true, user: data.user };
}

/** Sign in with email + password */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: error?.message };
  return { ok: true, user: data.user };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Ensure user is signed in — create anonymous if not */
export async function ensureUser(): Promise<User | null> {
  const existing = await getCurrentUser();
  if (existing) return existing;
  const { user } = await signInAnonymously();
  return user ?? null;
}

/** Subscribe to auth state changes */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}
