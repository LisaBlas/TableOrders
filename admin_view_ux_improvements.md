- [x] Make the desktop table more task-focused
Keep visible columns to: availability, name, category/subcategory, price/variants, POS ID, edit. Move Dest., Min, and Sort into the edit panel
- [x] Show variant prices inline
Replace 4 variants with compact labels like Here €18 · To Go €16 · 0,1 €6. For long variant sets, show the first 2-3 and a +1 indicator.
- [x] Make the whole row selectable
Right now the Edit button is the obvious target. Let the full row open the edit panel or bottom slider, while keeping the availability toggle isolated.
- [x] Improve selected-row state
The selected row is subtle. Add a clearer left border, stronger background, or persistent "Editing" state so the relationship between row and side panel is obvious.
- [x] Add quick filters for real workflows
Useful filters would be: Missing POS ID, No price, Unavailable, Has variants, Min qty > 1
- [x] Add validation/problem badges
Surface issues directly in the row: missing price, missing POS ID, empty variant price, duplicate POS ID, invalid min qty. This turns admin into a quality-control tool.
- [x] Separate "menu editing" from "system fields"
Staff-facing admin needs name, price, variants, availability. Technical fields like sort_order, destination, and POS mapping can live under an "Advanced" section in the panel.
- [ ] Make ordering editable visually
If sort_order matters, don't just display it. Add drag handles within category sections or simple move up/down controls.
- [ ] Improve category management
Because categories are inferred from items, empty categories are weak UX. Fetch Directus categories directly so Food/Wines/Drinks/Shop are always first-class, even when empty.
- [ ] Make variant POS behavior explicit
Since variant POS IDs are derived from base POS ID plus suffixes, show a small read-only preview in the row or panel: Base 42 → 420, 421, 422.
- [x] Keep mobile card mode, but add key metadata
Mobile rows should show availability, name, short name, price/variant summary, and category. Don't show the full schema unless expanded or editing.
- [x] Add optimistic save indicators
Availability already toggles optimistically. For panel edits, show a clear saving/saved/error state, especially since Directus writes can partially span item + variants.
- [ ] Group desktop table by category optionally
The mobile view groups by category, but desktop uses one flat sorted table. Add a grouped mode for menu maintenance and keep flat sortable mode for auditing.
