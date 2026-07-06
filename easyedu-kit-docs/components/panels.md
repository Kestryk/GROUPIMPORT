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

.my-clear-selection-panel {
  @include easyedu.sticky-selection-panel(var(--easyedu-primary));
}

.my-clear-selection-panel__button {
  @include easyedu.sticky-selection-button;
}

.my-clear-selection-panel__count {
  @include easyedu.sticky-selection-count;
}
```

## Patterns

- Use panels for major work areas.
- Use filter shells inside panels for search and filtering controls.
- Keep panel action rows single-line on desktop; move overflowing actions into
  an overflow menu or mobile tray.
- Use sticky selection panels for compact persistent feedback such as "3 items
  selected" plus one recovery action. On mobile, prefer `mobile-action-tray`
  instead so the panel does not compete with touch actions.
