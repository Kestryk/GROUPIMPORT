# Changelog

All notable changes to `local_groupimport` are documented here.

Maintenance convention:

- Changes are grouped by work day to avoid one entry per micro-adjustment.
- The `Unreleased` entry contains changes currently present in the worktree but not yet shipped in a version/tag.
- Retrospective entries are reconstructed from the local Git history and the available development context.

## Unreleased

### 2026-08-09

#### Fixed

- Restore the established single open Grouping frame on desktop and responsive
  layouts. The open pseudo-frame again overlays the existing identity rail
  instead of being placed beside it or replaced by the closed-state rail;
  card width, padding and disclosure motion remain unchanged.

#### Validation

- Static Sass, generated-CSS and Playwright syntax checks pass. The focused
  browser scenario now measures one overlaid rail width at desktop and 390 px;
  preview promotion and the leased run remain pending.

### 2026-08-08

#### Fixed

- Correct Grouping presentation and filter regressions for EED-UI-2026-0022:
  keep the responsive child guide from duplicating the card border while
  search/add panels are open, keep the open chevron pointing down, lift the
  expanded Complete View Grouping rail above neighbouring cards without
  changing geometry, and let the collapsed responsive Grouping filter release
  its reserved height.
- Follow the existing Motion filter height on each frame so the Complete View
  structure column moves with the same transition as the opposite column.
- Remove only the redundant responsive hover-help bubble from the EasyStud
  Guide launcher. Its visible localized label, accessible name, focus styling,
  gradient animation and Guide activation remain unchanged.

#### Validation

- EED-UI-2026-0022 runtime validation first exposed an unpromoted Moodle
  AMD/cache state, then passed after WIP commit `86ad03e` was promoted and
  Moodle caches were purged. The prepared single-worker scenario reached all
  geometry, responsive accessibility, Motion and focus assertions; lease,
  credentials and isolated profile cleanup completed successfully. Human
  visual acceptance remains pending. The follow-up rail and Complete View
  animation corrections are statically validated but still await a new
  preview/runtime pass under the Moodle 5.1 lease.

### 2026-08-06

#### Fixed

- Move the phone Navigation trigger's existing token-sized clearance above the
  viewport centre so it remains reachable without covering an expanded
  Grouping identity rail; card geometry, motion and Navigation behavior are
  unchanged.

### 2026-08-05

#### Fixed

- Stack the responsive selected-group action tray through 800 px so the
  selected-count summary cannot cover the first action; reserve matching list
  clearance while retaining the existing actions, labels and motion.
- Keep the expanded responsive Grouping rail and its icon inside the existing
  card box, preventing the horizontally clipped workspace from hiding either
  one without changing rail or card dimensions. The separate shared-navigation
  trigger collision remains routed to its Navigation owner.
- Complete the Guide target adapter audit: Show in interface and guided-path
  steps now open the concrete EasyStud field, card control or grouping panel
  before highlighting it, rather than stopping at a generic workspace.
- Keep the responsive and desktop variants intentional: desktop can direct the
  learner to Move participant or the participant card, while compact layouts
  open the real More actions control on that card.
- Highlight the visible participant selection control instead of its hidden
  native input, and cancel superseded delayed target openings when a learner
  changes guided-path step.

#### Validated

- Passed the exact authenticated selected-action-tray scenario at 777 px with
  an expanded Group: the summary is separate from the two action rows, all four
  actions remain in bounds, stderr and page/console errors are empty, and
  credential/profile/lease cleanup completed.
- Passed the consumer-geometry portion of the authenticated expanded-Grouping
  rail scenario at 390 px: card width is unchanged, rail and icon are in
  bounds, no horizontal overflow occurs, and cleanup completed. The final
  multi-height check correctly detects the separately owned navigation trigger
  covering one rail point, so this is not recorded as final visual acceptance.
- Passed one authenticated Guide target-audit scenario at 1280 x 900 and
  390 x 844. It exercised every Show in interface slide and every guided-path
  step against a usable visible control, with external desktop and compact
  captures and complete credential/profile/lease cleanup.

### 2026-08-04

#### Fixed

- Keep responsive Guide checklist and return surfaces dynamically above the
  selected-item action tray, including when that tray wraps or resizes.
- Contain the completed checklist close control, align its return/close styles
  with Show in interface, and remove responsive checklist side borders.
- Prevent the compact `Everything is set` label from leaking into expanded
  desktop feedback, match the compact success/button heights, centre the close
  glyph and preserve space beside an unfinished minimized step.
- Keep the left identity rail of an expanded Complete View group card above
  neighbouring column overflow without changing card dimensions.
- Give initial and revealed responsive group-member rows the same height.
- Align responsive more-actions triggers with participant, group and grouping
  card control rows.
- Add measured Playwright coverage for responsive card-menu alignment across
  Participant, Group and Grouping cards.
- Add a leased browser regression scenario for selected-group action-tray
  containment at intermediate responsive widths.
- Stack the selected-action tray at 800 px and below so its summary cannot
  overlap group actions at the intermediate responsive boundary.

#### Validated

- Passed the focused Guide transition scenario at 390 px with assertions for
  top-only checklist border, compact close containment, shared action styling
  and non-overlap with the selected-item action tray.
- Recorded user acceptance of the Mass Import shared navigation at desktop and
  390 px. The accepted rail keeps the four specified actions, omits Back to
  course and preserves the compact Import history workflow.
- Closed the canonical `EED-NAV-2026-0005` record after the global
  evolution-history validator passed for 37 batch pages. This records the
  approved Navigation delivery without changing Moodle runtime behavior.

### 2026-08-03

#### Fixed

- Replaced the legacy Mass Import header action row with the shared EasyStud
  navigation rail at the same semantic location, immediately after the title
  and introductory copy. The rail keeps Simplified student management, Mass
  group import, Download example and Import history, while deliberately
  omitting Back to course.
- Preserved the frozen loading bootstrap, container attributes, Skeleton,
  real-content wrapper and Skeleton SCSS. The narrow user-approved exception
  is limited to the former header-action region.
- Bound Import history to every rendered shared-navigation trigger and return
  focus to the visible compact navigation handle when its source item belongs
  to a closed off-canvas panel.
- Corrected the EasyStud saved-credential runner default to use the
  GroupImport active-runtime lease; fixture and cache operations retain their
  separate leases.

#### Validated

- Prepared an isolated Moodle 5.1 source checkout with the declared Node
  22.11 toolchain and generated `csv_import` with official targeted
  `grunt amd`. Promotion manifests record the exact source and generated
  hashes outside Git.
- Selectively refreshed Moodle `theme`, `js` and `template` caches through
  the supported API under the cache-purge lease. The exact authenticated
  desktop/390 px scenario passed with no page or console errors, external
  screenshots, process-local credentials, isolated profile and released lease.
- Ran the manifest-led artifact-retention simulation for the completed
  navigation evidence. It found expired managed media but removed nothing;
  legacy/unmanaged captures remain outside its deletion scope.

### 2026-08-02

#### Fixed

- Added the shared EasyStud navigation to the Mass Import workspace without
  changing its validated loading root: the navigation is rendered as its own
  sibling before the loading boundary, marks Mass group import as current and
  retains Simplified student management as the product destination.
- Kept the Mass Import compact trigger vertically centred on phone layouts
  without the participant-selector clearance that belongs only to Simplified
  Student View. The compact panel contains only the two relevant product
  destinations; it does not duplicate participant navigation or the Guide.
- Began the responsive Groups/Groupings repair: compact group cards no longer
  show grouping metadata, their overflow menu retains the information modal,
  the selected-group removal action uses a shorter label, and a collapsed
  mobile filter panel no longer reserves blank space. Member rows now have a
  consistent responsive rhythm, Complete View columns remain independent while
  filters are open, and the responsive busy spinner matches the desktop ring.
  The Groups filter panel is now visible only while its existing disclosure is
  expanded, preventing both the empty collapsed slot and the hidden open panel.

#### Validated

