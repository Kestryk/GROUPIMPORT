# EED-UI-2026-0022 — Grouping presentation and filter regressions

Status: follow-up visual regression confirmed on promoted commit `d93acd7`;
the corrected single-frame composition is implemented and statically
validated. A new preview promotion, Playwright run and human visual acceptance
remain pending.

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
- The attempted internal frame (`left: 0`) painted beside the card's existing
  identity border and caused the visually duplicated desktop rail. Replacing
  the open frame with the base rail also lost the established responsive open
  treatment. Both overrides are removed: the canonical open pseudo-frame once
  again overlays the existing identity-border width in desktop and responsive
  layouts, while the existing Complete View z-index prevents neighbouring
  cards from covering it. Card width and padding are unchanged.
- Expanded focus-within states preserve the open surface colour on the left
  identity border. The contained focus treatment still paints the top, right
  and bottom edges, but no longer exposes a blue closed-state rail underneath
  the open pseudo-frame.
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
- Generated CSS assertions for chevron, filter states, Complete View z-index
  and the canonical negative-offset open frame: passed. Assertions also
  confirm that no desktop/responsive internal-frame or frame-suppression
  override remains.
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
- The visual review of that preview found duplicated Grouping rails on desktop
  and responsive layouts. The focused scenario now asserts that the open frame
  overlays exactly one identity-border width and that opening does not change
  card width; its corrected-build run is pending.
- The first corrected-build run
  `easystud-authenticated-20260809T191515645Z-38564` stopped on the new desktop
  assertion with measured base border `rgb(138, 188, 227)` versus open-frame
  surface `rgb(247, 250, 252)`. This isolated the remaining focus-within colour
  override; credentials, owned browser process, external profile and runtime
  lease were all cleaned up.
