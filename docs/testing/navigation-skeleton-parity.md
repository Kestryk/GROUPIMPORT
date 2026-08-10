# Navigation Skeleton parity (`EED-UI-2026-0025`)

## Scope and immutable input

Student Management (`templates/manage.mustache` and
`scss/components/_layout.scss`) and Mass Import (`index.php` and
`scss/views/_mass-import.scss`) consume only UI Kit snapshot
`c9277a82fb471018f4cc07b24dd336d2adfa310d`.

The selective vendoring adds only
`scss/easyedu/components/_navigation-skeleton.scss`, its aggregator forward
and the embedded-kit documentation. `tools/sync-easyedu-kit.ps1` is not used.
Administration/settings, functional Navigation, filters, pagination, Send
message, Guide, CCB, runtime and cache remain outside this consumer lot.

## Composition and lifecycle boundary

The existing server-rendered skeleton roots remain `aria-hidden` and now mark
the Navigation Skeleton composition with `data-easyedu-navigation-skeleton`.
No real control, navigation destination or meaningful copy is added. The
existing no-script reveal, AMD readiness, 320 ms Student Management handoff,
180 ms Mass Import handoff and their fail-open paths are unchanged.

The existing large panels, search/filter shells, view toggle and import cards
compose `navigation-skeleton-frame`; they remain pale static surfaces. Their
existing decorative `__loading-surface` descendants compose a Kit cue mixin.
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
200% browser zoom. It creates a new profile only below the supervised run's
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