- Passed the focused, one-test authenticated Moodle 5.1 Mass Import navigation
  scenario at desktop and 390 px widths. It proved sibling loading-root
  isolation, current state, Escape close, centred compact placement, no
  horizontal overflow and no page or console errors. Evidence is external and
  manifest-registered.

### 2026-08-02

#### Fixed

- Stabilized the compact EasyStud navigation half-pill at the left viewport
  edge: tablet layouts centre the rendered control vertically without using
  changing participant or Moodle-drawer geometry; phone layouts keep the
  nearest safe placement just below the centred participant selector.
- Preserved the vertical centring translation during reduced-motion requests,
  while retaining the existing horizontal hover affordance.
- Added a focused authenticated regression matrix for the compact trigger,
  including its true rendered size, hover completion, scroll/resize cycle and
  collisions with the native Moodle drawer, participant selector and Guide
  source.

#### Validated

- Passed one-test authenticated Moodle 5.1.3 checks at 1024 x 768, 768 x 1024
  and 390 x 844. Each run used a process-local DPAPI credential, isolated
  profile, exclusive runtime lease and external artifact manifest.

### 2026-08-01

#### Fixed

- Made compact guided paths start in a bounded minimized state that keeps the
  active actionable step visible; completion replaces it with feedback and the
  return-to-Guide action.
- Routed each Guide slide and guided-path step to its matching responsive
  workspace: Participants, Groups or Groupings. Desktop layouts remain the
  fallback, while compact users no longer land on an unrelated structure view.
- Preserved resolved EasyStud theme tokens when the compact Guide is portalled
  to `document.body`, restoring slide, carousel, action and return-panel
  colours without placing the modal back inside the navigation drawer.
- Refined the responsive "add participants" guided step to highlight the
  available Actions trigger on a participant card, not only the Participants
  workspace.
- Kept guided-checklist headers and translated step labels inside their desktop
  fixed panel through the shared bounded-width contract.
- Restored the compact EasyEdu Guide launcher after its responsive-navigation
  regression: the initialized Guide root stays portalled outside the
  transformed drawer, its modal now layers above the drawer, and the cloned
  compact trigger receives its full-width gradient styling without requiring
  the desktop Guide wrapper.
- Restored supervised EasyStud Playwright discovery through a versioned local
  configuration, so the wrapper selects its explicit spec before acquiring a
  lease or loading the process-local DPAPI credential.
- Applied the approved contained focus context to group and grouping identity
  cards, preserving their semantic rails, selected/expanded states and the
  normal outer ring on the focused action or disclosure control.
- Corrected nested group focus: the group retains its green identity rail and
  is the sole contextual card when its participant control has focus; its
  enclosing grouping no longer receives a second focus treatment.

#### Validated

- Passed the focused group/grouping card keyboard-focus scenario on Moodle 5.1
  in run `easystud-authenticated-20260801T113359577Z-37064`: one selected test,
  two external captures, empty Playwright stderr and complete
  credential/profile/lease cleanup. No action or data mutation occurred.

### 2026-07-31

#### Fixed

- Restored the compact EasyEdu Guide launcher by moving its complete initialized
  root into the open responsive navigation panel instead of cloning only the
  button. The full-width gradient row is styled again and opens the real Guide
  modal from a visible DOM branch.
- Contained the participant-card focus context inside its identity-rail shell,
  preventing the parent halo from entering the left list gutter while the
  details action retains the normal visible keyboard ring.
- Harmonized the non-navigation rename action and participant-card focus
  surfaces with the shared EasyEdu ring geometry while preserving their
  existing motion transitions and card elevation.
- Harmonized settings and participant-detail disclosure summaries with the
  shared EasyEdu keyboard-focus ring while preserving their existing layout
  and disclosure motion.
- Kept the rename action's shared ring above Moodle Bootstrap's later
  `.btn-link` inset focus halo so the visible geometry remains consistent.
- Reserved visible overflow around settings/detail summaries so their outer
  focus ring is not clipped by the disclosure shell.
- Harmonized Mass Import's real upload toggle and history-modal close focus
  states with the shared control-focus border while preserving their existing
  upload disclosure and modal transitions.
- Aligned the rename action and participant-card focus borders/rings with the
  validated EasyEdu control-focus border (`#8abce3`) instead of local muted
  grey-blue overrides or a transparent theme token override, while preserving
  the participant card's semantic rail.
- Preserved equal collapsed filter-shell heights while making one-sided
  disclosures independent: opening Participants, Groups or Structure filters
  no longer stretches the opposite filter card, and the paired card lists
  still begin on one shared baseline.
- Reused the hidden desktop Groupings disclosure row as a non-interactive
  layout placeholder, so the column without desktop filters keeps the same
  collapsed rhythm without a hard-coded height.
- Corrected the reusable geometry scenario to compare positions relative to
  the EasyStud root instead of the browser or Moodle scroll viewport, and made
  any captured browser console/page error fail the scenario automatically.
- Restored the existing Motion-driven opening and closing transition for
  advanced filters without reintroducing the old `hidden` layout regression.
  The geometry scenario now asserts the transitional disclosure state in
  normal-motion mode.
- Made the fixed compact navigation handle explain itself on hover and keyboard
  focus: it now expands from the left edge with the localized `Open EasyStud
  menu` title, while preserving its Moodle-style half-pill, collision-safe
  placement and compact idle state.
- Prevented the compact Guide-row label from being clipped: its flexible text
  area now has explicit line-height and padding, without inherited hidden
  overflow.

#### Changed

- Reworked compact Guide composition across modal titles, slide content,
  learning scenes and guided paths: balanced centred header, Previous/Next
  controls above Step, top identity accents, centred copy, one full-width
  guided-path flow, and vertical
  downward-flow diagrams with proportionate child icon sizes.
- Place the compact guided-path start action below its icon and copy as a
  full-width bordered row, centre the slide icon and remove the residual left
  rail from compact Guide content.
- Ensure the compact guided-path body and start action override the later
  desktop grid and stretch across the full stacked card width.
- Preserve guided-path progress while moving between the Guide modal,
  checklist, highlighted interface target and return actions.
- Close the compact navigation drawer when a Guide action leaves for an
  interface highlight or guided checklist, while retaining normal menu reopen.
- Make the responsive Guide audit wait for the idempotent navigation-controller
  binding instead of racing Moodle's asynchronous AMD callback.
- Return the responsive audit explicitly to the EasyStud management route
  after Moodle's interactive-login landing redirect, so its guide assertions
  cannot accidentally inspect the standard course page.

#### Validated

- Rebuilt the Moodle 5.1 Sass output and passed the participant-card focus
  containment scenario in run `easystud-authenticated-20260731T141458564Z-41564`:
  one selected test, three external captures, empty Playwright stderr, no
  console/page errors and complete credential/profile/lease cleanup. The
  details action was focused but no data was mutated.
- Rebuilt the Moodle 5.1 Sass output and passed the focused Structure action
  focus scenario in run `easystud-authenticated-20260731T133234722Z-4612`:
  one selected test, three external captures, empty Playwright stderr, no
  console/page errors and complete credential/profile/lease cleanup. No group
  or member action was invoked.
- Rebuilt the Moodle 5.1 Sass output and passed the focused inline and
  advanced-filter focus scenario in run
  `easystud-authenticated-20260731T132736817Z-38800`: one selected test, three
  external captures, empty Playwright stderr, no console/page errors and
  complete credential/profile/lease cleanup. Existing form and disclosure
  transitions were preserved and no values were submitted.
- Rebuilt the Moodle 5.1 Sass output and passed the focused Administration
  real-content focus scenario in run
  `easystud-authenticated-20260731T131544597Z-12484`: one selected test, four
  external captures, empty Playwright stderr, no console/page errors and
  complete credential/profile/lease cleanup. No settings were submitted.
