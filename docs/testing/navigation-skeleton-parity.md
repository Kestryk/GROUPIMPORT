# Navigation Skeleton parity (`EED-UI-2026-0025`)

## Scope and immutable input

Student Management (`templates/manage.mustache` and
`scss/components/_layout.scss`) and Mass Import (`index.php` and
`scss/views/_mass-import.scss`) consume the immutable UI Kit snapshot
`41e86979dc8138dd026438039143f2ba94c0531e`.

The selective vendoring synchronises only
`scss/easyedu/_tokens.scss`, `scss/easyedu/components/_loading.scss` and
`scss/easyedu/components/_navigation-skeleton.scss`, plus their consumer
contract. `tools/sync-easyedu-kit.ps1` is not used. Administration/settings,
functional Navigation, filters, pagination, Send message, Guide, CCB, runtime
and cache remain outside this consumer lot.

## Composition and lifecycle boundary

The existing server-rendered skeleton roots remain `aria-hidden` and now mark
the Navigation Skeleton composition with `data-easyedu-navigation-skeleton`.
No real control, navigation destination or meaningful copy is added. The
existing no-script reveal, AMD readiness, 320 ms Student Management handoff,
180 ms Mass Import handoff and their fail-open paths are unchanged.

The existing large panels, search/filter shells, view toggle and import cards
compose `navigation-skeleton-frame`; they remain pale static surfaces with the
Kit section accent. Their existing decorative `__loading-surface` descendants
compose a Kit cue mixin.
Student Management uses the overlay cue to retain its two-line card cue base;
Mass Import uses the direct cue. RTL sweep reversal, reduced-motion and
forced-colors behavior come from the embedded Kit component rather than local
overrides.

## Animated-surface measurement

The measurement counts server-rendered decorative cue elements that receive a
shimmer animation. It separately records large-frame animations, which must
remain zero.

| Surface | Before | After | Large-frame animations |
| --- | ---: | ---: | ---: |
| Student Management | 48 | 48 | 0 -> 0 |
| Mass Import | 19 | 19 | 0 -> 0 |

Student Management's planning estimate of about 48 matches the checked-in
template: its 48 internal cue spans are already the only animated elements.
Mass Import has five header cues plus two cards with seven cues each
(`5 + 2 x 7 = 19`). This migration therefore makes no unsupported performance
reduction claim: it prevents new large-frame animation while preserving the
existing internal-cue count and loading geometry.

## Visual section refinement - 2026-08-25

The two consumers adopt the Kit section-frame defaults, explicit logical cue
stack and opt-in compact density from `41e86979`. The frame is static by
contract; only the existing 48 Student Management and 19 Mass Import decorative
cues animate. No Administration selector calls `navigation-skeleton-frame`, so
its loading surface is deliberately unchanged.

## Static validation and deferred review

Run `tools/release/test-navigation-skeleton-contract.ps1` to verify the
immutable snapshot reference, selective component import, decorative markup,
canonical frame/cue composition and the two surface-count formulae. Run the
official Sass build with `sass scss/easystud.scss styles.css --no-source-map`,
PHP lint for `index.php`, JavaScript syntax for the affected Playwright source
and `git diff --check`.

No runtime promotion, cache refresh, lease acquisition or browser execution
is implied by this source change. When separately authorised, the focused
`tools/playwright/navigation-skeleton-zoom.spec.js` scenario inspects both
views at 320 and 390 CSS px in LTR and RTL, with genuine Chromium 100% and
200% browser zoom. It asserts the numeric document `scrollWidth` stays within
one CSS pixel of `clientWidth`, as well as Skeleton and frame containment. It
creates a new profile only below the supervised run's
external artifact directory and sets the per-host zoom preference before
launch; it does not send keyboard shortcuts or automate any existing desktop
browser window. Reduced-motion and forced-colors remain covered by the Kit
source contract and its canonical CSS media rules.

### Static record - 2026-08-10

The vendored component text was compared after line-ending normalization with
the immutable `c9277a82` source and matched exactly. The focused source
contract, the official `sass scss/easystud.scss styles.css --no-source-map`
build, PHP lint of `index.php`, `node --check` of
`tools/playwright/mass-import-audit.spec.js` and
`tools/playwright/navigation-skeleton-zoom.spec.js`, and `git diff --check`
pass.

The Sass build reports one existing mixed-declaration deprecation at
`scss/components/_layout.scss:129`, outside this lot's Skeleton hunks. No
Playwright process, browser, preview, cache, lease or runtime operation was
started.

### Containment follow-up - 2026-08-10

The Student Management compact Navigation-shaped frame now uses `border-box`
and a logical `max-inline-size: 100%`, so its decorative padding remains inside
the 320 px inline width. The focused scenario records numeric document widths
and fails when `scrollWidth` exceeds `clientWidth + 1`; it still checks both
LTR/RTL directions, native 100%/200% zoom, static large frames and animated
internal cues. Its native-200% capture is written before the containment
assertions, so a failing run retains the requested visual evidence without
weakening those assertions. The UI Kit snapshot and Mass Import consumer are
unchanged.

Hidden compact-only Structure placeholders are excluded from the root-boundary
measurement because their `display: none` rectangle is `0 x 0`; every rendered
frame and cue remains subject to the containment assertion.

At an effective CSS viewport below `20rem` (including native 200% zoom on a
320 px window), Student Management stacks its decorative fixed-width header
and panel cues. The large Navigation-shaped frames stay fully visible; this
consumer-only rule does not alter Mass Import, functional Navigation or the
UI Kit primitive.

Mass Import uses the same extreme-width cue stack for its loading header. At
that width, its decorative card-title cue may also shrink beside its static
icon, so the full card frame remains contained. Its normal desktop/phone
geometry is unchanged.

The Mass Import consumer also gives its Skeleton grid, cards and card headers
an explicit logical inline size. The grid retains its desktop `0.88fr`/`1.12fr`
ratio without fixed minimum tracks, while its responsive one-column rule stays
in place. Its full-width field and row cues use `border-box` and a logical
maximum width. This keeps the 200%-zoom visual coordinates of every rendered
cue within the Skeleton root without changing the shared loading primitive or
the final Mass Import layout.

At the same compact threshold, Mass Import alone reduces the fixed busy
spinner to `1.6rem`, removes its external shadow and aligns its bottom/end
offset with the localized `Loading in progress` label. This is action feedback,
not a Navigation Skeleton cue: the static frames and the 19 animated internal
cues are unchanged. The focused scenario exposes that local busy state and
writes one full-window 320 px LTR/native-200% capture before containment
assertions, while retaining the RTL matrix.

The containment probe measures the Navigation Skeleton's own client and scroll
width rather than its application root. This keeps the functional Navigation
overlay outside the Skeleton contract while document overflow remains checked
separately.

If a rendered cue exceeds that root, the focused scenario records the measured
root left/right bounds in its assertion message. The raw screenshot and
manifest remain external to Git.

When the supervised process supplies a Chromium executable, the scenario uses
it only with the external run profile. The profile writes Chromium's partitioned
per-host zoom preference before launch; it never changes an existing browser
profile or sends zoom shortcuts.
