# Loading and skeletons

## Purpose

The Loading family provides visual primitives for application-owned loading
states. It does not own page geometry, initialization timing or a product's
fail-open policy.

## Accessibility boundary

- Skeleton markup is decorative, non-focusable and `aria-hidden`.
- The product root owns `aria-busy` and its localized loading status.
- Real controls remain unavailable until the consumer reaches its own ready
  condition.
- A bounded consumer fail-open reveals usable content when initialization
  cannot complete.
- Reduced-motion and forced-colors users receive static, visible surfaces.

## Canonical section template (K2)

```scss
@use "easyedu" as easyedu;

.my-plugin__loading-section {
  @include easyedu.skeleton-section-top-border;
}

.my-plugin__loading-heading {
  @include easyedu.skeleton-section-heading;
}

.my-plugin__loading-icon {
  @include easyedu.skeleton-section-icon-slot;
}

.my-plugin__loading-title {
  @include easyedu.skeleton-section-title;
}

.my-plugin__loading-navigation {
  @include easyedu.skeleton-section-navigation-gap;
}
```

The K2 top border is decorative and static. It uses logical properties so the
same composition remains correct in RTL. A localised heading, where needed,
must stay outside the decorative `aria-hidden` Skeleton body.

## Surface and cue primitives

Use `skeleton-surface` for a bounded loading surface. Apply
`skeleton-shimmer-direct` to a simple bar whose full gradient may move, or
`skeleton-shimmer-overlay` when a stable cue base must remain visible below a
light sweep. `skeleton-stack` supplies a bounded rhythm for placeholder rows.

For a large navigation-shaped area, use the Navigation Skeleton composition:
the frame remains static and only its internal decorative cues animate.

## Public tokens

- `--easyedu-loading-section-accent`
- `--easyedu-loading-section-border-width`
- `--easyedu-loading-section-icon-slot-size`
- `--easyedu-loading-section-heading-gap`
- `--easyedu-loading-section-navigation-gap`

Themes may override these variables below a plugin root. They must not restore
animation when the Kit disables it for reduced-motion or forced-colors.

## Consumer boundary

Consumers keep their own panel counts, dimensions, responsive offsets,
no-script behavior, lifecycle and fail-open deadline. Do not copy another
plugin's Skeleton geometry, data attributes or test timing.