- Rebuilt the Moodle 5.1 Sass output and passed the focused Mass Import
  real-content history open/close scenario in run
  `easystud-authenticated-20260731T130529709Z-28184`: one selected test, two
  external captures, empty Playwright stderr and complete
  credential/profile/lease cleanup. The upload-toggle parity remains covered
  by source/static checks because no preview/file mutation is authorized here.
- Rebuilt the Moodle 5.1 Sass output and passed the focused authenticated
  summary-focus scenario in run
  `easystud-authenticated-20260731T124755890Z-19008`: one test selected, three
  external captures, empty Playwright stderr and complete
  credential/profile/lease cleanup.
- Rebuilt Sass and the named `course_manager` AMD module from source, refreshed
  the Moodle 5.1 theme/JavaScript caches under leases, and passed the exact
  authenticated six-width scenario with nine manifested external captures,
  no console/page errors, axe checks and complete credential/profile/lease
  cleanup.
- Revalidated that same leased scenario after the Motion restoration; it again
  passed with the transition assertion, nine manifested captures and complete
  cleanup.

### 2026-07-30

#### Added

- Added a deterministic guide synchronization/check script and a focused
  source-contract test for the EasyStud adapter.
- Restored the compact-only `Course participants` navigation category. It
  presents the Moodle action-bar dropdown's grouped destinations as links in
  the responsive drawer while leaving the desktop rail and native combobox
  unchanged.
- Added a server-rendered Administration settings skeleton that leaves Moodle's
  native settings controls intact while dependency and show/hide logic settles.
- Reused the shared bottom-right `Loading in progress` indicator for the
  Administration settings bootstrap, with reduced-motion and forced-colors
  fallbacks.

#### Changed

- Corrected the authenticated desktop Guide launcher check to compare
  navigation geometry relative to its rail, so Playwright pointer scrolling is
  not misreported as navigation reflow.
- Stabilized the compact Guide header as a two-column title/close row and
  suppress the desktop-only map there, preventing the close action from
  wrapping below the title on narrow screens.
- Reworked the shared desktop filter-column composition so collapsed and
  expanded disclosures reserve one normal-flow row across Participants, Groups
  and Groupings. Opening one disclosure no longer shifts the paired panel or
  either list; responsive workspaces still collapse filters independently.
- Rebuilt the named `course_manager` AMD output and source map from the updated
  source with the official Moodle 5.1 Rollup task. The expanded filter geometry
  scenario now records external review captures for collapsed, one-sided,
  Structure and all three compact workspace states.
- Synchronized the human-approved shared responsive guide into EasyStud:
  bottom-sheet geometry, bounded guided-panel scrolling, focus/scroll
  lifecycle, RTL behavior, detached-target cleanup, forced colours and reduced
  motion.
- Aligned compact Guide internals: title and close action share the header row,
  slides use their full content width and the show-in-interface action moves to
  a dedicated full-width row below the title.
- Preserved the EasyStud-local responsive launcher label while updating the
  shared template landmarks/live region and exposing `init` plus `destroy`
  through the direct AMD wrapper.
- Extended the existing authenticated responsive-guide acceptance scenario to
  register manifested desktop and compact bottom-sheet captures outside Git for
  the required human visual approval, while treating browser-computed
  fully-transparent RGBA colours equivalently regardless of their RGB channels.
- Synchronized the UI Kit compact-navigation containing-block correction so the
  open drawer no longer constrains the viewport-fixed Guide bottom sheet.
- Made the compact Guide geometry assertion relative to the browser's actual
  modal content box after the entry animation, preserving safe-area and
  scrollbar space while rejecting drawer-width containment.
- Synchronized the approved UI Kit focus system across reusable EasyStud
  buttons, forms, cards, menus, pagination, responsive navigation and guide
  controls. Focus now uses one `0.18rem` geometry with semantic colours,
  preserved component shadows and forced-colors outline support.
- Reserved focus-ring space in the scrollable primary navigation rail and
  guided-panel step list to reduce clipping at container edges.
- Replaced remaining EasyStud-local Bootstrap focus halos on participant
  search, create/rename controls and mass-import fields with the canonical UI
  Kit ring mixin, including the shared forced-colors outline fallback.
- Completed the local focus migration for the legacy tour launcher, advanced
  filter selects, context-menu actions, participant/group action buttons,
  tutorial controls, modal/settings fields, mass-import card collapse and
  modal-close actions. Existing elevation or inset state is retained as the
  mixin base shadow while geometry and forced-colors fallback come from the kit.
- Migrated the final member-removal and tag/token controls away from local
  focus suppression; their keyboard state now restores the canonical ring and
  transparent forced-colors outline.
- Expanded advanced-filter regions now switch from collapse clipping to visible
  overflow so the canonical outer ring on native selects remains fully painted.
- Kept the Administration skeleton visible for at least 1200 ms before the
  quiet-period reveal so the structural loading state is perceptible even when
  Moodle's native settings controls settle immediately.
- Added a bounded 180 ms skeleton exit followed by a 180 ms real-content entry
  for Mass Import and Administration settings. The real controls remain inert
  until the ordered reveal completes, while reduced-motion remains immediate.

#### Fixed

- Fixed the Administration settings skeleton markup so the card and section
  fragments are concatenated into the outer `html_writer::div()` content. This
  prevents Moodle 5.1 from receiving a string as the attributes argument and
  removes the cascading `add_body_class()` output-order exception.
- Corrected the Administration skeleton selector specificity so Moodle's broad
  settings-form reset cannot hide the server-rendered loading surface or its
  first fieldset parent, and added an explicit loading-marker priority rule so
  the theme's ID-qualified skeleton reset cannot hide it.
- Replaced the compact navigation trigger with a persistent, fixed left-edge
  Moodle-style half-pill: flat against the viewport edge, rounded toward the
  content, icon-only and hidden while its panel is open. Its measured vertical
  offset keeps it below the visible native Moodle or participant controls.
- Reworked the compact Guide row into one full-width button: the compass icon
  and permanent localized `Open guide` / `Ouvrir le guide` text now share one
  lighter two-colour EasyEdu gradient, without intermediate icon or label
  capsules. Hover/focus changes the background to white and moves the gradient
  onto the enlarged icon, label and border. Responsive Guide-dialog work
  remains separate.
- Resynchronized the compact participant category when Moodle replaces or
  asynchronously completes its native select-menu, so all capability-filtered
  destinations remain present in the responsive drawer.
- Restored a visible keyboard focus ring on advanced-filter disclosures and
  corrected the focused Playwright check to use real Tab navigation. Raised
  responsive column-heading contrast to the WCAG AA threshold with a scoped
  `_structure.scss` override, synchronized the reusable focus tokens back to
  the canonical UI Kit and refreshed the embedded Forms/AI contracts.

#### Validation

- The focused non-navigation surface scenario passed in authenticated Moodle
  5.1 run `easystud-authenticated-20260731T095432987Z-41980`; one test selected,
  two external review captures generated and complete lease/profile/credential
  cleanup.
- Human visual review accepted the aligned filter composition and restored
  Motion-driven disclosure transition on 2026-07-31.
- Extended the reusable filter-panel scenario with one representative
  cross-component focus matrix (desktop navigation, guide launcher, search
  wrapper, advanced select and disclosure), clipping checks, transparent
  forced-colors outline assertions and two external review screenshots. Its
  44 px touch-target check
  tolerates Chromium's subpixel reporting down to 43.99 px without weakening
  the product threshold, and its transparent-outline check accepts the browser's
  computed zero-alpha colour independently of the serialized RGB channels. The
  focus matrix samples each component after its visual transition has settled
  and locates the participant search through its stable, language-neutral DOM
  contract after responsive workspace changes.
- Rebuilt `styles.css` from `scss/easystud.scss` with Dart Sass after the focus
  source synchronization; the build completed without warnings or errors.
- The focused filter-panel scenario passed all six Moodle 5.1 viewports,
  keyboard interaction and axe in external run
  `easystud-authenticated-20260730T073616851Z-18448`, with no page or console
  error and complete credentials/profile/lease cleanup. The preceding
  `easystud-authenticated-20260730T072344530Z-12792` run also passed after the
  selective Moodle theme-cache purge.
