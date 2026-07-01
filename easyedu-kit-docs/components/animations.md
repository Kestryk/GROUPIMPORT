# Animations

Include shared keyframes once from a stylesheet entry point:

```scss
@include easyedu.motion-keyframes;
```

Reusable motion helpers:

```scss
.my-region {
  @include easyedu.expandable-region;
}

.my-card {
  @include easyedu.transition-standard(background, border-color, box-shadow);
}
```

Motion should be visible enough to explain state changes, but never required to
understand the interface.

Shared keyframes currently include modal transitions, slide entrance, pop-in,
success pulse, drop pulse, busy spinner and demo cursor click.
