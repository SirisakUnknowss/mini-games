# 📊 Monitoring & Analytics

## 🎯 Goals

1. Track product metrics (DAU, retention, funnel)
2. Catch errors fast
3. Performance monitoring
4. Anti-cheat alerts

---

## 🔍 Analytics: PostHog

### Setup

```ts
// src/lib/analytics.ts
import posthog from 'posthog-js';

if (import.meta.env.PROD) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
    autocapture: false,  // we'll send specific events
    capture_pageview: true,
    persistence: 'localStorage',
  });
}

export function track(event: string, props?: object) {
  if (import.meta.env.PROD) {
    posthog.capture(event, props);
  } else {
    console.log('[Analytics]', event, props);
  }
}
```

### Events to Track

#### Lifecycle
- `app_open` — props: `{ first_open, days_since_last }`
- `app_close`
- `app_install`

#### Auth
- `sign_up` — props: `{ method }` (email, google, apple, anonymous)
- `sign_in`
- `sign_out`
- `anonymous_upgraded`

#### Onboarding
- `onboarding_started`
- `onboarding_step_completed` — props: `{ step }`
- `onboarding_completed`
- `onboarding_skipped`

#### Daily Puzzle
- `daily_puzzle_started` — props: `{ date, difficulty }`
- `daily_puzzle_completed` — props: `{ date, time, mistakes, hints, score, rank }`
- `daily_puzzle_abandoned` — props: `{ progress_pct, time_elapsed }`

#### Practice
- `practice_started` — props: `{ level, stage }`
- `practice_completed` — props: same shape

#### Quest
- `quest_started` — props: `{ quest_id }`
- `quest_completed` — props: `{ quest_id }`
- `quest_claimed` — props: `{ quest_id, reward }`
- `quest_bonus_claimed`

#### Streak
- `streak_milestone` — props: `{ days }`
- `streak_lost`
- `streak_freeze_used`
- `streak_freeze_purchased`

#### Progression
- `level_up` — props: `{ from, to }`
- `achievement_unlocked` — props: `{ achievement_id, tier }`

#### Shop
- `shop_viewed`
- `item_previewed` — props: `{ item_id }`
- `item_purchased` — props: `{ item_id, category, price }`
- `item_equipped` — props: `{ item_id }`

#### Social
- `result_shared` — props: `{ method }` (clipboard, native, image)
- `leaderboard_viewed` — props: `{ date, tab }`

#### Errors
- `error_caught` — props: `{ message, stack }`

### Funnels

PostHog dashboard → setup funnels:

1. **Activation:** `app_open` → `onboarding_completed` → `daily_puzzle_completed`
2. **Day-7 retention:** `app_open` (day 0) → ... → `app_open` (day 7)
3. **Monetization (Phase 2+):** `shop_viewed` → `item_previewed` → `item_purchased`

### Cohorts
- New users this week
- Streak 7+ days
- High spenders
- At risk (no daily for 3 days)

---

## 🐛 Error Tracking: Sentry

### Setup

```ts
// src/main.ts
import * as Sentry from '@sentry/browser';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,  // 10% sampling
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
  });
}
```

### Capture Errors

```ts
try {
  // ...
} catch (err) {
  Sentry.captureException(err, {
    tags: { feature: 'daily_puzzle' },
    extra: { puzzle_date: date },
  });
}
```

### User Context

```ts
Sentry.setUser({ id: user.id, username: profile.username });
```

### Edge Function Errors

```ts
// supabase/functions/_shared/sentry.ts
import * as Sentry from 'https://deno.land/x/sentry/index.mjs';

Sentry.init({ dsn: Deno.env.get('SENTRY_DSN') });

export function withErrorTracking(handler) {
  return async (req) => {
    try {
      return await handler(req);
    } catch (err) {
      Sentry.captureException(err);
      throw err;
    }
  };
}
```

### Alerts

Sentry → Alerts:
- New error type → Slack
- Error rate > 5% in 5 min → Pager
- Performance regression → email

---

## ⚡ Performance

### Web Vitals

```ts
import { onCLS, onFID, onLCP } from 'web-vitals';

onCLS(({ value }) => track('web_vital_cls', { value }));
onFID(({ value }) => track('web_vital_fid', { value }));
onLCP(({ value }) => track('web_vital_lcp', { value }));
```

### Custom Timing

```ts
const t0 = performance.now();
const puzzle = await generatePuzzle(...);
const elapsed = performance.now() - t0;
track('puzzle_gen_time', { difficulty, ms: elapsed });
```

### Targets
| Metric | Target |
|---|---|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Daily puzzle load | < 500ms |
| Submit score API | < 1s p95 |
| Time to interactive | < 3s |

---

## 🛡️ Anti-cheat Monitoring

### Metrics
- `flagged_submissions_total`
- `rejected_submissions_total` (by reason)
- `top_10_submissions_today`
- `submissions_per_user_today` (should be ≤ 1)

### Alerts
- > 50 flagged/day
- Single user > 10 flags
- Submission with rank 1 + suspicious timing

```sql
-- Query: top score distribution check
SELECT
  score,
  COUNT(*) as n,
  AVG(time_seconds) as avg_time
FROM daily_leaderboard
WHERE date = CURRENT_DATE
GROUP BY score
ORDER BY score DESC
LIMIT 100;
```

ถ้า top 10 มี score เท่ากันทั้งหมด → bot

---

## 📈 Supabase Built-in

Dashboard → Reports:
- API requests/hour
- Auth signups
- Database CPU/memory
- Connection pool usage
- Top slow queries

---

## 📊 Dashboards

### Product (PostHog)
- DAU/MAU
- D1/D7/D30 retention curves
- Funnel conversion
- Top events
- User cohorts

### Engineering (Grafana or Supabase)
- Error rate
- API latency p50/p95/p99
- DB query performance
- Edge Function invocations

### Operations (Manual SQL)
- Daily report:
  ```sql
  SELECT
    CURRENT_DATE,
    COUNT(DISTINCT user_id) as dau,
    COUNT(*) as daily_completions
  FROM user_game_history
  WHERE completed_at >= CURRENT_DATE
    AND mode = 'daily';
  ```

---

## 🔔 Alerts Routing

| Severity | Channel | Examples |
|---|---|---|
| P0 — Site down | PagerDuty + Slack | DB down, all API failing |
| P1 — Major bug | Slack alerts | Score submission failing, login broken |
| P2 — Minor | Slack alerts | Single feature error spike |
| P3 — Info | Daily digest | Slow query, low engagement metric |

---

## 📝 Logging Standards

```ts
log.info('User completed daily puzzle', {
  user_id, date, difficulty, score, time_seconds
});

log.error('Failed to submit score', {
  user_id, error: err.message, stack: err.stack
});
```

**ห้าม log:** password, email full, payment info, JWT
