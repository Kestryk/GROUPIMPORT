# EasyStud loading-state diagnostics

## Purpose

This opt-in diagnostic layer measures the EasyStud boot and local interaction
lifecycle around the loading/ready contract. It is disabled by default and
does not alter requests or normal product behaviour.

Enable it only on an authenticated local management URL by adding
`?easystudloadingdiagnostics=1`. When disabled, no diagnostic global, root
attribute, event history or event dispatch is created.

## Recorded contract

The enabled history is available at:

```js
window.__easyStudLoadingDiagnostics['local-groupimport-easystud'].snapshot()
```

Each record contains only the sequence, root/region labels, fixed event name,
relative elapsed time and bounded structural details. Permitted details are
booleans, counts, deterministic step/page indices, fixed operation/source/
outcome labels and relative timings. The boot sequence starts with
`manager-init-started` and `boot-visibility-observed`, records each
initialisation step, and ends with `manager-ready` after the existing two
`requestAnimationFrame` boundary. Local filter, pagination and sort flows emit
DOM-only lifecycle events. AJAX wrappers emit only a monotonic generation,
operation family and success/error outcome, plus the aggregate busy state.

The following are forbidden in every diagnostic payload and artifact:

- course, context, category or user identifiers, including `courseId`,
  `courseid`, `course_id` and equivalent aliases;
- course names/shortnames, participant or card text, passwords, cookies,
  sesskeys, authorization headers, bearer/access tokens or stable hashes;
- absolute or fixture URLs, query values, request bodies or response bodies.

The targeted Playwright spec recursively checks parsed keys and a bounded raw
JSON serialization for those exclusions before writing each artifact. Do not
globally forbid generic `id` fields: only the explicit identifier aliases are
privacy-sensitive here.

## Batch 2 loading contract

The server-rendered manager starts with one
`data-easystud-loading-state="loading"` attribute. A small classic bootstrap is
loaded in the document head, independently of RequireJS. Once the DOM is
available, it applies the boot-only `aria-busy` and `inert` state to the real
manager regions. A plugin-specific skeleton surface preserves a stable
workspace silhouette while Moodle's outer navigation and notifications remain
available.

After the existing initialisation callbacks and two-frame boundary, AMD asks
the bootstrap controller to complete `ready`. The controller is the sole
terminal-state owner: `loading → ready | degraded`; both terminal states are
idempotent and cannot return to loading or transition to the other terminal
state. It releases the interaction regions, clears `aria-busy` and announces
the localized ready status once. The skeleton is decorative and
`aria-hidden`; one visually clipped live region owns loading and ready text.
Reduced motion leaves the state changes and static skeleton intact.

The loading composition and inert-region ownership remain EasyStud-specific.
Local filter and pagination remain synchronous DOM operations and do not show
an artificial busy spinner. AJAX operations retain their existing action-busy
status, but no longer overwrite the root boot `aria-busy` state.

## Visual skeleton composition: Lot V1

The decorative loading region mirrors the visible EasyStud page family without
using course, participant, group or permission data. It contains a header,
responsive view controls, a Participants panel with search/filter, pagination
and repeated card surfaces, plus a Structure panel only at wide desktop.

Every decorative surface uses the local
`.local-groupimport-easystud__loading-surface` hook. It is reserved for the
future coordinated shimmer work; Lot V1 deliberately keeps those surfaces
static. Fine reveal-displacement geometry remains a V2 responsibility.

Without JavaScript, the `<noscript>` fallback hides the decorative skeleton and
reveals the server-rendered manager content. It does not render static `inert`
or boot `aria-busy`, so the page cannot remain blocked when the bootstrap or
AMD bundle does not run.

## Visual skeleton geometry: Lot V2

Lot V2 keeps the accepted V1 skeleton hierarchy and changes only its scoped
SCSS geometry. The loading header, view-control footprint, panel spacing,
filter footprint, placeholder density and wide-desktop column geometry are
tuned against the final rendered manager. It does not add shimmer or change
the boot lifecycle.

`tools/playwright/loading-state-v2-geometry.spec.js` is the non-mutating
geometry evidence. It delays the manager AMD bundle, measures the decorative
skeleton and ready content in the same fresh browser context, then checks
document, body and plugin-root overflow. Its external artifact root must be a
new directory below `D:\EasyEduQAArtifacts`; existing evidence is never
overwritten. It writes redacted ready screenshots, skeleton screenshots and
privacy-safe geometry JSON only.

The accepted authenticated local matrix on 2026-07-22 used the opaque fixture
alias `local-disposable-fixture` and measured the following root heights:

| Viewport | Skeleton height | Ready height | Absolute reveal displacement |
| --- | ---: | ---: | ---: |
| 390 px | 1703.7 px | 1697.4 px | 6.3 px |
| 520 px | 1681.3 px | 1674.9 px | 6.4 px |
| 768 px | 1630.8 px | 1632.2 px | 1.4 px |
| 1024 px | 1023.9 px | 1017.4 px | 6.5 px |
| 1440 px | 1735.6 px | 1744.0 px | 8.4 px |

All five widths met the root/panel, control, participant-card, gap and
pagination tolerances. The V1 responsive density remains: 20 participant
cards at 390/520/768/1440 px, 10 visible participant cards at 1024 px, and 10
decorative Structure cards only at 1440 px. Console, page and unexpected
network/HTTP error counts were zero; the one intercepted AMD transport per
viewport is expected while the test holds the bundle. The recursive artifact
privacy scan passed at every width.

