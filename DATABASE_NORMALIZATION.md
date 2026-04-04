# Database Normalization Plan — Multi-Tenant SaaS Architecture

**Goal:** Enable clients to manage menus via Directus CMS without touching code
**CMS:** Directus (self-hosted on VPS)
**Database:** PostgreSQL (one DB per client)
**Architecture:** Multi-tenant with client data separation

---

## 1. Multi-Tenant Architecture ✅ **PERFECT FIT FOR YOUR GUIDELINE**

### Client Isolation Strategy
```
/clients/camidi     → DB: tableorders_camidi
/clients/brasserieX → DB: tableorders_brasserieX
/clients/vinobarY   → DB: tableorders_vinobarY
```

**Each client gets:**
- ✅ **Separate PostgreSQL database** (your guideline: "Each client gets their own database")
- ✅ **Identical schema structure** (your guideline: "Code stays the same, only DB connection differs")
- ✅ **Zero data leak risk** (your guideline: "No accidental data leaks")
- ✅ **Independent backups** (your guideline: "Easy backups per client")
- ✅ **Horizontal scaling** (your guideline: "Easier future scaling")

**Runtime Config (matching your example):**
```js
// App startup - determine client from URL/subdomain
const clientId = window.location.hostname.split('.')[0]; // "camidi.tableorders.app"
const API_BASE = `https://api.tableorders.app/${clientId}`;

// Backend routes client to correct DB
app.get('/api/:clientId/menu', (req, res) => {
  const db = connectToClientDB(req.params.clientId); // ← Your guideline: "only config changes"
  // Query menu from client-specific DB
});
```

---

## 2. Normalized Database Schema (PostgreSQL)

### Core Tables

#### `categories`
```sql
CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed data (same across all clients)
INSERT INTO categories (id, name, emoji, sort_order) VALUES
  ('food', 'Food', '🍽️', 1),
  ('drinks', 'Drinks', '🍷', 2),
  ('bottles', 'Bottles', '🍾', 3);
