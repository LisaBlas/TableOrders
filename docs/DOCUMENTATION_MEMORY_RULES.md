# Documentation Memory Rules

Use these rules when updating project documentation for future agent sessions.
The goal is "just enough durable context to implement cleanly."

## Session Memory Files
`AGENTS.md` and `CLAUDE.md` are mirrored project memory files. Keep them aligned
in substance and update both together.

They should contain:
- Stable architecture decisions and boundaries.
- Commands, deployment workflow, and verification expectations.
- Production gotchas and safety rules.
- Data model, sync, auth, demo, and table-management behavior that affects code.
- Links to focused docs that own deeper details.

They should not contain:
- Session summaries, task lists, or temporary plans.
- Full changelogs or commit-by-commit history.
- Exhaustive component inventories.
- Details already owned by focused docs unless a short reminder prevents common
  implementation mistakes.
- Obvious React/Vite mechanics that are not project-specific.

## Focused Docs
- `docs/SYSTEM_INVARIANTS.md`: hard behavioral invariants that must not be
  violated.
- `docs/DIRECTUS_SCHEMA.md`: Directus collections, fields, query assumptions,
  and schema/data integrity rules.
- `docs/MEMORY.md`: durable sync architecture notes and historical gotchas that
  are too detailed for session memory.
- `docs/TABLE_MANAGEMENT_DECISION.md`: table-management product direction.
- `docs/RECENT_CHANGES.md`: short historical notes only when useful for future
  debugging or audit context.
- Feature-specific docs: use only when a feature needs more detail than belongs
  in session memory.

## Audit Workflow
1. Inspect source code and focused docs before editing memory files.
2. Use commit history to find likely undocumented clusters, but treat source as
   the source of truth.
3. For each implementation cluster, decide whether the durable fact belongs in
   mirrored session memory, a focused doc, or nowhere.
4. Prefer behavior-level bullets over file-by-file inventories.
5. Remove stale or duplicated details while adding new ones.
6. After edits, compare `AGENTS.md` and `CLAUDE.md` for consistency.

## Current High-Value Audit Clusters
- Navigation shell, mobile bottom nav, and `ProfileMenu`.
- Dark mode and text-scale persistence.
- Daily Sales Timeline/Sales tabs and POS crossing summary.
- Analytics KPI, peak hours, top tables, and business-day handling.
- Business day cutoff and Berlin timezone assumptions.
- Temporary dynamic tables versus future permanent table setup.
- Demo mode build/deploy/runtime behavior.

## Verification
Docs-only changes do not require a build. Before finishing, review:
- `git diff -- AGENTS.md CLAUDE.md docs`
- No stale table counts, auth claims, deployment rules, or secret references.
- No secrets, credentials, or production data.
- No task-list or session-summary content in session memory.