- Completed the EED-NAV responsive matrix after the desktop icon restoration:
  1280, 1440, 1920, RTL-1440, tablet-landscape, tablet-portrait and phone all
  passed with one discovered Playwright test per run, no page/console errors,
  external manifests and released runtime leases.
- Validated the fixed left-edge trigger and compact Guide row at 390, 768 and
  1024 px. Each focused run selected one test, proved no overlap and Guide icon
  alignment, and recorded external artifact/cleanup manifests:
  `easystud-authenticated-20260730T093833278Z-24092`,
  `easystud-authenticated-20260730T094016881Z-30284` and
  `easystud-authenticated-20260730T094051388Z-37128`.
- The later full-width Guide-button acceptance run selected one test but was
  blocked before its Guide assertions by the existing Moodle booting state;
  its external manifest confirms credential, profile and lease cleanup. The
  rebuilt stylesheet was nevertheless served with an identical local hash.
- Added non-secret loading-gate diagnostics to the focused responsive audit so
  a future blocked run reports the controller state and event sequence before
  any Guide-button assertion is claimed.
- Re-ran that one-test audit successfully after the transient loading-gate
  delay: the compact full-width Guide button, gradient hover state and icon
  alignment passed with no page or console error and complete isolated-run
  cleanup.
- Validated the inverse-hover revision in one authenticated responsive run:
  the full-width Guide button becomes white on hover/focus while its border,
  enlarged compass icon and label receive the shared gradient.
- Darkened the resting full-width Guide gradient by reducing its white overlay,
  while retaining the white inverse-hover surface and gradient foreground.
- The focused phone workspace passed after the participant-menu timing fix in
  external run `easystud-authenticated-20260730T082720884Z-14424`: all 10
  Moodle destinations matched the responsive copy, with process-local
  credentials and lease cleanup recorded by the manifest.
- Recorded human visual approval for the restored plain desktop navigation icon
  treatment; Docker/CI and other Moodle runtime versions remain deferred.
- The exact Administration skeleton contract passed in external run
  `easystud-authenticated-20260730T071928651Z-40876`: one test selected,
  skeleton shimmer present, fixed bottom-end spinner and complete
  credentials/profile/lease cleanup.
- Revalidated the initial loading visibility after the priority-rule correction
  in external run `easystud-authenticated-20260730T105530516Z-26448`: one test
  passed in 28.9 seconds, with no browser/console errors or overflow, isolated
  profile, process-local credentials and complete cleanup.
- Extended the perceptibility contract to 1200 ms and verified the measured
  loading interval in external run
  `easystud-authenticated-20260730T110726476Z-19892`: one test passed in 23.7
  seconds with complete cleanup.
- Expanded the Administration skeleton beyond the first viewport with three
  overview cards and ten form-row placeholders covering the lower settings
  sections, including a tall multiselect-shaped row.
- Corrected the Administration Playwright login helper so this admin-only case
  does not wait for the Mass Import root before navigating to settings.
- Prevented Moodle's dependency/show-hide controller from re-exposing the 17
  native fieldset children below the Administration skeleton. Their latest
  inline display values are preserved during loading and restored at reveal.
- Validated the synchronized responsive Guide adapter in authenticated Moodle
  5.1 run `easystud-authenticated-20260730T131445127Z-30784`: exactly one
  desktop Guide scenario passed, including modal geometry, open/close behavior
  and native-dropdown stacking, with process-local credentials cleared,
  external profile evidence and the shared lease released.

#### Validation

- Revalidated the Mass Import skeleton and historical bottom-end busy indicator
  in external run `easystud-authenticated-20260730T143532846Z-33664`: one test
  selected and passed on Moodle 5.1 with the skeleton boundary, ready state,
  shared spinner position and label contract, no overflow, isolated profile,
  process-local credentials and complete lease cleanup.
- The full Administration skeleton contract passed in external run
  `easystud-authenticated-20260730T130714944Z-11468`: one test selected, zero
  native children visible during loading, three sections and ten lower rows
  asserted, no console/page errors or overflow, and complete
  credentials/profile/lease cleanup.

### 2026-07-29

#### Added

- Added the Mass Import loading skeleton and deferred its real controls until
  the CSV AMD module is initialised; the historical bottom-right `Loading in
  progress` indicator is reused during bootstrap and actions.

#### Fixed

- Rebalanced the V4 skeleton's loading-to-ready geometry across the active
  Moodle 5.1 responsive ranges: 390 px, 391–520 px, 521–1024 px,
  1025–1100 px, 1101–1200 px and desktop-wide now reserve the corresponding
  ready-state header/navigation height without increasing the intermediate root
  flow height.

#### Validation

- Authenticated V4 width scenarios passed at 390, 520, 768, 1024, 1025,
  1200 and 1440 px. Each run selected exactly one Playwright test before
  credentials/lease, used an isolated external profile and external manifest,
  and released credentials and fixture lease in `finally`.
- The exact Mass Import skeleton contract passed in external run
  `easystud-authenticated-20260730T064923991Z-18200`: one test selected,
  skeleton shimmer present, historical bottom-right spinner fixed with its
  `Loading in progress` label, and complete credentials/profile/lease cleanup.
- The active EED-NAV guide review passed with one selected test in run
  `easystud-authenticated-20260729T152503435Z-29656`: the 1440x1000 modal
  measured 1425 px wide, the dialog geometry passed, participant selection
  stayed aligned, and the external manifest confirms credential and lease
  cleanup. Failure-only geometry diagnostics remain in the retained spec.

#### Fixed

- Restored the established desktop EasyStud navigation icon treatment: plain
  Font Awesome glyphs use a fixed one-rem slot and explicit short label gap;
  the compact panel's tile-style navigation links no longer leak into the
  desktop rail.
- Removed the elevated stacking context from the desktop EasyStud guide source
  so Moodle's native participant dropdown paints above the launcher while the
  guide modal keeps its own fixed elevation.
- Removed the transformed containing block from the desktop guide launcher
  wrapper. The fixed EasyEdu guide modal now keeps viewport dimensions instead
  of collapsing into the narrow navigation rail slot.
- Strengthened the authenticated Guide acceptance scenario with viewport and
  dialog geometry assertions; stale Moodle asset caching was purged once in the
  runtime and the focused test then passed with one selected case.
- Initialised the EasyStud guide AMD before the manager AMD so the loading
  readiness gate cannot expose the Guide button before its modal click handler
  is bound.
- Revalidated the authenticated desktop guide flow with exactly one selected
  Playwright test; opening and closing the guide modal now pass under the
  process-local credential runner with external evidence and lease cleanup.
- Revalidated the native participant dropdown overlap in run
  `easystud-authenticated-20260729T153826197Z-1092`; discovery selected exactly
  one test, the computed guide source layer was `auto`, and the external
  manifest confirms lease release and process-local credential cleanup.
- Revalidated the desktop icon slot, centring and transparent icon surface in
  run `easystud-authenticated-20260729T155125297Z-39844`; one test passed with
  an external artefact manifest and complete lease/credential cleanup.
- Equalised the visible height of the two expanded participant-focus filter
  shells above `1024px` and aligned their More-filters actions through normal
  flex/grid flow, while preserving independent responsive workspaces at
  `1024px` and below.

#### Quality

- Added a focused Moodle 5.1 Playwright geometry/accessibility scenario for
  the 1440, 1280, 1025, 1024, 768 and 390 pixel widths, with animation
  stabilisation, keyboard focus, disclosure ARIA, touch targets and scoped axe
  coverage.

### 2026-07-28

#### Fixed

- Refined the V4 loading skeleton: it now waits for manager visual readiness,
  removes the obsolete boot loading/ready announcements and decorative local
  navigation rail, and shows the shared UI Kit busy indicator without a label
  while the skeleton is active.
- Restored the established bottom-right action spinner and its `Loading in
  progress` label for both real actions and skeleton boot after removing a
  stale central CSS override; stabilised participant and Structure loading
  panels with regular, non-touching vertical spacing.
