# Recent Changes

## 2026-07-02
- **Added `staging` branch + `deploy:staging` target** — separates
  Slack/phone-driven `claude-runner` work from `main`/prod. Headless sessions
  commit to `staging` and auto-deploy to `https://to-staging.blasalviz.com`
  (static nginx site on this VPS, `dist/` rsynced locally, dev Directus,
  HTTP basic auth). `main` only changes via reviewed, human-approved merges;
  `deploy:prod` still only ever builds from `main`, from the Windows machine,
  manually. Nginx config staged at `~/services/nginx-tableorders-staging.conf`
  pending one-time sudo setup (DNS, `/var/www/tableorders-staging`, certbot).
  See `docs/SYSTEM_INVARIANTS.md` SI-6 and the Branch Model section in
  `CLAUDE.md`/`AGENTS.md`.

## 2026-07-01
- **Prod deployment confirmed live** — Kaeserei Camidi is running TableOrders
  in production. App deploy is `npm run deploy:prod`, run manually from the
  developer's local machine over SSH (`scp` to `167.233.138.109:/var/www/camidi/`,
  then `chmod` via SSH using the `camidi-hetzner` key). This is decoupled from
  `git push origin main` — pushing to `main` does not deploy prod. Docs
  (`CLAUDE.md`, `AGENTS.md`, `docs/SYSTEM_INVARIANTS.md`, `docs/CLIENT_SETUP.md`)
  updated accordingly; they previously described Hetzner prod deploy as "TBD".

## 2026-06-28
- **Directus upgraded dev → v12.0.2** — systemd service on `cms.blasalviz.com`; 5 DB migrations applied; `IP_TRUST_PROXY=true` added to `.env`
- **Prod Directus provisioned** — `cms.camidi.de` (Hetzner, PostgreSQL, v12.0.2)
- **Schema migrated dev → prod** — 8 collections, 65 fields, 5 relations via `/schema/diff` + `/schema/apply`; `bill_items.bill_id` corrected from `char(36)` to `integer` on prod
- **Reference data migrated dev → prod** — categories (4), subcategories (16), restaurant_tables (19), menu_items (181), menu_item_variants (146)
