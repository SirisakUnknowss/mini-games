# 💰 Cost Projection

## 📋 Summary

| Stage | DAU | Monthly Cost |
|---|---|---|
| Phase 0-1 (MVP) | 0-500 | **$0** |
| Phase 2 launch | 500-5,000 | **~$25** |
| Phase 3 scale | 5,000-50,000 | **~$300** |
| Phase 4 scale | 50,000-500,000 | **~$2,500** |

---

## 💵 Detailed Breakdown

### Phase 0-1: Pre-launch / Soft Launch (DAU 0-500)

| Service | Plan | Cost |
|---|---|---|
| Supabase | Free tier | $0 |
| Cloudflare Pages | Free | $0 |
| PostHog | Free (1M events) | $0 |
| Sentry | Free (5k errors) | $0 |
| FCM | Free | $0 |
| Domain (sudokudaily.app) | $12/yr | ~$1/mo |
| **Total** | | **~$1/mo** |

#### Limits @ Free Tier (Supabase)
- 500MB DB
- 2GB bandwidth
- 50,000 MAU (auth)
- 500MB storage
- 5GB function invocations
- 7-day log retention

DAU 500 = MAU ~15,000 → well within free tier

---

### Phase 2: Public Launch (DAU 500-5,000)

| Service | Plan | Cost |
|---|---|---|
| Supabase | Pro ($25/mo) | $25 |
| Cloudflare Pages | Free | $0 |
| PostHog | Free (still under 1M events) | $0 |
| Sentry | Free | $0 |
| FCM | Free | $0 |
| Domain | | $1 |
| **Total** | | **~$26/mo** |

#### Pro Tier Limits
- 8GB DB
- 250GB bandwidth
- 100k MAU
- 100GB storage
- Auto backups
- Daily backup + PITR (7 days)

DAU 5,000 = MAU ~50,000 → comfortable

#### When to upgrade
- DB > 6GB → upgrade or optimize
- Bandwidth > 200GB → enable CDN aggressively
- Function invocations > 2M/mo

---

### Phase 3: Growth (DAU 5,000-50,000)

| Service | Plan | Cost |
|---|---|---|
| Supabase | Pro + add-ons | $25 + ~$100 (storage/bandwidth) |
| Cloudflare Pages | Free (still) | $0 |
| PostHog | Scale ($0.00005/event) | ~$100 |
| Sentry | Team ($26) | $26 |
| FCM | Free | $0 |
| Domain | | $1 |
| Cloudflare CDN | Free | $0 |
| **Total** | | **~$250-300/mo** |

#### Notes
- Supabase: storage/bandwidth overage charges apply
- PostHog: 1M-5M events/month range
- Consider: self-host PostHog ($30/mo VPS, save $70+)

---

### Phase 4: Scale (DAU 50,000-500,000)

| Service | Plan | Cost |
|---|---|---|
| Supabase | Team or self-hosted | $599 (Team) or $200 (self-host) |
| Cloudflare Pages | Workers (paid) | ~$30 |
| PostHog | Self-host on VPS | $50 |
| Sentry | Business | $80 |
| FCM | Free | $0 |
| Domain + CDN | | $1 |
| Engineer time | YOU | $$$ |
| **Total infra** | | **~$700-1500/mo** |

#### Recommendation @ DAU 50k+
- Self-host Supabase (PostgreSQL + Postgrest + GoTrue)
- Use Hetzner / Digital Ocean ($50-200/mo)
- Massive savings

---

## 📊 Cost Per DAU

| Stage | Monthly Cost | DAU | $/DAU |
|---|---|---|---|
| MVP | $1 | 500 | $0.002 |
| Public | $26 | 5,000 | $0.005 |
| Growth | $300 | 50,000 | $0.006 |
| Scale | $1,000 | 500,000 | $0.002 |

**Insight:** $/DAU ค่อนข้างคงที่ ~$0.005 = $0.06/year/DAU

If monetize at $1 ARPU/year → 16× profit margin

---

## 🎯 Cost Optimization

### Database
- Cleanup old data (game_history > 100 rows/user)
- Drop leaderboard > 90 days
- Index only what's needed
- Materialized views for heavy queries

### Bandwidth
- Cloudflare CDN (free)
- Compress assets (Brotli)
- Lazy load avatar/background
- WebP images

### Edge Functions
- Cache static responses
- Use DB triggers when possible (cheaper than function call)

### Analytics
- Self-host PostHog when > 1M events
- Don't track everything — sample

### Logs
- Reduce retention if expensive
- Sample sentry traces (10% in prod)

---

## ⚠️ Cost Risks

### Sudden spike
- Viral on TikTok → 1M downloads overnight
- **Mitigation:** Rate limiting, Cloudflare DDoS, scale-up checklist ready

### Storage
- Background images, avatars
- **Limit:** 500MB free, 100GB pro
- **Mitigation:** Optimize sizes, CDN cache forever

### Realtime channels
- Charged per concurrent connection (200 free, 500 pro)
- **Mitigation:** Subscribe only when needed, unsub on screen leave

### Edge function invocations
- 500k free, 2M pro
- **Mitigation:** Cache, batch calls

---

## 💡 Break-even (Future Monetization)

| Revenue source | Required users for $500/mo profit |
|---|---|
| $2.99 subscription | ~250 subscribers (assuming $4 / sub net) |
| Ads ($1 RPM) | 500k impressions/mo |
| IAP $5 avg | 100 sales/mo |

**Realistic:** DAU 10k → 2.5% conversion → 250 subscribers → break even

---

## 📋 Monthly Review Checklist

- [ ] Check Supabase usage
- [ ] Check PostHog event count
- [ ] Sentry quota
- [ ] DB size + cleanup
- [ ] Slow query review
- [ ] Forecast next month based on growth
