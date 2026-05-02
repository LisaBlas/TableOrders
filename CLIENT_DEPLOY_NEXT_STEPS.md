# Client Deployment — Next Steps

## Files to clean up before/after client deploy

### Delete (dev/test artifacts, not needed on client build)
- `test_swap.py` — manual swap test script
- `test_ds.py` — manual daily sales test script
- `test_screenshots/` — dev screenshots
- `Article-list.md` — unrelated notes
- `DATABASE_NORMALIZATION.md` — internal planning doc
- `DETAILED_REFACTOR_PLAN.md` — internal planning doc
- `DIRECTUS_SETUP.md` — internal setup guide (gitignored already)
- `dist/` — build output, regenerated on deploy, don't commit

### Modify before deploy
- `package.json` — remove `gh-pages` dep, remove `predeploy`/`deploy` scripts (no longer deploying to GitHub Pages)
- `vite.config.js` — change `base: '/TableOrders/'` to `base: '/'` (served from root on VPS)
- `package.json` → `homepage` field — remove or update (GitHub Pages URL won't apply)
- `.env` / `VITE_DIRECTUS_URL` — point to the client's new Directus instance URL

### Security: scope the Directus token
- Current setup: a single static token with full read/write access is baked into the JS bundle (`VITE_DIRECTUS_TOKEN`) — visible to anyone in DevTools
- Before client deploy: create a **read-only token** for `menu_items`, `categories`, `menu_item_variants` (public menu data) and a **write token** that lives server-side only — either via a thin proxy (Express/Hono, ~2–3h) or by using Directus's built-in role/permission scoping
- Minimum viable fix: in Directus, create a restricted role that only allows reads on menu collections and reads/writes on `bills`, `bill_items`, `table_sessions` — no admin access — and issue a token scoped to that role

### Keep everything in `src/` — no changes needed there

---

## Step-by-step: Client VPS Setup

### 1. Contract signed + VPS provisioned
- [ ] Client signs contract
- [ ] Provision VPS (DigitalOcean, Hetzner, etc.) — Ubuntu 24.04
- [ ] Point client domain (e.g. `orders.restaurant.com`) to VPS IP
- [ ] Add subdomain for CMS (e.g. `cms.restaurant.com`)

### 2. Install Directus on client VPS
- [ ] Install Node 22 via nvm
- [ ] `mkdir ~/services/directus && cd ~/services/directus`
- [ ] `npm install directus`
- [ ] Configure `.env` (SQLite, PUBLIC_URL = `https://cms.restaurant.com`, admin credentials)
- [ ] `npx directus bootstrap`
- [ ] Recreate collections: `categories`, `menu_items`, `menu_item_variants` (same schema as test)
- [ ] Set public read access on all three collections
- [ ] Create systemd unit (copy from personal VPS, update paths)
- [ ] Set up Nginx + Let's Encrypt for `cms.restaurant.com`

### 3. Import client menu data
- [ ] Copy `import_menu.py` from personal VPS
- [ ] Update admin credentials + URL in script
- [ ] Run: `python3 import_menu.py`
- [ ] Verify all items, prices, variants in Directus admin UI

### 4. Update and build the React app
- [ ] `git pull origin main`
- [ ] Update `vite.config.js`: `base: '/'`
- [ ] Remove `gh-pages` from package.json scripts/devDeps
- [ ] Create `.env.production` with `VITE_DIRECTUS_URL=https://cms.restaurant.com`
- [ ] `npm run build` — outputs to `dist/`

### 5. Serve the app via Nginx
- [ ] Copy `dist/` to `/var/www/orders.restaurant.com/`
- [ ] Configure Nginx to serve static files from that path
- [ ] Set up Let's Encrypt for `orders.restaurant.com`
- [ ] Test on mobile

### 6. Handoff
- [ ] Give client Directus admin credentials (`cms.restaurant.com/admin`)
- [ ] Walk them through: editing a price, adding an item, toggling availability
- [ ] Confirm the app reflects changes live
- [ ] Document support contact method

---

## Notes
- Keep personal VPS Directus (`cms.blasalviz.com`) running as the test/dev environment
- Never use personal VPS as the client's production instance
- Client owns: VPS, domain, all business data
- You own: codebase, Directus schema, deployment scripts
