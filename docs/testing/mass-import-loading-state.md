# Mass Import loading-state contract

The Mass Import page (`index.php`) renders a lightweight skeleton before the
interactive form, preview, history and drag/drop regions. The skeleton is a
server-rendered sibling of `[data-easystud-real-content]`, so a slow Moodle
response or RequireJS startup cannot expose partially bound controls.

The root uses `data-easystud-loading-state="loading"` and opts into the shared
classic `js/loading_state_bootstrap.js` with `data-easyedu-loading-bootstrap`.
The `local_groupimport/csv_import` AMD module sets the configured readiness
attribute after its initial controls are wired. The bootstrap then waits for a
short visual-stability quiet period before exposing the real content, with an
8-second fail-open path if the AMD module cannot start.

While the root is loading, the existing EasyEdu bottom-end action indicator is
active. It keeps the historical spinner at the lower-right corner and reads
the `actioninprogress` language string from
`data-easyedu-action-busy-label`; no central modal or duplicate loading dialog
is introduced.

At an effective width of `20rem` or less, Mass Import alone reduces that
circle to `1.6rem`, removes its shadow and gives it `0.5rem` of lower-edge and
`0.65rem` of end-edge clearance inside the label. This keeps the localized
feedback visually centred in its reserved right-hand space at 320 px with
native 200% browser zoom; desktop feedback and the shared action indicator
remain unchanged.

When motion is enabled, the skeleton fades out over 180 ms and the real content
then fades in over 180 ms. The root keeps its loading state and the real region
remains inert until both phases finish. With `prefers-reduced-motion`, both
phases are immediate.

The skeleton is intentionally structural rather than textual. Its two-column
desktop layout follows the Mass Import cards and collapses to one column at the
`1024px` responsive boundary. Shimmer stops for reduced-motion and forced-colour
users. The visual contract is covered by the focused
`tools/playwright/mass-import-audit.spec.js` test; generated browser media
remains outside Git under the approved EasyEdu artifact root.

Under `EED-UI-2026-0025`, the two import-card frames are explicitly static and
only their 19 internal decorative cues animate. The immutable Kit
`41e86979dc8138dd026438039143f2ba94c0531e` provides the section-frame accent,
logical cue stack, RTL, reduced-motion and forced-colors behavior; the existing
loading lifecycle remains unchanged. The paired Student Management measurement
and static source contract are recorded in
`docs/testing/navigation-skeleton-parity.md`.

The latest Moodle 5.1 revalidation selected exactly one test and passed in
external run `easystud-authenticated-20260730T143532846Z-33664`. Its manifest
records an external isolated profile, process-local credentials and complete
lease cleanup; no screenshot or other raw media was generated.

The plugin declares Moodle 5.1 as its compatibility floor. This batch is
validated against the active Moodle 5.1 runtime only; Moodle 4.5, 5.2 and 5.3
remain deferred to the final compatibility matrix.
