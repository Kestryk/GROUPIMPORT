# Skeleton Kit K2 consumer contract (`EED-UI-2026-SKELETON-B`)

## Purpose

This record pins the EasyStud loading consumers to converged EasyEdu UI Kit K2:
`40762e0736654ac33f1c3a25b42f9a27ae29feb7`.

It applies only to Student Management and Mass Import. The shared Kit remains
the canonical source of decorative Skeleton primitives; EasyStud remains the
owner of page geometry and the loading lifecycle.

## Included consumers

| Consumer | Style owner | Cue contract |
| --- | --- | --- |
| Student Management | `scss/components/_layout.scss` | 48 overlay cues, static large frames |
| Mass Import | `scss/views/_mass-import.scss` | 19 direct cues, static large frames |

Both existing server-rendered Skeleton roots retain their decorative,
non-focusable `aria-hidden="true"` markup and their
`data-easyedu-navigation-skeleton="1"` marker. Product roots retain
`aria-busy`, the existing no-script reveal, readiness handoff and bounded
fail-open policy.

## Required behavior

- `navigation-skeleton-frame` styles only static outer frames.
- Direct or overlay shimmer styles only decorative internal cues.
- The Kit owns RTL sweep reversal, reduced-motion and forced-colors safeguards.
- The K2 section top-border remains static and uses logical properties; it
  augments existing decorative frames without changing their geometry.
- EasyStud keeps its DOM order, panel dimensions, offsets, LTR/RTL layout and
  320/390 px plus native 100/200% zoom containment protections.

## Exclusions

- Settings and administration Skeletons.
- Bootstrap or lifecycle JavaScript V4.
- Functional Navigation, Grouping, Guide, shared UI Kit source and unrelated
  work in progress.
- Runtime preview, cache purge, fixture mutation, browser execution and lease
  acquisition.

## Targeted validation

Before a runtime candidate can be proposed, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\release\test-navigation-skeleton-contract.ps1
sass scss\easystud.scss styles.css --no-source-map
php -l index.php
node --check tools\playwright\navigation-skeleton-zoom.spec.js
git diff --check
```

The future, separately authorised browser scenario is
`tools/playwright/navigation-skeleton-zoom.spec.js`. It covers Student
Management and Mass Import at 320 and 390 CSS px, LTR/RTL and native 100/200%
zoom. No browser, preview, cache or lease operation is authorized by this
source-only contract.
