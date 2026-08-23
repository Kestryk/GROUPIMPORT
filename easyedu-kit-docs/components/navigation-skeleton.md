# Navigation Skeleton

## Purpose

Navigation Skeleton keeps a large navigation-shaped loading frame pale and
static. Only decorative marks inside it animate, which preserves familiar
loading feedback without repainting the complete frame on every shimmer pass.

It is a Loading-family primitive. It does not own page geometry, navigation
destinations, readiness, fail-open timing or interactive Navigation behavior.

## DOM and accessibility contract

```html
<section class="my-plugin" aria-busy="true" data-loading-state="loading">
    <div class="my-plugin__navigation-skeleton" aria-hidden="true">
        <div class="my-plugin__navigation-frame">
            <div class="my-plugin__navigation-cues">
                <span class="my-plugin__navigation-cue"></span>
                <span class="my-plugin__navigation-cue my-plugin__navigation-cue--soft"></span>
            </div>
        </div>
    </div>
    <nav class="my-plugin__navigation" hidden><!-- Real navigation. --></nav>
</section>
```

- Skeleton markup is decorative, `aria-hidden` and non-focusable.
- The product root owns `aria-busy`, a localised status where useful, and its
  loading-to-ready lifecycle.
- The outer frame contains no meaningful text, control or destination.
- Consumers retain their DOM order, dimensions, padding, responsive layout and
  no-script/fail-open behavior.

## SCSS contract

```scss
@use "easyedu" as easyedu;

@include easyedu.motion-keyframes;

.my-plugin__navigation-frame {
  @include easyedu.navigation-skeleton-frame;
}

.my-plugin__navigation-cues {
  @include easyedu.navigation-skeleton-cue-stack(0.75rem);
}

.my-plugin__navigation-cue {
  @include easyedu.navigation-skeleton-cue;
}

.my-plugin__navigation-cue--soft {
  @include easyedu.navigation-skeleton-cue-overlay;
}
```

`navigation-skeleton-frame` is static and supplies only the pale Loading
surface, border, radius and clipping boundary. Do not combine it with either
shimmer mixin. `navigation-skeleton-cue` uses the opaque direct shimmer;
`navigation-skeleton-cue-overlay` retains a stable cue base beneath its light
sweep. `navigation-skeleton-cue-stack` aligns cues to logical `start`, so the
internal pattern mirrors in RTL without a consumer override.

Main Skeleton sections may add the static
[`skeleton-section-top-accent`](loading.md#static-section-top-accent) when an
existing semantic token distinguishes their decorative frames. The accent does
not make the frame animate and does not own its geometry.

## Public tokens

Navigation Skeleton deliberately reuses the Loading token contract rather than
introducing consumer-specific measurements:

- `--easyedu-loading-surface`
- `--easyedu-loading-highlight`
- `--easyedu-loading-border`
- `--easyedu-loading-shimmer-soft`
- `--easyedu-loading-shimmer-highlight`
- `--easyedu-loading-radius`
- `--easyedu-loading-stack-gap`
- `--easyedu-loading-shimmer-duration`

Consumers may pass documented mixin arguments when preserving an approved
appearance. They must not use a token override to animate the outer frame.

## Accessibility, RTL and forced colours

The cue variants reverse their shimmer travel in RTL through logical direction
selectors. Reduced motion disables cue animation through the shared Loading
primitive. Forced-colors keeps the frame visible, stops animation and renders
cue marks with a system-visible `CanvasText` surface. Consumers must not
override those safeguards or place focusable content inside the Skeleton.

## Consumer geometry boundary

This component provides no navigation count, row width, icon size, padding,
panel position, responsive offset, readiness deadline or fail-open decision.
Those remain product-owned so Student Management and Mass Import can adopt the
same primitive without inheriting another surface's geometry.

## EasyStud K2 validation

`EED-UI-2026-SKELETON-B` pins EasyStud to Kit K2. The consumer static contract
must confirm that outer frames remain static, that Student Management keeps 48
decorative cues, that Mass Import keeps 19, and that the native zoom scenario
still covers 320/390 px in LTR and RTL.

## Static validation

The Kit validates its primitive with:

```powershell
.\scripts\test-loading-contract.ps1
```

EasyStud validates the consumer boundary with:

```powershell
.\tools\release\test-navigation-skeleton-contract.ps1
```

The contracts reject a compiled frame that receives the shimmer animation.