- Removed the competing busy-indicator pulse transform so the restored circle
  rotates continuously instead of appearing static.
- Kept the loading skeleton over an invisible, layout-measurable manager until
  action controls and responsive overflow calculations have settled.
- Replaced the fixed reveal delay with a visual-stability gate that waits for
  DOM/control mutations and font settling to go quiet before reveal, while
  retaining a 1.5-second fail-open deadline.
- Contained the invisible manager's temporary horizontal overflow during the
  skeleton so its layout pre-calculation cannot create a loading scrollbar.
- Reserved the desktop ready-state header/navigation height so the V4 skeleton
  panel does not jump vertically when the final content is revealed.
- Allowed the authenticated EasyStud runner to execute a spec from an explicit,
  verified `local_groupimport/tools/playwright` source root, preserving exact
  discovery, external artifacts, process-local credentials and fixture leases.
- Reserved the compact ready-state header height before the V4 skeleton
  workspace, eliminating the 143.6px loading-to-ready participant-panel jump.
- Aligned the responsive navigation audit with Moodle's native select-menu
  contract by checking the visible current-page title and EasyStud
  `aria-current` link without treating that title as a selected native
  participant option or requiring the optional inline-label helper element.
- Centred the desktop navigation destinations against the complete rail by
  taking both the guide launcher and its hover/focus capsule out of layout
  flow, with browser geometry coverage before and after label reveal.
- Expanded the reusable navigation geometry contract across 1280, 1440 and
  1920 pixel desktop widths plus RTL, keeping each future Docker/CI candidate
  independently discoverable and executable.
- Validated all four navigation-centering cases through the authenticated
  process-local runner with one selected test per run, external manifests,
  clean lease release and no reported page or console errors.

#### Documentation

- Synchronized the local agent contract with the shared branch/runtime handoff
  and response-routing procedure. Future windows must report the recommended
  next Codex model and task, including for corrections and blocked tests.
- Added the plan/state continuity and reusable Playwright scenario rules to the
  local agent contract for future Docker/CI visual regression work.
- Added the shared development-plan reference and scenario lifecycle guidance;
  valuable Playwright source is retained while generated media stays external.
- Added the portable EasyEdu documentation contract to the plugin instructions,
  covering technical documentation, changelog grouping, AI contracts, batch
  evidence, validation reporting and multi-machine preservation rules.
- Added the shared Playwright visual-artifact retention rule to the agent
  instructions: manifests are required for deletion, raw captures stay outside
  Git/Syncthing and legacy unmanifested media is inventory-only.
- Adopted the environment portability and inventory gate: machine, checkout,
  volume, Git identity and runtime dependencies are recorded before action;
  fixed-root legacy examples are reported rather than moved or deleted.
- Updated all three EasyStud Playwright launchers to write to a configurable
  external artifact root and register a shared pass/fail manifest without
  changing the tested scenario. The retention policy remains dry-run by
  default and unmanifested legacy captures remain protected.
- Added the supervised EasyStud authenticated Playwright runner: strict
  single-test discovery precedes DPAPI loading and the shared Moodle fixture
  lease, credentials remain process-local, and every run uses external
  artifacts, an isolated profile, guaranteed cleanup and a retention manifest.

- Reworked the desktop EasyStud guide launcher label into a localized,
  out-of-flow capsule that reveals on hover and keyboard focus with opacity and
  transform only, preserving navigation geometry and reduced-motion behavior.
- Suppressed the capsule immediately when the guide opens so it cannot remain
  visible or overflow over the guide modal; it is re-armed after pointer/focus
  leaves the launcher.
- Kept the existing guide button action and accessible name; compact/touch
  layouts continue to rely on the icon button without requiring hover text.

### 2026-07-26

- Reconnected the Simplified Student View to the canonical EasyEdu navigation
  contract with one Moodle-resolved server context for desktop and compact
  presentations, preserving the existing routes and utility actions.
- Removed the view-specific tertiary HTML parsing and compact-list cloning;
  added the vendored navigation partial/controller package, focused static
  integration contract and migration documentation.

### 2026-07-20

- Normalised custom profile field values used on participant cards so compact
  labels show readable plain text instead of stored HTML markup.

### 2026-07-19

- Synced EasyEdu UI kit `0.4.48` with a reusable responsive guide-launcher
  hiding primitive.
- Hid the EasyStud guide launcher across the full compact workspace breakpoint
  while preserving the desktop guide entry and updating the responsive audit.
- Stabilised complete-view list alignment so the first participant card and the
  first groups/groupings section start on the same baseline after filters,
  pagination or layout changes.
- Fixed responsive compact participant cards so the details action no longer
  overlaps the email address; the identity, email and action slots now keep
  explicit grid areas with safe ellipsis at mobile and tablet widths.

### 2026-07-18

- Added an EasyStud-specific quality protocol covering accessibility,
  functional flows, release checks, missing fixtures and progressive Moodle
  matrix adoption.
- Added an opt-in Playwright/axe smoke for the simplified manager, responsive
  workspace and Mass Import plugin regions.
- Synced EasyEdu UI kit `0.4.47` with reusable compact, regular and container
  card-title primitives, stable header slots and accessible title disclosures.
- Harmonised participant, group and grouping titles with semantic EasyEdu
  typography while preserving existing truncation, badges and card actions.
- Adopted the EasyEdu card-selection checkbox variant with semantic entity
  colours, larger touch targets and complete checked, indeterminate, focus and
  disabled states.
- Updated the embedded kit documentation, manifest and AI contracts so other
  Moodle plugins can reuse the same title and checkbox system without local
  visual overrides.
- Realigned card selection targets with participant, group and grouping title
  rows while preserving a deliberate horizontal gap and 44px touch targets.
- Removed the implicit CSS Grid row created by overlaid participant selectors,
  keeping checkboxes aligned in both compact and full-detail card densities.
- Applied the grouping semantic colour to disclosure chevrons, centred list
  selection labels and increased the navigation-to-workspace breathing room.
- Stabilised Select/Deselect pagination labels in a dedicated centred span and
  expanded the plugin-navigation gap to the shared 2.5rem workspace rhythm.
- Restored semantic pagination colours, aligned Sort with selection and page
  controls, and removed the broad descendant rule that muted their labels.
- Realigned detailed participant selectors and detail actions with the name
  row while keeping group and grouping headers on one stable vertical axis.
- Matched opened grouping-card identity rails with the closed-card rail width
  so the complete view no longer draws a doubled or inward left border.
- Hardened the Mass Import navigation audit to target the desktop navigation
  region explicitly when the responsive drawer exists in the DOM.

### 2026-07-17

- Added mandatory human and AI documentation for safe single-owner,
  commit-and-push development handoffs between workstations.
- Updated the embedded EasyEdu contracts to UI kit `0.4.45`, including quiet
  mobile card actions, wide desktop filter disclosures and navigation rhythm.
- Equalised paired Groups and Groupings filter surfaces with CSS grid stretch
  while keeping their disclosures independent.
- Separated filter disclosure classes from group-member reveal controls so
  responsive and desktop sizing can no longer override one another.
- Kept participant detail actions fixed at the same desktop card coordinates
  while compact cards expand into full details.
- Removed the Groups without groupings container from the dedicated Groupings
  workspace while preserving its data and its complete-view behaviour.
- Replaced split More filters labels and chevrons with one accessible,
  animated disclosure button using compact desktop and touch-sized variants.
- Removed recurring navigation and guide-template warnings from the simplified
  management page.

### 2026-07-16

- Restored the historical desktop EasyStud action navigation as a dedicated
  region while retaining the categorised off-canvas navigation on compact
  screens.
- Anchored participant detail and card-menu actions to terminal header slots,
  aligned compact list spacing and added subtle non-draggable grouping hover
  feedback.
- Restored the approved blue card-action menu glyph on compact layouts while
  retaining one shared action resolver for click, long press and selection.
