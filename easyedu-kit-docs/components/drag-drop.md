# Drag And Drop

Drag/drop styles should make compatible targets obvious while preserving
selection-based alternatives for keyboard and touch users.

## Mixins

```scss
.my-target.is-drop-target {
  @include easyedu.drop-target-overlay(var(--easyedu-group));
}

.my-card.is-drag-stack {
  @include easyedu.drag-stack-preview;
}

.my-column.is-not-compatible {
  @include easyedu.drag-disabled-zone;
}
```

Use drag/drop as enhancement only. Always provide buttons or context menu
actions for the same operation.
