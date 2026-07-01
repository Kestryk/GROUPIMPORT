# Panels

Panels are the large boxes that organise an EasyEdu management screen.

## Mixins

```scss
.my-panel {
  @include easyedu.panel-shell;
}

.my-panel__header {
  @include easyedu.panel-header(var(--easyedu-primary));
}

.my-layout {
  @include easyedu.split-layout;
}
```

## Patterns

- Use panels for major work areas.
- Use filter shells inside panels for search and filtering controls.
- Keep panel action rows single-line on desktop; move overflowing actions into
  an overflow menu or mobile tray.