- Restored the Moodle AMD wrapper for the rebuilt course manager so RequireJS
  can initialise EasyStud actions and the participant navigation integration.
- Stopped the responsive card-menu observer from repeatedly replacing its own
  action-grip markup, which created an unbounded detached DOM tree and blocked
  clicks, context menus and the browser main thread.
- Kept mobile-only grouping occupancy filters out of the desktop structure
  workspace, restored the requested blue menu icon on every card and prevented
  desktop focus classes from hiding participants after a responsive switch.
- Grouped the mobile drawer into styled EasyStud tools and Course participants
  sections, including the native enrolled-users, mass-import and clipboard
  destinations.
- Removed a self-triggering responsive Back to top observer that could keep
  the browser main thread busy after card and panel mutations. Synchronisation
  is now frame-coalesced, observes only relevant floating surfaces and avoids
  redundant DOM writes; the manager also rejects duplicate AMD initialisation.
- Restored the full semantic identity-rail width on responsive participant,
  group and grouping cards while containing every card inside the viewport.
- Repaired independent More filters disclosure animation, conditional Reset
  controls and the native hidden-state contract for grouping filters.
- Normalised every responsive card action button to the canonical action-grip
  and kept click, long press and the bottom action sheet on one resolver.
- Expanded the mobile navigation panel with the complete Moodle participant
  navigation, kept EasyGuide adjacent to its trigger and added an accessible
  safe-area-aware Back to top control.
- Synced and documented EasyEdu UI kit 0.4.41 responsive rail, navigation,
  disclosure and sticky-surface contracts.

### 2026-07-15

- Finalised the three responsive Participants, Groups and Groupings
  workspaces with a scrollable all-destination navigation rail, direct group
  catalogue, independent mobile filters and stable one-row list tools.
- Reused the established nested-group menu trigger for the mobile context
  sheet, removed duplicate card menus and restored responsive inline rename
  with touch-sized Save and Cancel controls.
- Contained expanded grouping rails within the viewport and added a real
  accessible responsive action-status pill for Ajax operations.
- Synced and documented EasyEdu UI kit 0.4.39 responsive navigation,
  pagination, panel-spacing, rail-containment and busy-state primitives.
- Replaced the compact primary-navigation rail with an accessible off-canvas
  panel, including backdrop, Escape handling, explicit close and focus return.
- Removed the desktop-only ungrouped container from the mobile Groups view,
  restored the exhaustive flat catalogue and its independent grouping filters,
  and replaced card-style filter chevrons with compact disclosure buttons.
- Reduced mobile identity rails, contained expanded grouping cards, widened
  group-member lists and refined the touch-friendly inline rename surface.
- Synced EasyEdu UI kit 0.4.40 and added Playwright coverage for navigation,
  flat group catalogues, filters, card containment and responsive rename.
- Restored the original desktop More filters markup after the responsive
  disclosure regression, kept both structure-view panels independent and
  forced the mobile flat Groups catalogue to render its cards rather than only
  clearing the parent hidden attribute.

### 2026-07-14

- Restored the copy-or-move choice when a nested group is dragged from one
  grouping to another in the dedicated Groups & Groupings view. Groups dragged
  from the exhaustive catalog remain additive and dropping into the same
  grouping remains a no-op.
- Reworked simplified management below 1024 px into three exclusive mobile
  workspaces for Participants, Groups and Groupings while preserving the three
  historical desktop layouts unchanged.
- Added an explicit card action trigger and a safe-area-aware bottom action
  sheet shared with long press, retained compact participant cards during
  selection, disabled tactile drag feedback and kept only available actions in
  the sticky mobile selection tray.
- Temporarily disabled every EasyStud guide surface in the responsive
  workspace and restored the active desktop layout when returning above the
  breakpoint without marking guide progress as completed.
- Synced the EasyEdu UI kit 0.4.38 responsive primitives, touch-target token,
  Moodle colour-picker group and AI/component documentation into the plugin.

### 2026-07-13

- Kept the Mass Import and simplified-management accent rails inside their
  rounded panel borders, including expanded and collapsed preview states, and
  synchronised the reusable panel contract from EasyEdu UI kit 0.4.37.
- Centred the simplified-management navigation actions independently of the
  EasyStud guide launcher and promoted the balanced rail structure to EasyEdu
  UI kit 0.4.32.
- Expanded Mass Import to the full available course-content width while
  preserving centred gutters and responsive containment.
- Hardened the accessible segmented reimport strategy against translated-title
  clipping and documented regular and compact design-system variants.
- Removed the duplicate preview search-selection action. The single leading
  button now switches between all-row and filtered-result scope dynamically.
- Moved the reimport strategy heading fully inside its choice panel while
  retaining an accessible native legend, and synced EasyEdu UI kit 0.4.33.
- Restored deliberate spacing around the annotated Excel export action and
  applied the shared icon-slot/action-button contract.
- Increased icon/label spacing through the theme-overridable
  `--easyedu-action-icon-gap` token and synced EasyEdu UI kit 0.4.34.
- Reordered historical upgrade savepoints, added coverage for the legacy-safe
  feature flag and refreshed only unchanged obsolete Moodle user tours.
- Updated the Mass Import tour for CSV/Excel preview, automatic identifier
  detection and the current interface targets.
- Added a non-destructive release validator that compares the current plugin
  with the historical CSV tag, audits the complete upgrade chain and can build
  an inspected production ZIP without modifying Moodle data.
- Added a disposable legacy-upgrade rehearsal for the local Moodle Windows
  stack. It clones the database, recreates the public CSV release state, runs
  Moodle's real local-plugin upgrade pipeline and verifies schema, settings and
  tour migration before automatically removing the test environment.
- Updated the Mass Import browser contract for the contained segmented-choice
  geometry and the theme-overridable action icon gap.
- Expanded browser coverage for actual file replacement with mixed automatic
  identifiers, non-empty annotated XLSX exports and a dedicated restoration
  audit launcher using the packaged Moodle PHP runtime.
- Cleared the remaining Moodle coding-style warnings in production PHP and
  synchronised EasyEdu UI kit 0.4.35 with compliant reusable guide language
  examples.
- Removed the final Sass mixed-declaration deprecation from the plugin tooltip
  integration without changing its visual result.

### 2026-07-12

- Restored the shared compact rounded treatment for guide navigation and
  guided actions. The administration navigation mixin now targets direct child
  buttons only, so it no longer makes modal actions square and oversized.

### 2026-07-11

- Expanded Mass Import into a recoverable workflow: confirmed imports now store
  their complete target state and can recreate manually deleted groups,
  groupings, memberships and assignments. Restoring is idempotent and remains
  available after a previous restore.
- Added annotated Excel report exports after import and from course history.
  The first three columns remain directly reimportable while status, details and
  semantic row colours make errors and warnings easy to review.
- Replaced raw reimport radios with the accessible EasyEdu segmented-choice
  control and aligned Mass Import icons, rollback actions and modal spacing.
- Adopted the exact Course Banner Builder primary navigation rail in the
  simplified manager and Mass Import, including icon placement, active state
  and a guide launcher anchored at the far left.
- Centred the Mass Import canvas within the course content area and matched the
  horizontal breathing room used by simplified student management.
- Right-aligned the final administration save action following Moodle form
  conventions and added a reusable kit spacing contract for form actions and
  icon-plus-label buttons.
- Finished the reimport strategy controls. Teachers can keep existing
  placements or synchronise only the groups listed in the selected preview
  rows; replacement removals are included in the recoverable import journal.
- Added Moodle XMLDB installation metadata and upgraded the history table with
  reversible operation and rollback attribution fields.
- Replaced the CSV example with a formatted XLSX workbook containing an import
  sheet, representative mixed identifiers and a dedicated instruction sheet.
- Hardened automatic user matching so duplicate email, ID number or custom
  field values are treated as ambiguous instead of selecting an arbitrary user.
- Completed the preview replacement workflow, stabilised the sticky upload
  panel control and fixed full-window file drops by waiting for and forwarding
  to Moodle's native filepicker APIs.