```

#### `subcategories`
```sql
CREATE TABLE subcategories (
  id VARCHAR(50) PRIMARY KEY,
  category_id VARCHAR(50) REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO subcategories (id, category_id, name, emoji, sort_order) VALUES
  ('cheese', 'food', 'Cheese Counter', '🧀', 1),
  ('warm', 'food', 'Warm Dishes', '🍽️', 2),
  ('salads', 'food', 'Salads', '🥗', 3),
  ('snacks', 'food', 'Snacks', '🫒', 4),
  ('wine', 'drinks', 'Wine', '🍷', 1),
  ('bier', 'drinks', 'Bier', '🍺', 2),
  ('cocktail', 'drinks', 'Cocktail', '🍸', 3),
  ('soft', 'drinks', 'Soft', '🥤', 4),
  ('schnaps', 'drinks', 'Schnaps', '🥃', 5),
  ('warm_drinks', 'drinks', 'Warm', '☕', 6),
  ('white', 'bottles', 'White', '🥂', 1),
  ('rosé', 'bottles', 'Rosé', '🌸', 2),
  ('sparkling', 'bottles', 'Sparkling', '🍾', 3),
  ('red', 'bottles', 'Red', '🍷', 4),
  ('natural', 'bottles', 'Natural', '🍇', 5),
  ('water', 'bottles', 'Water', '💧', 6);
```

#### `menu_items` (Core table for client edits)
```sql
CREATE TABLE menu_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id VARCHAR(50) REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id VARCHAR(50) REFERENCES subcategories(id) ON DELETE SET NULL,
  base_price DECIMAL(10,2),
  pos_id VARCHAR(50),         -- POS system identifier (e.g., "11", "251-1")
  pos_name VARCHAR(200),      -- POS display name (e.g., "CP 1PAX", "Picpoul 0,1")
  has_variants BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_subcategory ON menu_items(subcategory_id);
CREATE INDEX idx_menu_items_active ON menu_items(is_active);

-- Example: Simple item (no variants)
INSERT INTO menu_items (id, name, category_id, subcategory_id, base_price, pos_id, pos_name, has_variants, sort_order) VALUES
  ('f1', 'Small Cheese Plate', 'food', 'cheese', 10.00, '11', 'Kleiner Kâseteller', false, 1),
  ('f2', 'Cheese Plate', 'food', 'cheese', 11.00, '10', 'CP 1PAX', false, 2),
  ('dr1', 'Aperol', 'drinks', 'cocktail', 8.00, '73', 'Aperol', false, 1);

-- Example: Item WITH variants (marked with has_variants=true)
INSERT INTO menu_items (id, name, category_id, subcategory_id, has_variants, sort_order) VALUES
  ('wg1', 'Picpoul', 'drinks', 'wine', true, 1);
```

#### `item_variants` (Size/location variants)
```sql
CREATE TABLE item_variants (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(50) REFERENCES menu_items(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL,   -- "small", "large", "here", "togo"
  label VARCHAR(50) NOT NULL,          -- "0,1", "0,2", "Here", "To Go"
  price DECIMAL(10,2) NOT NULL,
  pos_id VARCHAR(50),                  -- Variant-specific POS ID (e.g., "251-1", "3101")
  pos_name VARCHAR(200),               -- Variant-specific POS name
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_item_variants_item ON item_variants(item_id);

-- Example: Size variants (wine by glass)
INSERT INTO item_variants (item_id, variant_type, label, price, pos_id, pos_name, sort_order) VALUES
  ('wg1', 'small', '0,1', 3.50, '251-1', 'Picpoul 0,1', 1),
  ('wg1', 'large', '0,2', 6.50, '251-2', 'Picpoul 0,2', 2);

-- Example: Location variants (bottles - here vs. to-go)
INSERT INTO menu_items (id, name, category_id, subcategory_id, has_variants, sort_order) VALUES
  ('picpoul_bottle', 'Picpoul Fl.', 'bottles', 'white', true, 1);

INSERT INTO item_variants (item_id, variant_type, label, price, pos_id, pos_name, sort_order) VALUES
  ('picpoul_bottle', 'here', 'Here', 22.50, '3101', 'Picpoul Fl H', 1),
  ('picpoul_bottle', 'togo', 'To Go', 11.50, '3102', 'Picpoul Fl TG', 2);
```

#### `restaurant_tables`
```sql
CREATE TABLE restaurant_tables (
  id VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  is_divider BOOLEAN DEFAULT FALSE,  -- For UI section headers ("Outside")
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_restaurant_tables_active ON restaurant_tables(is_active);

-- Seed data
INSERT INTO restaurant_tables (id, label, is_divider, sort_order) VALUES
  ('1', 'Table 1', false, 1),
  ('2', 'Table 2', false, 2),
  ('MUT', 'MUT', false, 5),
  ('ToGo', 'To Go', false, 12),
  ('divider_outside', 'Outside', true, 13),  -- Section header
  ('A', 'A', false, 14),
  ('Left', 'Left', false, 17);
```

---

## 3. Directus CMS Integration

### Why Directus?
- **Self-hosted** → Full control, no vendor lock-in
- **Auto-generates API** from PostgreSQL schema
- **Role-based permissions** → Limit what clients can edit
- **Multi-project support** → Manage multiple client DBs from one Directus instance
- **TypeScript SDK** → Type-safe API calls from React app
- **Webhooks** → Notify app when menu changes (cache invalidation)
- **Zero-code admin UI** → Client adds items via forms, no SQL knowledge needed

### Directus Setup (One Instance, Multiple Projects)

**Recommended: Single Directus + DB per client**
```
Directus Instance (VPS at cms.tableorders.app)
├── Project: Camidi    → DB: tableorders_camidi (postgres://localhost/tableorders_camidi)
├── Project: Brasserie → DB: tableorders_brasserieX (postgres://localhost/tableorders_brasserieX)
└── Project: VinoBar   → DB: tableorders_vinobarY (postgres://localhost/tableorders_vinobarY)

Each project connects to a different PostgreSQL database.
Clients access: https://cms.tableorders.app/admin/projects/camidi
```

### Directus Collections (Auto-generated from Schema)

After running SQL migrations, Directus auto-discovers tables as "Collections":

- **Categories** → CRUD interface for categories (admin-only)
- **Subcategories** → CRUD with category dropdown (admin-only)
- **Menu Items** → Rich editor with:
  - Category/subcategory dropdowns
  - Price input with currency formatter
  - POS ID/name fields
  - Variant toggle → shows related `item_variants` table
  - Active/inactive toggle
  - Sort order (drag-and-drop in Directus UI)
- **Item Variants** → Relational interface (1:many with menu_items)
- **Restaurant Tables** → Simple table editor

### Client Permissions (Directus Roles)

**Role: Menu Manager** (Restaurant staff)
```yaml
Permissions:
  - categories: Read only (structure managed by admin)
  - subcategories: Read only
  - menu_items: Full CRUD (create, update, delete, toggle active)
  - item_variants: Full CRUD
  - restaurant_tables: Full CRUD
```

**Role: Admin** (You/your team)
```yaml
Permissions:
  - All collections: Full CRUD
  - Can create new clients/projects
  - Can manage schema migrations
  - Can access all client databases
```

---

## 4. Frontend Integration (React App)

### API Layer

```typescript
// src/api/directus.ts
import { createDirectus, rest, readItems } from '@directus/sdk';

// Get client ID from URL (e.g., camidi.tableorders.app → "camidi")
const clientId = window.location.hostname.split('.')[0];

const directus = createDirectus(`https://api.tableorders.app/${clientId}`)
  .with(rest());

// Fetch menu with categories, subcategories, variants
export async function fetchMenu() {
  const items = await directus.request(
    readItems('menu_items', {
      filter: { is_active: { _eq: true } },
      fields: [
        '*',
        'category_id.*',
        'subcategory_id.*',
        'variants.*'  // Include all related variants
      ],
      sort: ['category_id.sort_order', 'subcategory_id.sort_order', 'sort_order']
    })
  );

  // Transform to match current MENU structure
  return transformToMenuFormat(items);
}

// Transform Directus response to match existing app structure
function transformToMenuFormat(items: any[]) {
  const menu: Record<string, any[]> = {};

  items.forEach((item) => {
    const category = item.category_id.name;
    if (!menu[category]) menu[category] = [];

    if (item.has_variants && item.variants?.length > 0) {
      // Item with variants (e.g., wine by glass, bottles)
      menu[category].push({
        id: item.id,
        name: item.name,
        subcategory: item.subcategory_id?.id,
        variants: item.variants.map((v: any) => ({
          type: v.variant_type,
          price: parseFloat(v.price),
          label: v.label,
          posId: v.pos_id,
          posName: v.pos_name
        }))
      });
    } else {
      // Simple item (e.g., Aperol, Cheese Plate)
      menu[category].push({
        id: item.id,
        name: item.name,
        price: parseFloat(item.base_price),
        subcategory: item.subcategory_id?.id,
        posId: item.pos_id,
        posName: item.pos_name
      });
    }
  });

  return menu;
}
```

### App Initialization (Dual Mode: CMS + Fallback)

```typescript
// src/main.tsx or App.tsx
import { fetchMenu } from './api/directus';
import { MENU } from './data/constants'; // Fallback

let RUNTIME_MENU = MENU; // Default to static menu

async function initApp() {
  try {
    // Fetch menu from Directus on app load
    RUNTIME_MENU = await fetchMenu();
    console.log('✅ Menu loaded from CMS');
  } catch (error) {
    console.warn('⚠️ Failed to load menu from CMS, using static fallback', error);
    // App continues with constants.js as fallback
  }
}

// Call before rendering app
initApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});

// Export RUNTIME_MENU for use in components
export { RUNTIME_MENU as MENU };
```

### Caching Strategy

```typescript
// src/api/menuCache.ts
const CACHE_KEY = 'tableorders_menu_cache';
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

export async function getCachedMenu() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data; // Use cached menu
    }
  }

  // Fetch fresh menu
  const menu = await fetchMenu();
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: menu,
    timestamp: Date.now()
  }));
  return menu;
}

