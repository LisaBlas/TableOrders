🎯 Critical Issues
1. ~~Console.logs in Production (directusBills.ts)~~ ✅ DONE (2026-04-26)

~~console.log("✅ Token loaded:", DIRECTUS_TOKEN.slice(0, 15) + "...");~~
~~console.log("📤 Fetch bills headers:", headers);~~
~~console.log("📥 Response status:", res.status, res.statusText);~~
Removed token fragment log, fetch debug logs, and alert(). Kept the console.error on missing token (legitimate startup signal) and the rollback error log.

2. Type Safety Band-aids (32 instances of as any)
Scattered across OrderBar.tsx, MenuItemCard.tsx, BillCard.tsx, useMenuItems.ts.

Why it's slop: Types should be fixed, not cast away. Example:


{(o as any).shortName || o.name}  // Type should include shortName
Fix: Add shortName?: string to OrderItem type definition.

⚠️ Performance & Over-Engineering
3. ~~Excessive Memoization (useTableOrder.ts)~~ ✅ DONE (2026-04-26)
Removed 5 of 7 useMemo calls (unsent, sent, total, unsentTotal, sentTotal). Kept items and batches memoized since they depend on external context state. Also dropped unused OrderItem import.
4. Hook Proliferation
11 custom hooks for 5,962 LOC (~542 LOC per hook)
Some hooks wrap single operations (useSubcategoryState.ts, useLongPress.ts)
Why it's slop: AI loves extracting hooks. Some are good (useDirectusSync, useTableOrder), but others are over-abstraction.

Consider consolidating: useBillEdit + useTableClose could be methods in TableContext.

5. ~~Defensive Null Checks~~ — FALSE POSITIVE, do not remove
`orders` state is initialized as `{}` (empty record), not per-table. `prev[String(tableId)]` IS undefined for new tables, so `|| []` is a real guard — not noise. Removing it would crash addItem/removeItem/etc. on first use.
Real fix if desired: initialize `orders[tableId] = []` in `seatTable`, making downstream guards redundant. That's a behavior change, not a cleanup.

🧹 Code Smell
6. ~~Magic Numbers~~ ✅ DONE (2026-04-26)
Added DEBOUNCE_DELAY_MS, POLL_INTERVAL_MS, OWNERSHIP_GRACE_MS, MAX_RETRIES to appConfig.ts (LONG_PRESS_MS was already there). Wired all four into useDirectusSync.ts.

7. Inconsistent File Extensions — PARTIAL (2026-04-26)
helpers.js → helpers.ts ✅ (typed: all functions have proper TS signatures)
tokens.js → tokens.ts ✅ (types inferred)
constants.js → ⏳ pending (static menu/config data, ~800 lines)
appStyles.js → ⏳ pending (CSS objects, ~2100 lines; covered by appStyles.d.ts in the meantime)

Note: sandbox blocked mv/rm, so old .js files coexist as dead code. TypeScript prefers .ts at import time. Old files safe to delete from a terminal.

8. Dead Dependency Check (useDirectusSync:109)

}, [remoteSessions]); // eslint-disable-line react-hooks/exhaustive-deps
Only one eslint-disable in the entire codebase — but it's hiding missing dependencies (setOrders, setSentBatches, etc.).

Fix: Either add all deps or wrap setters in useCallback with empty deps.

🤖 Classic AI Patterns (Not bugs, but "vibes")
9. Verbose Ternaries

const cardBg = isSource ? "#fffbeb" : isTarget ? "#eff6ff" : cfg.bg;
const cardBorder = isSource ? "2px solid #f59e0b" : isTarget ? "2px solid #3b82f6" : `1.5px solid ${cfg.border}`;
Human version:


if (isSource) return { bg: "#fffbeb", border: "2px solid #f59e0b" };
if (isTarget) return { bg: "#eff6ff", border: "2px solid #3b82f6" };
return { bg: cfg.bg, border: `1.5px solid ${cfg.border}` };
10. Over-Descriptive Props (TableCard.tsx)
17 props for a card component. Half could be derived or grouped:


// Current
<TableCard tableId={...} cfg={...} isSource={...} isTarget={...} inSwapMode={...} destinations={...} isWide={...} baseStyle={...} staggerIndex={...} onPointerDown={...} />

// Better
<TableCard tableId={...} status={swapStatus} cfg={...} destinations={...} style={...} handlers={...} />
11. Animation Overkill
Every transition has 3 phases (idle → exit → enter) with hardcoded timeouts:


setTimeout(() => setPhase("exit"), 300);
setTimeout(() => setPhase("enter"), 350);
setTimeout(() => setPhase("idle"), 780);
Why it's slop: Timing bugs guaranteed if one changes. Use CSS animationend events or a single timeout.

✅ What's Actually Good
File size discipline: Largest file is 343 LOC (well below bloat threshold)
Clean separation: Contexts, hooks, services, views properly organized
Type coverage: ~95% TypeScript (just fix those .js stragglers)
No god objects: State properly distributed across contexts
Minimal deps: TanStack Query + React, no bloat