The authenticated fixture currently has an empty rendered Structure tree at
1440 px. Panel geometry and the neutral 10-card loading composition were
validated, but a direct ready Structure-card comparator is correctly recorded
as `missing-structure-card-fixture`. Do not create Moodle groups merely to
fill that gap; a future disposable fixture with existing non-sensitive
structure data can add that comparator.

Run the strict geometry check only with process-scoped local fixture variables
and a new external artifact directory:

```powershell
$env:EASYEDU_LOADING_V2_ARTIFACT_ROOT = 'D:\EasyEduQAArtifacts\easystud\loading-state\v2-geometry\<new-run>'
$env:EASYEDU_LOADING_V2_ASSERT = '1'
npx --yes --package=node@20.19.4 node .\node_modules\@playwright\test\cli.js test loading-state-v2-geometry.spec.js --workers=1 --reporter=line
```

Lot V3 remains limited to the coordinated shimmer/motion scope. No shimmer
keyframes or animation behavior exists after Lot V2.

## Batch 2 reconciliation acceptance

`tools/playwright/loading-state-batch2.spec.js` is the non-mutating production
acceptance suite. It is intentionally separate from the Batch 1 diagnostic
baseline. It covers delayed AMD, terminal degraded fail-open, no-JavaScript,
diagnostics-disabled, reduced-motion, document/body/root/content overflow and
DOM-only filter/pagination evidence. It observes console errors, `pageerror`,
unhandled rejections, relevant failed requests and relevant HTTP errors.

All reusable evidence is privacy-safe and may use only the opaque fixture alias
`local-disposable-fixture`. It contains no fixture identity, URL, cookie,
sesskey or credentials. The suite writes only to an explicit external root via
`EASYEDU_LOADING_BATCH2_ARTIFACT_ROOT`; writes are atomic and refuse to
overwrite an existing artifact.

## Batch 2 evidence (2026-07-22)

The authenticated, non-mutating eight-test run covered the five required
viewports plus diagnostics-disabled, DOM-only filter and local-pagination
checks. It passed with one worker after Moodle cache purge. The external
artifact root was a private, machine-local temporary directory. It is
intentionally not recorded in repository documentation.

Each viewport artifact contains 104 monotonic events, a loading snapshot with
the skeleton visible and the real content hidden, and a ready snapshot with
the real content visible, `aria-busy="false"` and all scoped interaction
regions released. Ready elapsed times were 242ms (390px), 240ms (520px),
340ms (768px), 266ms (1024px) and 328ms (1440px). Plugin root and content
scroll widths matched their client widths at every viewport. All visible
actions had accessible names; the keyboard probe retained a focus-visible
target, and the 390/520px touch-action set measured at least 44 by 44px.
Console/page errors were asserted absent and the recursive privacy check found
no forbidden keys, values or URLs. The reversible AJAX mutation test remained
skipped.

A supplementary non-mutating fail-open test blocked Moodle's `core/first`
RequireJS bundle and passed the degraded-state contract: the real content was
visible, the skeleton was hidden, `aria-busy` was false and every scoped
interaction region was released from `inert`. Only the expected blocked-script
errors were allowed in that test; normal matrix pages remained error-free.

## Fixture boundary

The spec is opt-in and requires a local authenticated management URL and
password through process-scoped environment variables. The fixture must have
at least two participants for filter evidence and more than one participant
page for pagination evidence. The fixture's disposable status must be proven
before any mutation test is enabled. Never use a shared, production, personal
or CCB fixture, and never place credentials or fixture URLs in evidence.

## Commands

From `tools/playwright`, inject the local variables only for the test process:

```powershell
$env:EASYEDU_LOADING_DIAGNOSTIC_URL = '<local management URL>'
$env:EASYEDU_MOODLE_USERNAME = '<local account>'
$env:EASYEDU_MOODLE_PASSWORD = '<local password>'
npx playwright test loading-state-diagnostics.spec.js --workers=1 --reporter=line
```

For durable review evidence, set
`EASYEDU_LOADING_DIAGNOSTIC_ARTIFACT_ROOT` to a new external directory, never
inside the repository or a synchronized worktree. Remove all variables in a
`finally` block after the run.

## Mutation boundary

The reversible AJAX rename test remains disabled unless an explicitly approved
disposable fixture and complete restoration configuration are supplied. A
future mutating batch must keep original identifiers and names in a separate
protected local-only checkpoint, outside reusable evidence, before attempting
the mutation. It must restore in `finally` and prove the original state after
reload. Do not create/delete groups, alter membership, move groups, import data
or touch grouping/category state. A skipped mutation test is not evidence of a
safe mutation path.

## Batch 1 baseline status

After the diagnostic payload fix, the authenticated non-mutating baseline was
rerun after rebuilding the AMD and purging Moodle caches: the five viewport
baselines (390, 520, 768, 1024 and 1440px), disabled URL, DOM-only filter and
local pagination checks all passed. Five external JSON artifacts contained
monotonic sequences and no forbidden privacy keys, values or URLs; browser
console errors were also asserted absent. Disposable status was not
established by this run, so the AJAX mutation case was not executed.
