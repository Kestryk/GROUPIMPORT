# Loading and skeletons

## Purpose

The loading family provides the visual primitives proven by EasyStud Student
Management, Mass Import and Administration. It deliberately does not own page
geometry, application readiness, Ajax timing or fail-open policy.

Consumers must render the skeleton before interactive JavaScript starts, keep
real controls unavailable while loading, and reveal the real content only
after their own stable-ready condition succeeds.

## DOM and accessibility contract

```html
<section class="my-plugin" aria-busy="true" data-loading-state="loading">
    <div class="my-plugin__skeleton" aria-hidden="true">
        <span class="my-plugin__loading-surface"></span>
    </div>
    <div class="my-plugin__content" hidden><!-- Real controls. --></div>
</section>
```

- Skeleton markup is decorative, `aria-hidden` and contains no focusable node.
- The product root exposes `aria-busy` and a localised status when useful.
- Real controls stay hidden or inert until their handlers and visibility state
  are stable.
- A bounded consumer fail-open must reveal usable content if initialization
  fails; the kit does not choose that deadline.
- Reduced-motion and forced-colours users receive static, visible surfaces.

## Canonical section template (K2)

Each principal Skeleton block has one coloured top border. It may expose a
real, localised section title and explanatory copy outside the decorative
Skeleton body; only the placeholder surfaces and navigation-shaped rows belong
inside `aria-hidden="true"`.

```html
<section class="my-plugin__loading-section" aria-labelledby="my-plugin-loading-title">
    <div class="my-plugin__loading-heading">
        <span class="my-plugin__loading-icon" aria-hidden="true"></span>
        <h2 id="my-plugin-loading-title" class="my-plugin__loading-title">
            {{#str}} loadingsection, local_example{{/str}}
        </h2>
    </div>
    <p class="my-plugin__loading-explanation">
        {{#str}} loadingsectiondescription, local_example{{/str}}
    </p>
    <div class="my-plugin__loading-skeleton" aria-hidden="true">
        <span class="my-plugin__loading-surface"></span>
        <div class="my-plugin__loading-navigation">
            <span></span><span></span><span></span>
        </div>
    </div>
</section>
```

- The title uses a product-localised string and remains outside `aria-hidden`.
- The icon slot is decorative, non-focusable and aligned logically with title.
- `loading-navigation` is non-interactive until the consumer is ready.
- `skeleton-section-navigation-gap` sets only the internal placeholder rhythm.

## SCSS contract

```scss
@use "easyedu" as easyedu;

@include easyedu.motion-keyframes;

.my-plugin__loading-surface {
  @include easyedu.skeleton-surface;
  @include easyedu.skeleton-shimmer-overlay;
}

.my-plugin__loading-list {
  @include easyedu.skeleton-stack(0.9rem);
}

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

.my-plugin__skeleton,
.my-plugin__content {
  @include easyedu.loading-opacity-transition;
}

.my-plugin.is-loading-exiting .my-plugin__skeleton {
  @include easyedu.loading-opacity-hidden;
}
```

Use `skeleton-shimmer-direct` for simple bars whose full gradient may move.
Use `skeleton-shimmer-overlay` when the base surface must remain stable below a
light sweep. A consumer may pass its existing animation name during migration,
but new integrations use `easyedu-skeleton-shimmer`. The mixins also accept
named surface, border, highlight and radius arguments so an existing consumer
can migrate without changing its approved appearance.

For a large navigation-shaped loading surface, use the
[Navigation Skeleton](navigation-skeleton.md) composition: keep the outer
frame static with `navigation-skeleton-frame`, then apply a direct or overlay
shimmer only to its decorative internal cues. The component keeps cue alignment
logical, reverses cue travel in RTL and inherits the shared reduced-motion and
forced-colors safeguards. Navigation counts, padding, responsiveness and
loading lifecycle remain consumer-owned.

## Public tokens

- `--easyedu-loading-surface`
- `--easyedu-loading-highlight`
- `--easyedu-loading-border`
- `--easyedu-loading-shimmer-soft`
- `--easyedu-loading-shimmer-highlight`
- `--easyedu-loading-radius`
- `--easyedu-loading-stack-gap`
- `--easyedu-loading-shimmer-duration`
- `--easyedu-loading-reveal-duration`
- `--easyedu-loading-section-accent`
- `--easyedu-loading-section-border-width`
- `--easyedu-loading-section-icon-slot-size`
- `--easyedu-loading-section-heading-gap`
- `--easyedu-loading-section-navigation-gap`

Themes may override these variables under a plugin root. They must not restore
animation when reduced-motion or forced-colours disables it. The K2 accent uses
logical block/inline properties for RTL and becomes a system-visible colour in
forced-colours mode; it introduces no additional animation.

## Import audit checklist

- Confirm the skeleton represents every visible page region rather than only
  the first viewport row.
- Compare loading and ready geometry at every responsive breakpoint.
- Measure child gaps and reject touching rows or unexplained large voids.
- Confirm real buttons, menus and fields remain unavailable until ready.
- Confirm every main Skeleton section uses one `skeleton-section-top-border`.
- Keep a localised title outside `aria-hidden` if a section displays one.
- Keep the icon decorative and use the explicit navigation placeholder gap.
- Confirm the historical bottom-end busy indicator remains separate from page
  skeleton geometry.
- Check reduced motion, forced colours, RTL, overflow and console/page errors.
- Hold initialization only through the loading snapshot; release intentional
  test gates in `finally` before the product fail-open deadline.

## Consumer boundaries

EasyStud keeps its panel counts, card dimensions, navigation-shaped header,
responsive offsets, 320 ms Student Management handoff and 8-second fail-open.
Course Banner Builder must define its own page composition before consuming
these primitives. Copying EasyStud-specific selectors or fixture timing into
another plugin is forbidden.

## Consumer delivery

Consumers synchronize this family from the immutable Kit Git SHA recorded in
their own `EED-*` batch. They must not infer consumer geometry, lifecycle or
fail-open timing from this contract.
