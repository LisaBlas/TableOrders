## Code changes before go-live

### Critical — breaks the build or app

1. ~~**vite.config.js:40 — base: '/TableOrders/'**~~ ✅ Done — changed to `base: '/'` for VPS root serving. Demo build retains `/TableOrders/demo/`.

2. ~~**package.json — remove GitHub Pages deploy machinery**~~ ✅ Done — removed `gh-pages` devDep and `predeploy`/`deploy`/`postdeploy` scripts. `deploy:demo` kept for portfolio demo.

3. **`.env` / create `.env.production`**
   Current .env points to cms.blasalviz.com and CORS_ORIGIN=https://lisablas.github.io. You need .env.production with VITE_DIRECTUS_URL=https://cms.[client-domain] and a new scoped token. The dev .env stays as-is for dev work against your Camidi Directus.

---

### Client branding — wrong restaurant name/logo

4. ~~**src/config/appConfig.ts:1 — RESTAURANT_NAME = "Käserei Camidi"**~~ ✅ Done — set to `"Restaurant"` placeholder with TODO comment. Update to client name before go-live.

5. **src/App.tsx — logo and splash screen title**
   - Splash screen title now reads from `RESTAURANT_NAME` ✅ — no longer hardcoded.
   - Logo file (`src/assets/camidi_logo.jpg`) still needs to be replaced with the client's logo file.

6. **src/contexts/AuthContext.tsx:43 — @camidi.com email suffix**
   All Directus users are mapped as {username}@camidi.com. For the client's Directus instance, staff accounts must be created with that same suffix — OR you change the suffix to match whatever you actually use. Either works; just be consistent when you create Directus users on the new instance.

---

### Static fallback data — wrong restaurant's data

7. **src/data/constants.ts — hardcoded TABLES and MENU**
   - TABLES (lines 3–22) is Camidi's floor layout. It's the hard fallback when Directus restaurant_tables is empty/unreachable. If the client's floor is different, update it — or at minimum ensure Directus has restaurant_tables data so the app never falls back.
   - MENU (lines 24–774) is the entire Camidi menu. If Directus goes down during service, the app will serve Camidi's prices and items to a different restaurant. Once the client's menu is in Directus it won't matter in normal operation, but this is a silent correctness risk.

---

### Security

8. **VITE_DIRECTUS_TOKEN in bundle** (already flagged in your own CLIENT_DEPLOY_NEXT_STEPS.md)
   The token is baked into the JS bundle and visible in DevTools. The minimum fix is: create a restricted Directus role with read on categories/menu_items/menu_item_variants/restaurant_tables and read+write on bills/bill_items/table_sessions, then issue a token scoped to that role. No admin access in the client-side token.

---
