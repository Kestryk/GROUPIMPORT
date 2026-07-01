# Buttons

Button mixins complement Moodle/Bootstrap classes rather than replacing them.

## Mixins

```scss
.my-action {
  @include easyedu.action-button;
}

.my-icon-action {
  @include easyedu.icon-button;
}

.my-close {
  @include easyedu.close-button;
}

.my-more {
  @include easyedu.overflow-button;
}

.my-compact-actions {
  @include easyedu.action-menu-trigger;
}

.my-compact-actions__icon {
  @include easyedu.action-menu-trigger-icon;
}
```

## Compact action menu trigger

Use `action-menu-trigger` when an action row or a dense card cannot display all
actions without wrapping. The visual convention is a small three-line trigger,
not an ellipsis, so users read it as “more actions for this object” rather than
hidden text.

```html
<button class="my-compact-actions" type="button" aria-expanded="false">
  <span class="my-compact-actions__icon" aria-hidden="true"></span>
  <span class="visually-hidden">More actions</span>
</button>
```

## Disabled actions

Disabled buttons should remain visually understandable but clearly unavailable.
On small screens, prefer hiding unavailable contextual actions rather than
showing many disabled buttons.