- Aligned the Mass Import and simplified manager navigation with the EasyEdu
  primary navigation contract already used by Course Banner Builder.
- Reworked plugin administration around an EasyEdu feature surface and added a
  legacy-safe opt-in for simplified student management.
- Renamed the visible plugin administration identity to EasyStud while retaining
  the `local_groupimport` component and routes for upgrade compatibility.
- Replaced the obsolete null Privacy provider with metadata, export and deletion
  support for course import history.
- Added a reusable read-only Playwright audit for Mass Import navigation,
  responsive containment, history, Excel download, file preview/replacement and
  administration settings.
- Synced EasyEdu UI kit 0.4.31, including shared typography plus the new
  reusable history action/state primitives, documentation, AI contracts, guide
  reference and motion reference packages.
- Added a legacy-safe administrator switch for the optional simplified student
  management view. Existing installations retain the historical mass-import-only
  workflow after upgrade, while fresh installations enable the complete EasyStud
  experience by default.
- Made course navigation, participant-page replacement, direct manager access
  and Mass Import actions consistently respect the simplified-view setting.
- Styled the new feature switch and the existing motion preference with the
  EasyEdu administration setting surfaces.
- Replaced duplicated Mass Import card rails and contextual modal gradients
  with the canonical EasyEdu semantic panel and modal contracts, preserving the
  existing EasyStud appearance and interactions.
- Synced EasyEdu UI kit 0.4.27 non-guide tokens and documentation for semantic
  modals, accent panels and sticky/semantic tables.
- Fixed the single-participant selection exception that prevented density
  motion from starting and allowed profile content to overlap the next card.
- Corrected EasyStud guided checklist targets so steps switch to the relevant
  view, open the needed grouping/group panels and highlight the exact creation
  or paste field instead of a generic list container.
- Reduced guided-step over-scrolling by avoiding centred target scrolling for
  large checklist targets such as drag/drop and context-menu practice cards.
- Synced the EasyEdu guide minimized checklist state so the close action no
  longer remains visible while the panel is collapsed.
- Smoothed guided checklist focus transitions by delaying page alignment until
  inner column scrolling has settled, and widened guided-path slide cards to
  match the explanatory guide blocks.
- Removed retained Web Animation effects so group member lists can reliably
  complete repeated open, close and reopen cycles.
- Retuned shared motion to 100/160/220 ms with a bounded 260 ms maximum for
  tall disclosures, making ordinary interactions more responsive.
- Stopped rebuilding and sorting every paginated list during selection changes
  and batched participant tag measurements to reduce forced layouts.
- Extended the Playwright audit with real intermediate-height and repeated
  disclosure assertions; all normal and reduced-motion scenarios pass.
- Made short search and paste panels distance-aware, delayed field focus until
  opening completes and replaced two-phase view changes with one atomic entrance.
- Changed pagination and sort replacements to fade-only swaps so scrollable
  columns no longer gain a temporary scrollbar or shift their cards sideways.
- Synced EasyEdu UI kit 0.4.28 (`28c578c`) with the complete motion runtime
  package, reusable recipes, AI contracts and updated guide behaviour.
- Added a versioned French handoff prompt covering repository state, reusable
  contracts, measured performance, validation and forbidden regressions.

### 2026-07-10

- Rebuilt EasyStud motion around one cancellable AMD controller with consistent
  120/180/240 ms timings and an administrator switch for optional animations.
- Added complete reduced-motion handling for the simplified manager, mass group
  import and Moodle-native message modals.
- Reworked pagination, participant compact/detail changes, group member lists,
  grouping disclosures, advanced filters, inline panels and layout switching to
  avoid overlapping transitions and nested-card tremble.
- Replaced delayed grouping resize chains and legacy creation/removal keyframes
  with single measured transitions and stable final states.
- Added a reusable Playwright motion audit and isolated PowerShell launcher for
  normal, reduced-motion and interrupted-interaction coverage.
- Corrected participant and grouping disclosure measurements and softened
  pagination swaps so transitions remain continuous instead of jumping or
  blinking.
- Added a balanced easing for tall participant, group and grouping disclosures
  so opening and closing remain perceptible across the full duration.
- Added bounded adaptive disclosure durations up to 300 ms so large groups and
  groupings remain visibly animated without slowing ordinary cards.
- Removed retained Web Animation fill effects that could clamp participant and
  member-list heights, block a second opening and accumulate rendering work.
- Shortened ordinary motion and capped large disclosures at 300 ms, while
  avoiding a full responsive-list recalculation after each member toggle.

- Synced the shared EasyEdu guide scene styling so EasyStud keeps the
  historical rich learning animations while using the reusable kit primitives.
- Updated the embedded EasyEdu guide documentation for soft pedagogical
  canvases, restored drag/drop, paste, context-menu, formula and guided-path
  motion, and Course Banner Builder scene mapping.
- Synced the reusable `guide-adjacent-action` button primitive from the kit so
  guide-adjacent controls compile consistently across EasyEdu plugins.
- Synced the hardened EasyEdu guide scene layouts so long translated slide
  text, guided-path buttons and checklist labels wrap inside their containers,
  with Playwright coverage confirming no slide overflow across the 20-step
  EasyStud guide.
- Synced the animated guide pointer refinement so context-menu learning scenes
  keep their motion without causing horizontal overflow.
- Synced the restored EasyEdu guide action and checklist styling so EasyStud
  guide buttons stay blue, learning surfaces are centred, guided-path cards
  use a stronger green surface without an extra rail, and checklist rows avoid
  internal text overflow.
- Fixed the guided checklist return action so it says `Return to guide`,
  restored the solid blue `Show in the interface` action, strengthened the
  teaching animations for context-menu and drag/drop slides, and removed the
  remaining situational completion-message overflow.
- Increased spacing around EasyStud guide `Show in the interface` actions and
  enlarged the introductory flow/card learning scenes so the first slides feel
  more balanced.

### 2026-07-09

- Restored the rich EasyStud learning scenes in the shared EasyEdu guide instead
  of reducing the existing 20-slide content to generic pills.
- Reconnected guided checklists to successful EasyStud actions and prevented
  steps from completing when their checklist row is clicked.
- Restored the checklist completion message and populated return-to-guide panel
  through the canonical EasyEdu template contract.
- Restored the EasyStud guide launcher as an icon-only control with its
  hover-help bubble, while keeping it aligned inside the shared EasyEdu admin
  navigation rail.
- Synced the embedded EasyEdu admin navigation and popover primitives so
  EasyStud remains the visual reference for Course Banner Builder.
- Added the generic EasyEdu guide template, Moodle AMD wrapper and scoped SCSS root so EasyStud can migrate from the legacy local tutorial to the shared kit guide contract incrementally.
- Kept the legacy EasyStud tutorial as a guarded fallback only, while rendering
  the active 20-slide guide through the shared EasyEdu guide contract.
- Rendered the EasyStud guide through the shared EasyEdu guide template and mapped the legacy tutorial visuals to reusable guide visual cards, steps and keyboard blocks.

### 2026-07-06

- Synced the embedded EasyEdu UI kit `v0.4.26` SCSS, guide assets and documentation after the inverse EasyStud audit.
- Added the EasyStud / GroupImport kit mapping documentation to clarify which UI primitives are reusable and which behaviours remain plugin-owned.
- Reused the new kit primitives for EasyStud selection checkboxes, participant identity badges, inline reveal panels and group member preview fade lists.
- Regenerated the plugin stylesheet after the kit sync.

### 2026-07-05

- Synced EasyEdu UI kit AI contracts and manifest into `easyedu-kit-docs` so future kit integrations keep the same implementation, guide parity and Moodle plugin review rules.
- Marked `easyedu-kit-docs` as `export-ignore` so development-only kit documentation remains versioned but is excluded from production release archives.

### 2026-07-03