// Invalidate cache when Directus sends webhook
window.addEventListener('directus-menu-update', () => {
  localStorage.removeItem(CACHE_KEY);
  window.location.reload(); // Force refresh
});
```

---

## 5. Migration Path (Current → Database)

### Phase 1: Dual Mode (Static + CMS) — **ZERO RISK**
```typescript
// App uses constants.js as default
// Optional: Override with CMS data if available
const USE_CMS = process.env.VITE_USE_CMS === 'true';
const MENU = USE_CMS ? await fetchMenu() : STATIC_MENU;
```

**Benefits:**
- ✅ Zero downtime migration
- ✅ Test CMS with one client before rollout
- ✅ Fallback if CMS is down (app keeps working)

### Phase 2: Gradual Rollout
1. **Week 1:** Deploy with dual mode to production
2. **Week 2:** Set up Camidi's Directus project, migrate their menu
3. **Week 3:** Test with Camidi staff (they edit menu, verify changes appear)
4. **Week 4:** New clients start CMS-only (no constants.js needed)

### Phase 3: CMS-Only (After all clients migrated)
- Remove `constants.js` from codebase
- All menu data served via Directus API
- constants.js → seed data for new client onboarding scripts

---

## 6. Client Onboarding Flow (Automated)

### New Client Setup Script

```bash
#!/bin/bash
# scripts/onboard-client.sh

