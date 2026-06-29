## Code changes before go-live

### Critical — breaks the build or app

1. **vite.config.js:40 — base: '/TableOrders/'** ✅ Done — changed to `base: '/'` for VPS root serving. Demo build retains `/TableOrders/demo/`.

2. **package.json — remove GitHub Pages deploy machinery** ✅ Done — removed `gh-pages` devDep and `predeploy`/`deploy`/`postdeploy` scripts. `deploy:demo` kept for portfolio demo.

3. **`.env` / create `.env.production`** — create locally with `VITE_DIRECTUS_URL=https://cms.camidi.de` and the scoped app token. Dev `.env` stays pointed at `cms.blasalviz.com`. Do not commit this file.

---

### Client branding — wrong restaurant name/logo

4. **src/config/appConfig.ts:1 — RESTAURANT_NAME** ✅ Done — set to `"Käserei Camidi"`.

5. **src/assets/camidi_logo.jpg — logo** ✅ Done — existing file is already the correct client logo.

6. **src/contexts/AuthContext.tsx:43 — @camidi.com email suffix** ✅ Done — keeping `@camidi.com`; create all staff accounts with that suffix on the client's Directus instance.

---

### Security

7. **VITE_DIRECTUS_TOKEN in bundle** ✅ Done — scoped role and static token created on prod Directus. Token used in `.env.production`.

---
