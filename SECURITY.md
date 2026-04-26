🚨 Security (Must Fix)
Hardcoded credentials — camidi / fonduefortwo is in source code and GitHub. Move to environment variables or implement proper auth (even a simple JWT endpoint would be better).

Exposed Directus token — VITE_ prefix makes your static token visible in client bundle. You need either:

A thin backend proxy (Cloudflare Worker, Vercel serverless) that holds the real token
Or switch to Directus user auth with session tokens
⚠️ Reliability (High Priority)
No offline fallback — If Directus is down, the entire app breaks. Add:

Error boundaries around Directus queries
LocalStorage fallback for table sessions (already have the data structure)
Retry logic with exponential backoff
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
Accidental table close — No undo means lost revenue if staff fat-finger it. Add:
Archive table sessions for 24h before deletion (cheap insurance)
Or "Reopen Last Closed Table" action