- Refined EasyStud responsive JavaScript orchestration for collapsible filters, pagination, density switches, nested card toggles and mobile action recalculation.
- Improved touch long-press handling so context menus stay touch-specific and no longer interfere with desktop mouse interactions.
- Added stronger accessibility/state synchronisation for long grouping-tag summaries and participant tag overflow toggles.
- Fixed mobile EasyStud overflow found during the Playwright visual audit by constraining the action tray, preserving readable pagination select buttons and fully hiding inactive panels on narrow screens.
- Synced EasyEdu UI kit `v0.4.23` with safer wrapped mobile action tray primitives.
- Synced EasyEdu UI kit `v0.4.24` with a stronger drag preview count badge for readable multi-item drag stacks.
- Restyled the plugin administration settings page with an EasyEdu overview card, field chips and a clearer native Moodle multiselect for automatic user identification fields.
- Added admin-configurable participant card custom profile fields, including a compact coloured badge and two optional full-detail metadata tags.
- Synced EasyEdu UI kit `v0.4.25` with reusable native colour picker primitives for Moodle admin/settings forms.
- Fixed lingering EasyStud UI regressions around the native message modal sizing/loading state, complete-view grouping open rails and paginated list transitions.

### 2026-07-02

- Added participant messaging from EasyStud by reusing Moodle's native messaging flow from the `Enrolled users` page.
- Added a messaging action button for selected participants, gated by Moodle's `moodle/site:sendmessage` and `moodle/course:bulkmessaging` capabilities.
- Added the messaging action to the context menu for participants and members displayed inside groups.
- Restyled Moodle's native send-message modal to match the EasyStud/EasyEdu visual language.
- Added a shared entrance animation for Moodle native modals decorated by EasyStud.
- Restored and strengthened the EasyStud guide checklist success message when all guided path steps are complete.
- Synced the embedded EasyEdu guide copy with UI kit `v0.4.4`.
- Synced EasyEdu UI kit `v0.4.5` with reusable motion primitives, destructive/move modal primitives and drag preview helpers.
- Synced EasyEdu UI kit `v0.4.6` with reusable settings/detail modal filepicker, help icon and image placeholder primitives.
- Synced EasyEdu UI kit `v0.4.7` with reusable metadata list section primitives for settings/detail modals.
- Synced EasyEdu UI kit `v0.4.8` with a reusable Moodle native modal loading state.
- Harmonised the native Moodle send-message loading state so the EasyStud modal animation and loader styling are applied earlier.
- Synced EasyEdu UI kit `v0.4.9` with standardised guide modal size tokens aligned with the EasyStud tutorial modal.
- Synced EasyEdu UI kit `v0.4.10` with replayable native Moodle modal entrance animations.
- Restored the send-message modal entrance animation after Moodle's loading phase and enlarged the message textarea.
- Synced EasyEdu UI kit `v0.4.11` with reusable report/preview table primitives, history-list modal primitives and guided-step documentation hooks.
- Synced EasyEdu UI kit `v0.4.12` with sticky selection panel primitives and responsive long-press/action-tray guidance.
- Reused EasyEdu context-menu primitives for the EasyStud contextual menu to reduce local styling duplication.
- Synced EasyEdu UI kit `v0.4.13` with reusable modal file-drop overlay primitives for advanced settings dialogs.
- Synced EasyEdu UI kit `v0.4.14` with richer pagination primitives for select-all/results, counters, sort controls and placeholder alignment.
- Synced EasyEdu UI kit `v0.4.15` with a reusable card reveal toggle for expanding hidden card content.
- Synced EasyEdu UI kit `v0.4.16` with reusable open identity rail primitives for expanded grouping/container cards.
- Synced EasyEdu UI kit `v0.4.17` with reusable insert drop-target and configurable drag-disabled primitives.
- Synced EasyEdu UI kit `v0.4.18` with a public guided highlight refresh event for UI transitions, pagination and Ajax updates.
- Connected EasyStud layout switches, filters, pagination, collapsible cards and Ajax list updates to the reusable guided highlight refresh event.
- Synced EasyEdu UI kit `v0.4.19` with orchestration documentation for dynamic views, filters, pagination, Ajax mutations and guided-path highlight refresh timing.
- Synced EasyEdu UI kit `v0.4.20` with reusable card related-tag summaries and compact/detail density transition primitives.
- Reused the new EasyEdu card primitives for EasyStud group grouping-tag summaries and participant compact/full-detail transitions.
- Synced EasyEdu UI kit `v0.4.21` with reusable custom drag preview, stacked drag and source-placeholder primitives.
- Reused the new drag/drop primitives for EasyStud drag previews and dragged card placeholders.
- Synced EasyEdu UI kit `v0.4.22` with reusable mobile action tray primitives for responsive selection actions.
- Reused the new responsive action tray primitives in EasyStud tablet/mobile layouts.

## 0.3.0-beta - 2026-07-02

- Synced EasyEdu UI kit `v0.4.3` to refine the compact action menu trigger.
- Adjusted compact action menu styling so it reads closer to EasyEdu labels/buttons.
- Reduced and softened hover/focus treatment for compact action buttons in dense action rows.

### 2026-07-01

- Synced EasyEdu UI kit `v0.4.2` into the plugin.
- Added the reusable `easyedu-guide-kit` foundation: AMD module, Mustache template, language files, documentation and Moodle integration example.
- Extracted and documented many EasyEdu primitives: animations, buttons, cards, badges, menus, modals, forms, overlays, pagination, tables, tooltips, responsive helpers and guide patterns.
- Enriched the EasyStud guide with rich navigation, guided paths, floating checklist, interface highlights and keyboard behaviour.
- Improved hover help bubbles and compact action menus.
- Documented the EasyEdu kit and integration notes for Course Banner Builder.

### 2026-06-30

- Major redesign of the EasyStud simplified management view for participants, groups and groupings.
- Added three layout modes: participants and groups, complete view, groups and groupings.
- Added and refined multi-selection for participants, group members, groups and groupings.
- Added move, delete, remove members, remove groups from groupings, duplicate and advanced edit actions.
- Added desktop and mobile context menus that adapt to the current selection.
- Added a more complete responsive interface: adaptive columns, mobile actions, card density and touch-oriented behaviours.
- Added detailed participant, group and grouping cards with icons, identity rails, selection states, filters and animations.
- Added detail/settings modals for participants, groups and groupings.
- Added a rich EasyStud guide with slides, visual examples, guided paths, floating checklist and interface highlighting.
- Redesigned the mass group import view with harmonised styles, drag-and-drop area, file detection, preview and clearer import reports.
- Added more flexible CSV/Excel interpretation and automatic user identifier detection.
- Added an embedded EasyEdu kit foundation: tokens, SCSS mixins, documentation, sync script and reusable structure.
- Reorganised SCSS into dedicated components to improve maintenance, Moodle theme overrides and reuse in other plugins.

### 2026-06-15

- Migrated EasyStud refinements to Moodle 5.1.
- Improved multi-selection and contextual action handling.
- Added and refined move/delete actions for participants, groups and groupings.
- Added dynamic Ajax behaviour for several actions to reduce full page reloads.
- Improved toast notifications and user feedback messages.
- Adjusted cards, action buttons, filters and empty states visually.

### 2026-06-14

- Created the EasyEdu/EasyStud refactor branch and prepared the dedicated Git workflow, separate from the historical plugin version.
- Added the initial EasyStud simplified management view on Moodle 4.5.
- Added the first interactive interface for participants, groups and groupings.
- Added initial drag-and-drop, group/grouping creation, CSV import and Moodle native view navigation actions.
- Started the Moodle 5.1 migration and prepared the development branch.
- Improved the visual clarity of the EasyStud interface.

## Historical Versions

### 2026-02-13

- Updated README content and release information.
- Changed the declared maturity from beta to stable for the historical plugin version.

### 2026-02-12

- Fixed empty `{}` placeholders in import messages.

### 2026-02-10

- Minor code cleanup.

### 2026-01-07

- Fixed CodeChecker issues.
- Initial commit of the historical Group Import CSV plugin.