CLIENT_ID=$1  # e.g., "brasserieX"
ADMIN_EMAIL=$2  # e.g., "admin@brasserieX.com"

# 1. Create PostgreSQL database
echo "📦 Creating database: tableorders_$CLIENT_ID"
psql -U postgres -c "CREATE DATABASE tableorders_$CLIENT_ID;"

# 2. Run schema migrations
echo "🔧 Running schema migrations..."
psql -U postgres -d "tableorders_$CLIENT_ID" < migrations/001_initial_schema.sql

# 3. Seed default data (categories, subcategories)
echo "🌱 Seeding default data..."
psql -U postgres -d "tableorders_$CLIENT_ID" < migrations/002_seed_categories.sql

# 4. Create Directus project
echo "🎨 Setting up Directus project..."
directus projects create $CLIENT_ID \
  --database "tableorders_$CLIENT_ID" \
  --admin-email "$ADMIN_EMAIL" \
  --admin-password "$(openssl rand -base64 24)"

# 5. Configure app environment
echo "⚙️ Configuring app..."
cat >> config/clients.json <<EOF
{
  "$CLIENT_ID": {
    "db": "tableorders_$CLIENT_ID",
    "api_url": "https://api.tableorders.app/$CLIENT_ID",
    "cms_url": "https://cms.tableorders.app/admin/projects/$CLIENT_ID"
  }
}
EOF

echo "✅ Client $CLIENT_ID onboarded successfully!"
echo "📊 Directus admin: https://cms.tableorders.app/admin/projects/$CLIENT_ID"
echo "📧 Admin email: $ADMIN_EMAIL"
```

**Usage:**
```bash
./scripts/onboard-client.sh camidi admin@camidi.com
./scripts/onboard-client.sh brasserieX admin@brasserieX.com
```

**Time:** ~5 minutes per client

### Client Receives:
- ✉️ Directus login credentials (email)
- 📖 Training materials (PDF: "How to Edit Your Menu")
- 🎥 Video tutorial (screen recording: adding items, changing prices)
- 📞 Support contact (your email/phone)

---

## 7. Use Case: Client Adds New Menu Item

**Scenario:** Camidi wants to add **"Burrata Salad"** (€14.50, POS ID: 45)

### Steps (via Directus UI):
1. Login to Directus: `https://cms.tableorders.app/admin/projects/camidi`
2. Navigate to **Menu Items** collection
3. Click **+ Create New Item**
4. Fill form:
   - **Name:** `Burrata Salad`
   - **Category:** `Food` (dropdown)
   - **Subcategory:** `Salads` (dropdown)
   - **Base Price:** `14.50`
   - **POS ID:** `45`
   - **POS Name:** `Burrata Salat`
   - **Active:** `✓` (checkbox)
   - **Has Variants:** `✗` (unchecked)
5. Click **Save**

### What happens (backend):
```sql
-- Directus automatically executes:
INSERT INTO menu_items (id, name, category_id, subcategory_id, base_price, pos_id, pos_name, is_active, has_variants)
VALUES ('burrata_salad', 'Burrata Salad', 'food', 'salads', 14.50, '45', 'Burrata Salat', true, false);
```

### What happens (frontend):
1. Directus webhook fires (optional): `POST https://tableorders.app/api/camidi/cache/invalidate`
2. Next app load (or on page refresh): New item appears in **Food → Salads** menu
3. When ordered and paid: Daily Sales **Total tab** shows `[45] ×qty Burrata Salat`

**✅ No code deployment needed!**
**⏱️ Client can see changes in < 30 seconds**

---

## 8. Use Case: Client Changes Price

**Scenario:** Camidi increases **"Aperol"** price from €8.00 → €8.50

### Steps (via Directus UI):
1. Navigate to **Menu Items** → Search "Aperol"
2. Click on "Aperol" row
3. Change **Base Price** from `8.00` to `8.50`
4. Click **Save**

### What happens:
```sql
UPDATE menu_items SET base_price = 8.50, updated_at = NOW() WHERE id = 'dr1';
```

