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
  // redirectTo must point to the deployed origin so email confirmation
  // links don't send the user back to localhost.
  // BASE_URL = '/mini-games/' on GitHub Pages, '/' in local dev.
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
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

/**
 * Upgrade an anonymous account to an email+password account.
 * Keeps the same user_id so all progress, coins, streak persist.
 */
export async function upgradeAnonymousToEmail(email: string, password: string): Promise<AuthResult> {
  const { data: { user: current } } = await supabase.auth.getUser();
  if (!current) return { ok: false, error: 'Not signed in' };
  if (!current.is_anonymous) return { ok: false, error: 'Already has an email account' };

  // First link the email
  const { data: emailUpdate, error: emailErr } = await supabase.auth.updateUser({ email });
  if (emailErr) return { ok: false, error: emailErr.message };
  // Then set the password
  const { data: pwUpdate, error: pwErr } = await supabase.auth.updateUser({ password });
  if (pwErr) return { ok: false, error: pwErr.message };

  // Mark profile as no longer anonymous
  await supabase.from('profiles').update({ is_anonymous: false }).eq('id', current.id);

  return { ok: true, user: pwUpdate.user ?? emailUpdate.user ?? current };
}

/** True if the current user is anonymous (no email linked yet) */
export async function isAnonymous(): Promise<boolean> {
  const u = await getCurrentUser();
  return !!u?.is_anonymous;
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
