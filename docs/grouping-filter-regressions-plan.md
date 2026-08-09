# EED-UI-2026-0022 — Grouping presentation and filter regressions

Status: source correction implemented; static validation passed; follow-up
commit `d93acd7` is promoted in the cumulative Moodle 5.1 preview with caches
purged. Human visual acceptance remains pending; Playwright has not been run
for this follow-up.

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
- In Complete View, the open Grouping frame is kept inside the existing card
  box (`::after { left: 0; }`) and its identity icon is recentered inside the
  same box. This addresses the tree scroll container clipping the old
  externally painted left edge without changing card dimensions.
- Responsive Grouping cards keep the base identity rail as their only left
  edge. The later mobile rule that re-enabled the generic open pseudo-frame is
  explicitly overridden, so an expanded Grouping cannot render a double rail.
- Complete View now follows the live Motion disclosure height on each
  animation frame. The structure column therefore moves with the existing
  filter transition instead of jumping only after the transition completes.
- The responsive `structure-groupings` filter now uses `.is-expanded` and
  `.is-collapsed` instead of treating `hidden=false` as the open state. This
  preserves the existing Motion expand/collapse transition while releasing the
  collapsed panel height.

## Changed source and generated asset

- `scss/components/_structure.scss`
- `scss/responsive/_desktop.scss`
- `scss/responsive/_mobile.scss`
- `amd/src/course_manager.js`
- `amd/build/course_manager.min.js` and `.map`
- `tools/playwright/filter-panel-geometry.spec.js`
- `styles.css` (generated from `scss/easystud.scss`)

No Mustache template, Navigation, Guide, Skeleton, UI Kit or runtime fixture
files were changed.

## Validation record

- `sass scss\\easystud.scss styles.css --no-source-map`: passed; existing Sass
  mixed-declaration deprecation warnings remain.
- `git diff --check`: passed.
- `node --experimental-default-type=module --check amd\\src\\course_manager.js`
  and `node --check tools\\playwright\\filter-panel-geometry.spec.js`: passed.
- `node tools\\release\\build-course-manager-amd.js` with the approved local
  Terser toolchain: passed; generated AMD and source map were refreshed.
- Generated CSS assertions for chevron, filter states, Complete View z-index,
  the internal desktop frame and the responsive single-rail override: passed.
- Source/AMD assertions for the Complete View animation-frame synchronisation:
  passed.
- A first run against the unpromoted active runtime stopped at
  `filter-panel-geometry.spec.js:140` because the served AMD/cache state did
  not expose the transient `is-easyedu-disclosing` class. Source and generated
  Motion assets already contained that class; no JavaScript correction was
  required.
- The WIP commit `86ad03e` was then promoted to
  `preview/moodle51/easystud-ui-2026-0022` at runtime HEAD
  `986b23e229cec2cf325656e506b59a761bc75d46`, Moodle caches were purged, and
  the same single-worker scenario passed (`1 passed`).
- Follow-up commit `d93acd7` was promoted to the same cumulative preview at
  runtime HEAD `58cf46bf90dbd6b3699d0aa745fc08fc4b759f31`; Moodle caches were
  purged successfully. The promotion record is
  `%LOCALAPPDATA%\\EasyEdu\\orchestration\\artifacts\\preview-promotions\\easystud\\20260809T172555Z.json`.
- Passing evidence is retained under
  `%LOCALAPPDATA%\EasyEdu\artifacts\easystud\authenticated\easystud-authenticated-20260808T160448608Z-30656`;
  `cleanup.json` records credential clearing, child shutdown, lease release and
  an external profile as complete. The preview record is
  `%LOCALAPPDATA%\EasyEdu\orchestration\artifacts\preview-promotions\easystud\20260808T160432Z.json`.
- Human visual review remains pending; no media was added to Git.
- The new source/asset set is visible at
  `http://localhost/local/groupimport/manage.php?id=5`; it has not yet been
  exercised by Playwright. No new runtime screenshots or raw media were added
  to Git.
