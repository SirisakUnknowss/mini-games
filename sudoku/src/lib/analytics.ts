// =====================================================================
// Analytics (PostHog) + Error tracking (Sentry)
// Both are no-op if env keys missing — safe to use anywhere.
// =====================================================================
import posthog from 'posthog-js';
import * as Sentry from '@sentry/browser';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const APP_ENV = (import.meta.env.VITE_APP_ENV as string) || 'local';
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || 'dev';

let posthogReady = false;

export function initAnalytics(): void {
  // PostHog
  if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
      loaded: () => { posthogReady = true; },
    });
    console.info('[Analytics] PostHog initialized');
  }

  // Sentry
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: APP_ENV,
      release: APP_VERSION,
      tracesSampleRate: APP_ENV === 'production' ? 0.1 : 1.0,
      integrations: [Sentry.browserTracingIntegration()],
    });
    console.info('[Analytics] Sentry initialized');
  }
}

// =====================================================================
// PostHog API
// =====================================================================

export function track(event: string, props?: Record<string, unknown>): void {
  if (!POSTHOG_KEY) {
    if (APP_ENV === 'local') console.debug('[track]', event, props);
    return;
  }
  posthog.capture(event, props);
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, traits);
  // Also tag Sentry
  if (SENTRY_DSN) Sentry.setUser({ id: userId });
}

export function resetUser(): void {
  if (POSTHOG_KEY) posthog.reset();
  if (SENTRY_DSN) Sentry.setUser(null);
}

// =====================================================================
// Sentry API
// =====================================================================

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (APP_ENV === 'local') console.error('[error]', err, context);
  if (!SENTRY_DSN) return;
  Sentry.captureException(err, { extra: context });
}

export function setTag(key: string, value: string): void {
  if (SENTRY_DSN) Sentry.setTag(key, value);
  if (POSTHOG_KEY && posthogReady) posthog.register({ [key]: value });
}

// =====================================================================
// Common event types — typed for consistency
// =====================================================================

export const Events = {
  // Lifecycle
  APP_OPEN: 'app_open',
  APP_CLOSE: 'app_close',

  // Auth
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  ANONYMOUS_UPGRADED: 'anonymous_upgraded',

  // Daily
  DAILY_PUZZLE_STARTED: 'daily_puzzle_started',
  DAILY_PUZZLE_COMPLETED: 'daily_puzzle_completed',
  DAILY_PUZZLE_ABANDONED: 'daily_puzzle_abandoned',

  // Practice
  PRACTICE_STARTED: 'practice_started',
  PRACTICE_COMPLETED: 'practice_completed',

  // Streak
  STREAK_MILESTONE: 'streak_milestone',
  STREAK_LOST: 'streak_lost',

  // Misc
  SHARE_RESULT: 'share_result',
  ERROR: 'error_caught',
  MIGRATION_V1: 'migration_v1',
} as const;
