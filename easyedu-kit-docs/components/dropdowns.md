# Dropdowns And Menus

EasyEdu menus cover dropdown lists, context menus and compact overflow action
menus.

## Mixins

```scss
.my-dropdown-menu {
  @include easyedu.menu-surface;
}

.my-dropdown-menu button {
  @include easyedu.menu-item;
}

.my-context-menu {
  @include easyedu.context-menu;
}
```

## Behaviour

- Menus should stay above cards and scrollable panels.
- Menu items should expose focus states equivalent to hover states.
- Do not keep hover-help tooltips on actions once they are moved inside a menu:
  the menu label is visible and duplicate bubbles add noise.
- Disabled actions should remain visible only when they help explain why an
  action is unavailable; otherwise hide unavailable actions.
