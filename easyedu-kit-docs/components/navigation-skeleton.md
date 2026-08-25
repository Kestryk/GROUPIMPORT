# Navigation Skeleton

## Purpose

Navigation Skeleton keeps a large navigation-shaped loading frame pale and
static. Only decorative marks inside it animate, avoiding a large-frame
repaint during loading feedback.

It does not own page geometry, navigation destinations, readiness, fail-open
timing or interactive Navigation behavior.

## Accessibility boundary

- Skeleton markup is decorative, `aria-hidden` and non-focusable.
- The product root owns `aria-busy`, its localised status and lifecycle.
- The outer frame contains no meaningful text, control or destination.
- Consumers retain DOM order, dimensions, padding, responsive layout and
  no-script/fail-open behavior.

## SCSS contract

```scss
@use "easyedu" as easyedu;

.my-plugin__navigation-frame {
  @include easyedu.navigation-skeleton-frame;
}

.my-plugin__navigation-cue {
  @include easyedu.navigation-skeleton-cue;
}

.my-plugin__navigation-cue--soft {
  @include easyedu.navigation-skeleton-cue-overlay;
}
```

`navigation-skeleton-frame` is static. Do not combine it with a shimmer mixin.
Use direct and overlay cue variants only on decorative internal marks. Their
logical alignment and sweep reversal preserve RTL behavior without a consumer
override.

## Forced colors and motion

The component disables cue animation for reduced motion and forced-colors,
while preserving system-visible surfaces. Consumers must not override those
safeguards or place focusable content inside the Skeleton.

## Validation

`EED-UI-2026-SKELETON-B-K2-FINAL-I` requires static frame checks, the declared
direct/overlay cue counts and the existing 320/390 px LTR/RTL native-zoom
scenario before a separately authorised runtime run.
