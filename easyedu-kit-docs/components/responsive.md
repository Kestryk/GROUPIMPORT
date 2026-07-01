# Responsive

Responsive mixins provide common behaviour for Moodle plugins on tablets and
phones without forcing a single layout.

## Stack split views

```scss
.my-two-column-layout {
  @include easyedu.responsive-stack(56rem);
}
```

## Mobile action tray

```scss
.my-mobile-actions {
  @include easyedu.mobile-action-tray;
}
```

Use the action tray only for contextual actions that are currently available.
Avoid showing disabled actions on small screens.

## Mobile cards and guide panel

```scss
.my-card {
  @include easyedu.mobile-card-density;
}

.my-guided-panel {
  @include easyedu.mobile-guided-panel;
}
```

On touch screens, selection and action trays should be treated as the primary
workflow. Drag/drop can remain available but should not be required.
