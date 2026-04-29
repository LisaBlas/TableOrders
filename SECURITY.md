> **Note**: For detailed code-level fixes and review sessions, see [REVIEW_PLAN.md](REVIEW_PLAN.md).
> This document covers high-level production and operational concerns.

---

## 🚨 Security (Must Fix)

### Hardcoded Credentials
**Status**: Low priority for current use case
**Location**: [AuthContext.tsx](src/contexts/AuthContext.tsx)

- `camidi` / `fonduefortwo` hardcoded in source
- Moving to env vars (`VITE_`) **doesn't secure frontend** — still visible in bundle
- **Real fix**: Server-side auth (JWT endpoint, session management)
- **Verdict**: May be overkill for single-restaurant internal tool; acceptable risk if network is trusted

**Cross-ref**: [REVIEW_PLAN.md - "What NOT to Worry About"](REVIEW_PLAN.md#what-not-to-worry-about-developer-feedback-from-previous-analysis)

---

### Exposed Directus Token
**Status**: 🚨 Production risk
**Location**: `.env` (VITE_DIRECTUS_TOKEN)

- `VITE_` prefix exposes token in client bundle (visible in DevTools)
- Grants full read/write access to Directus collections
- **Must fix before public deployment**

**Solutions**:
1. **Backend proxy** (Cloudflare Worker, Vercel serverless) — holds real token, exposes limited endpoints
2. **Directus user auth** — per-user session tokens instead of static admin token

**Priority**: High if app is public-facing; medium if internal/VPN-only
## ⚠️ Reliability (Partially Addressed)

### Error Handling & Offline Resilience
**Status**: 🟡 Infrastructure exists, but has gaps

**What's working**:
- ✅ Global error boundary (full-page fallback)
- ✅ Inline error boundary (DailySalesView)
- ✅ Offline banner when sessions sync fails
- ✅ Menu fetch retries 3x with exponential backoff
- ✅ localStorage cache for table sessions
- ✅ Multi-device conflict resolution UI

**Known gaps** (see [REVIEW_PLAN.md](REVIEW_PLAN.md) for fixes):
- ⚠️ `deleteSession` missing error handling ([Quick Win #3](REVIEW_PLAN.md#3-add-error-handling-to-deletesession))
- ⚠️ Conflict resolution is "pragmatic but fragile" ([Session 1](REVIEW_PLAN.md#session-1-sync-correctness-audit-))
- ⚠️ Grace period ambiguity in sync logic ([Known Issue](REVIEW_PLAN.md#4-conflict-resolution-grace-period-ambiguity))
- ⚠️ Bill creation failures only show toast (no retry or queue)

**Cross-ref**: [REVIEW_PLAN.md - Session 1 (Sync Correctness)](REVIEW_PLAN.md#session-1-sync-correctness-audit-), [Session 4 (Error Resilience)](REVIEW_PLAN.md#session-4-error-resilience-check-)

---

### No Backup Strategy
**Status**: 🚨 Data loss risk

- Directus uses SQLite (single file)
- File corruption or accidental deletion = total data loss
- No automated backups currently configured

**Solutions**:
1. **Directus snapshots** — built-in backup tool, run daily via cron
2. **Replicate bills** — periodic export to secondary store (S3, localStorage archive, CSV)
3. **Managed Directus Cloud** — automatic backups included

**Priority**: High for production revenue-generating system
---

## 📊 Observability (Missing)

### No Monitoring
**Status**: 🚨 Blind to downtime and errors

**Current state**: You won't know if it's down until someone complains

**Solutions**:
1. **Uptime monitoring** — UptimeRobot, BetterStack (free tier)
2. **Error tracking** — Sentry, LogRocket, or Rollbar for runtime errors
3. **Health check** — Directus API ping endpoint (monitor from uptime service)
4. **Client-side logging** — Log critical user actions (bill creation, table close) to track failures

**Priority**: Medium-high for production

---

### No Revenue Analytics
**Status**: 🟡 Data exists, not visualized

**Current state**: Bills stored in Directus, but no trend analysis or alerts

**Solutions**:
1. **Daily revenue graph** — already have the data in `bills` collection
2. **Week-over-week comparison** — alert if revenue drops >30% (early warning)
3. **Category breakdown** — which items generate most revenue
4. **Peak hour analysis** — optimize staffing

**Priority**: Medium (revenue optimization opportunity)
---

## 🎯 Revenue Protection

### Accidental Table Close
**Status**: ✅ Addressed

- Full session archived to localStorage (`lastClosedSession` key, 24h TTL) on every close
- Amber "Reopen T.X" button on floor view restores all state and re-syncs to Directus
- **Limitation**: Device-local only (not cross-device)
- **Location**: [closedSessionArchive.ts](src/utils/closedSessionArchive.ts), [TablesView.tsx](src/views/TablesView.tsx)

---

### Input Validation Gaps
**Status**: ⚠️ Missing bounds checking

**Known risks** (see [REVIEW_PLAN.md - Edge Cases](REVIEW_PLAN.md#edge-cases--validation-gaps)):
- Empty bills (no validation if qty=0)
- Division by zero (guest count = 0 in equal split)
- Negative totals (gutschein > bill total)
- Custom item price/qty unbounded

**Priority**: Medium (low probability but high impact if exploited)

---

## 📋 Summary & Next Steps

### Production Blockers (Must Fix)
1. **Exposed Directus token** — backend proxy or user auth
2. **No backup strategy** — automated snapshots
3. **Monitoring** — uptime + error tracking

### High Priority (Should Fix)
4. **Error handling gaps** — see [REVIEW_PLAN.md Quick Wins](REVIEW_PLAN.md#quick-wins--30-min-each)
5. **Input validation** — see [REVIEW_PLAN.md Edge Cases](REVIEW_PLAN.md#edge-cases--validation-gaps)
6. **Sync correctness** — see [REVIEW_PLAN.md Session 1](REVIEW_PLAN.md#session-1-sync-correctness-audit-)

### Nice to Have (Optimize Later)
7. **Revenue analytics** — trends and alerts
8. **Server-side auth** — if app goes public

**For code-level review and implementation**, see [REVIEW_PLAN.md](REVIEW_PLAN.md)