**✅ Price updated instantly** (after cache refresh)
**📊 Historical orders unaffected** (paid bills store price at time of sale)

---

## 9. Schema Migration Strategy

### Version Control for Database
```
migrations/
├── 001_initial_schema.sql        # Categories, subcategories, menu_items, item_variants, tables
├── 002_seed_categories.sql       # Default categories/subcategories
├── 003_seed_camidi_menu.sql      # Import Camidi's existing menu from constants.js
├── 004_add_allergens_column.sql  # Future: Add allergen info
├── 005_add_inventory_table.sql   # Future: Stock tracking
└── ...
```

### Applying Migrations to All Clients
```bash
# Apply to all clients
for db in tableorders_*; do
  echo "Migrating $db..."
  psql -U postgres -d $db < migrations/004_add_allergens_column.sql
done

# Or selectively (e.g., beta features for one client)
psql -U postgres -d tableorders_camidi < migrations/999_beta_feature.sql
```

### Directus Schema Sync
- When you run SQL migrations, Directus auto-detects new columns/tables
- Refresh Directus UI → new fields appear automatically in forms
- No Directus config changes needed for additive migrations

---

## 10. Cost & Performance

### VPS Requirements (DigitalOcean, Hetzner, Linode)

**Starting Setup (Small Scale):**
- **$12/month** VPS (2 vCPU, 4GB RAM, 80GB SSD)
  - PostgreSQL (all client DBs)
  - Directus (Node.js)
  - Nginx (reverse proxy)
- **Supports:** ~5-10 clients comfortably
- **Cost per client:** ~$1.20-$2.40/month

**Medium Scale (Growing):**
- **$24/month** VPS (4 vCPU, 8GB RAM, 160GB SSD)
  - **Supports:** ~20-30 clients
  - **Cost per client:** ~$0.80-$1.20/month

**Large Scale (Established):**
- **$48/month** Managed PostgreSQL (DigitalOcean Managed DB)
- **$24/month** VPS for Directus
- **Total:** $72/month for 50+ clients
- **Cost per client:** ~$1.44/month

### Caching Strategy (Reduces API Calls)
- Menu cached in **localStorage** (15min TTL)
- Reduces Directus API calls by ~95%
- App works offline until cache expires
- **Bandwidth savings:** ~$0 (menu fetched 1x per 15min per device)

### Database Size Estimates
- **Menu items:** ~200 items × 500 bytes = 100KB per client
- **Orders (1 year):** ~10,000 orders × 2KB = 20MB per client
- **Total per client (1 year):** ~25MB
- **50 clients (1 year):** ~1.25GB (easily fits on $12/month VPS)

---

## 11. Security Considerations

### Database Access
- **PostgreSQL** listens only on `localhost` (not exposed to internet)
- **Directus** acts as secure API gateway (no direct DB access from frontend)
- **Firewall:** Only ports 80 (HTTP), 443 (HTTPS), 22 (SSH) open

### Multi-Tenancy Isolation
- Each client **cannot** access other clients' data (enforced by separate DBs)
- URL routing ensures client ID matches DB name: `https://api.tableorders.app/camidi` → `tableorders_camidi`
- Attempts to access wrong client → 403 Forbidden

### API Authentication (Directus)
```typescript
// Frontend uses PUBLIC read-only tokens for menu fetching
const directus = createDirectus('https://api.tableorders.app/camidi')
  .with(rest())
  .with(staticToken(process.env.VITE_DIRECTUS_PUBLIC_TOKEN));

// CMS users have AUTHENTICATED sessions for editing
await directus.login({
  email: 'admin@camidi.com',
  password: process.env.DIRECTUS_PASSWORD
});
```

**Best Practices:**
- Frontend: **Public tokens** (read-only, menu fetching)
- CMS editors: **User accounts** (write permissions)
- Backend API: **Server tokens** (full access, never exposed to client)

---

## 12. Future Extensions (Easy Additions)

Because of normalized schema, these features require **zero schema changes for existing data**:

### 1. Allergen Info
```sql
ALTER TABLE menu_items ADD COLUMN allergens TEXT[];
-- Client marks item: ["gluten", "dairy", "nuts"]
```
**Directus UI:** Checkboxes for common allergens appear automatically

### 2. Inventory Tracking
```sql
CREATE TABLE inventory (
  item_id VARCHAR(50) REFERENCES menu_items(id),
  stock_qty INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  last_updated TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (item_id)
);
```
**Use case:** Auto-mark items as unavailable when stock = 0

