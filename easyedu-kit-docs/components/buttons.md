# Buttons

Button mixins complement Moodle/Bootstrap classes rather than replacing them.
The plugin should keep semantic Bootstrap classes such as `btn`,
`btn-primary`, `btn-outline-secondary` or `btn-outline-danger`, then add an
EasyEdu mixin on the plugin-specific selector to align spacing, icons and
states.

## Mixins

```scss
.my-action {
  @include easyedu.action-button;
}

.my-action--small {
  @include easyedu.action-button(small);
}

.my-action--large {
  @include easyedu.action-button(large);
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

## Sizes

Use the same size names across buttons, menus and form controls.

| Size | Intended usage |
| --- | --- |
| `small` | Dense cards, compact filter rows, overflow menu triggers and responsive trays. |
| `regular` | Default toolbar actions, create buttons and modal footer buttons. |
| `large` | Prominent onboarding, guide entry points or hero actions. |

Avoid hard-coding widths per plugin. Prefer the mixin size first, then adjust
only the container layout if translated labels need more room.

## States

The reusable state contract is:

- `:hover` and `:focus-visible` share the same visual intent.
- `[aria-expanded="true"]`, `[aria-pressed="true"]`, `.active` and `.is-active`
  represent a selected/open action.
- `:disabled`, `[aria-disabled="true"]` and `.disabled` must look unavailable
  and should not receive pointer events.
- Busy/loading states are plugin-owned, but should keep button dimensions
  stable and pair with the kit busy indicators where possible.

```html
<button class="btn btn-outline-secondary my-action" type="button">
  <span class="fa fa-arrow-right" aria-hidden="true"></span>
  <span>Move item(s)</span>
</button>
```

## Compact Action Menu Trigger

Use `action-menu-trigger` when an action row or a dense card cannot display all
actions without wrapping. The visual convention is a small three-line trigger,
not an ellipsis, so users read it as "more actions for this object" rather than
hidden text.

The trigger intentionally borrows the compact, rounded feeling of EasyEdu
labels/chips: it should feel like a lightweight affordance inside an action row,
not a heavy primary button.

```html
<button class="my-compact-actions" type="button" aria-expanded="false">
  <span class="my-compact-actions__icon" aria-hidden="true"></span>
  <span class="visually-hidden">More actions</span>
</button>
```

## Usage Guide

- Primary validation/save: keep Moodle `btn btn-primary`, add
  `action-button(regular)`.
- Secondary/cancel: keep `btn btn-outline-secondary`, add
  `action-button(regular)`.
- Destructive action: keep `btn btn-outline-danger`, add
  `action-button(regular)` and use explicit wording.
- Square icon action: use `icon-button`, always include an accessible label.
- Dense overflow trigger: use `action-menu-trigger(small)` with
  `action-menu-trigger-icon`.
- Modal close action: use `close-button`; do not leave a raw `x` link.

## Disabled Actions

Disabled buttons should remain visually understandable but clearly unavailable.
On small screens, prefer hiding unavailable contextual actions rather than
showing many disabled buttons.

## Import Audit Checklist

Before accepting a plugin-local button style, check:

- The button keeps Moodle/Bootstrap semantics (`btn`, `btn-primary`,
  `btn-outline-*`) and adds the EasyEdu mixin as the visual layer.
- Icon and text are vertically centred in every state and translated labels do
  not collapse the hit area.
- `small`, `regular` and `large` variants are chosen from the kit, not by
  hard-coded local heights.
- Focus-visible is at least as visible as hover and never clips under adjacent
  filter boxes, cards or modal sections.
- The close button is a styled button, never a raw `x` link.
- The guide launcher and "Show in the interface" button use the guide contract,
  not a one-off local button style.
- Compact overflow action rows use `action-menu-trigger` and
  `action-menu-trigger-icon`.

## Errors To Avoid

- Do not replace Moodle button classes entirely; the kit is a visual layer, not
  a semantic button framework.
- Do not use native browser `title` tooltips on buttons that already have an
  EasyEdu hover-help bubble.
- Do not duplicate hidden overflow actions in the visible row on responsive
  screens.
- Do not put raw icon-only buttons in modals without `aria-label`.
