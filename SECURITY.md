🚨 Security (Must Fix)
Hardcoded credentials — camidi / fonduefortwo is in source code and GitHub. Move to environment variables or implement proper auth (even a simple JWT endpoint would be better).

Exposed Directus token — VITE_ prefix makes your static token visible in client bundle. You need either:

A thin backend proxy (Cloudflare Worker, Vercel serverless) that holds the real token
Or switch to Directus user auth with session tokens
⚠️ Reliability (High Priority)
No offline fallback — If Directus is down, the entire app breaks. Fully addressed:

✅ Error boundaries around Directus queries — global crash boundary + inline boundary on DailySalesView; offline banner when sessions sync fails
✅ Retry logic with exponential backoff — fetchMenu retries 3x on startup; session writes retry up to MAX_RETRIES with toast feedback
✅ LocalStorage fallback for table sessions — All table state (orders, sentBatches, markedBatches, gutschein, seated) written to localStorage immediately; app reads from cache when Directus unavailable; syncs queued writes when connection restored
✅ Multi-device conflict resolution — When multiple devices work offline and reconnect, conflicts detected automatically; manual resolution UI (Keep Local / Keep Remote / Merge Both) handles conflicts one at a time; sync paused until all conflicts resolved
No backup strategy — SQLite file corruption or accidental deletion = total data loss. Set up:

Daily automated backups (Directus has built-in snapshot tools)
Or replicate bills to a second store (even localStorage for emergency recovery)
Manual day reset — Forgetting "Clear Daily Sales" means bills pile up and slow down queries. Consider:

Auto-clear at 5 AM Berlin time (cron job or scheduled function)
Or at minimum, add a notification reminder
📊 Observability
No monitoring — You won't know if it's down until someone complains. Add:

Uptime monitoring (UptimeRobot, BetterStack free tier)
Sentry or similar for runtime errors
Directus API health check endpoint
No analytics on revenue — You're building an income-generating system but can't measure it. Add:

Simple daily revenue graph (already have the data in bills)
Alert if revenue drops >30% vs. previous week (early warning)
🎯 Revenue Protection
✅ Accidental table close — Full session archived to localStorage (lastClosedSession key, 24h TTL) on every close. Amber "Reopen T.X" button appears on the floor view; restores all state and re-syncs to Directus. Device-local only (not cross-device).
