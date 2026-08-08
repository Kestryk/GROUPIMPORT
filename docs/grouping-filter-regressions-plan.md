# EED-UI-2026-0022 — Grouping presentation and filter regressions

Status: source correction implemented; static validation passed; the single
leased Moodle 5.1 scenario was executed and is blocked by a stale animation
class assertion before the geometry checks; visual acceptance remains pending.

## Scope

This EasyStud-only correction covers responsive Grouping card border layers,
the open Grouping chevron, Complete View desktop rail stacking, and the
responsive `structure-groupings` More-filters disclosure. Navigation, the
Grouping rail owner (EED-UI-2026-0021), Guide, Skeleton, the message modal
(EED-UI-2026-0023) and the canonical UI Kit are outside this change.

## Source states and corrections

- The Grouping disclosure controller changes the icon from
  `fa-chevron-right` to `fa-chevron-down`. The plugin selector for
  `[aria-expanded="true"]` now leaves that glyph unrotated.
- Responsive search/add panels auto-expand a Grouping card. Their child guide
  border is removed only while one of those panels is open; the outer card
  dimensions and the responsive open rail remain unchanged.
- Complete View gives an expanded Grouping card a local paint-stack z-index so
  neighbouring cards cannot cover its externally painted rail.
- The responsive `structure-groupings` filter now uses `.is-expanded` and
  `.is-collapsed` instead of treating `hidden=false` as the open state. This
  preserves the existing Motion expand/collapse transition while releasing the
  collapsed panel height.

## Changed source and generated asset

- `scss/components/_structure.scss`
- `scss/responsive/_desktop.scss`
- `styles.css` (generated from `scss/easystud.scss`)

No JavaScript, Mustache template, Navigation, Guide, Skeleton, UI Kit or
runtime fixture files were changed.

## Validation record

- `sass scss\\easystud.scss styles.css --no-source-map`: passed; existing Sass
  mixed-declaration deprecation warnings remain.
- `git diff --check`: passed.
- `node --experimental-default-type=module --check amd\\src\\course_manager.js`:
  passed; the AMD source was not modified.
- Generated CSS assertions for chevron, filter states, Complete View z-index
  and responsive border selector: passed.
- The single leased scenario
  `filter-panel-geometry.spec.js` / `filter columns preserve desktop alignment
  and responsive accessibility` ran with one worker and failed at
  `filter-panel-geometry.spec.js:140`: the test expects
  `is-easyedu-disclosing`, while the current AMD controller exposes only
  `is-expanded`. The geometry assertions were not reached.
- External evidence is retained under
  `%LOCALAPPDATA%\EasyEdu\artifacts\easystud\authenticated\easystud-authenticated-20260808T154105449Z-28388`;
  `cleanup.json` records credential clearing, child shutdown, lease release and
  an external profile as complete. No preview, cache purge or human visual
  review was performed.