### 3. Multi-Language Support
```sql
CREATE TABLE item_translations (
  item_id VARCHAR(50) REFERENCES menu_items(id),
  language VARCHAR(10),  -- "en", "de", "fr", "it"
  name VARCHAR(200),
  description TEXT,
  PRIMARY KEY (item_id, language)
);
```
**Use case:** German tourists see menu in English

### 4. Seasonal Menus
```sql
ALTER TABLE menu_items ADD COLUMN available_from DATE;
ALTER TABLE menu_items ADD COLUMN available_until DATE;
-- Auto-hide items outside date range
```
**Use case:** "Pumpkin Soup" only visible Oct 1 - Nov 30

### 5. Item Photos
```sql
ALTER TABLE menu_items ADD COLUMN image_url VARCHAR(500);
```
**Directus:** Upload images via UI, auto-generates thumbnails

### 6. Analytics Dashboard (Built into Directus)
- **Most sold items** (grouped by POS ID)
- **Revenue per category** (Food vs. Drinks vs. Bottles)
- **Average ticket size** (total revenue / # of bills)
- **Peak hours** (orders grouped by hour of day)

---

## 13. Summary: Why This Architecture Wins

| **Aspect** | **Current (Static constants.js)** | **With Database + Directus** |
|------------|-----------------------------------|------------------------------|
| **Menu updates** | Edit code → git commit → deploy | Edit in Directus UI → instant live |
| **Price changes** | Code change → redeploy | Change in CMS → refresh app |
| **New items** | Developer adds to constants.js | Client adds via form (no code) |
| **Client onboarding** | Clone repo → customize → deploy | Run script (5 min) → ready |
| **Multi-client scaling** | Manual per-client repos | Automated DB routing |
| **Data safety** | Code = data (accidental edits) | DB backups + audit logs + rollback |
| **CMS access** | Developers only | Client staff (non-technical) |
| **Downtime risk** | Deploy breaks all clients | One DB fails → others unaffected |
| **Cost (50 clients)** | 50 deployments × manual labor | $72/month VPS + 5 min per client |

---

## 14. Recommended Next Steps

### Immediate (Week 1-2):
1. ✅ **Set up VPS** (DigitalOcean Droplet: $12/month, Ubuntu 22.04)
2. ✅ **Install PostgreSQL** (v15+)
3. ✅ **Install Directus** (v10+)
4. ✅ **Run SQL migrations** (create schema from section 2)
5. ✅ **Import Camidi menu** (write script to convert constants.js → SQL INSERT statements)

### Testing (Week 3-4):
6. ✅ **Test CMS workflow** with your team:
   - Add new item
   - Change price
   - Mark item inactive
   - Verify app reflects changes
7. ✅ **Train Camidi staff** (30-min Zoom call + PDF guide)
8. ✅ **Monitor for 1 week** (watch for bugs, performance issues)

### Rollout (Week 5+):
9. ✅ **Onboard second client** (test automation script)
10. ✅ **Refine workflows** based on feedback
11. ✅ **Add documentation** (update CLAUDE.md with API endpoints)
12. ✅ **Scale horizontally** (add clients as needed)

---

## 15. **Answer to Your Question: YES, Perfect Fit!**

Your guideline:
> "Each client gets their own database or schema (Postgres/MySQL). Code stays the same, only DB connection differs. This ensures: No accidental data leaks, Easy backups per client, Easier future scaling."

**This plan implements your guideline EXACTLY:**
- ✅ **Each client = separate PostgreSQL database** (`tableorders_camidi`, `tableorders_brasserieX`, etc.)
- ✅ **Code stays identical** (same React app, same SQL schema structure)
- ✅ **Only config changes** (URL routing determines which DB to connect to)
- ✅ **Zero data leak risk** (DB-level isolation)
- ✅ **Per-client backups** (`pg_dump tableorders_camidi`)
- ✅ **Easy scaling** (add new DB, route `/clients/newClient` → new DB)

**Additional benefits this plan adds:**
- 🎨 **CMS for non-technical users** (Directus auto-generates admin UI)
- 🔄 **Instant menu updates** (no redeploy needed)
- 📊 **Built-in analytics** (Directus Insights module)
- 🚀 **Fast onboarding** (5-min script vs. hours of manual setup)

**You're ready to scale!** 🚀
