# Tooltips

EasyEdu tooltips are custom hover/focus help bubbles. They should be used when a
plugin needs a consistent visual style and must avoid duplicated native browser
`title` tooltips.

## Mixins

```scss
.my-control {
  @include easyedu.hover-help-host;
}

.my-help-icon {
  @include easyedu.help-icon;
}
```

## Expected HTML

```html
<button data-easyedu-hover-help="Create a new layer">
  <span class="fa fa-plus" aria-hidden="true"></span>
</button>
```

## Notes

- Keep the help text short for controls.
- Use long tooltip variants only for explanatory text.
- Remove native `title` attributes when they duplicate the custom bubble.

## Import Contract

Tooltips are an enhancement layer, not the primary label. A consuming plugin
must keep visible button/menu labels or accessible names, then add
`data-easyedu-hover-help` only when the user benefits from extra context.

Required behaviour:

- Show on hover and keyboard focus.
- Do not show on click.
- Do not duplicate the browser native `title` bubble.
- Keep short control text compact; use the long variant only for explanatory
  help that cannot fit in the surrounding UI.
- Remove tooltip attributes from actions once they move into a visible menu,
  because menu item labels already explain the action.

Common mistakes to avoid:

- Adding both `title` and `data-easyedu-hover-help`.
- Leaving hover bubbles on compact overflow menu items.
- Using a tooltip as the only accessible name for an icon-only control.
- Hard-coding tooltip colours in a plugin instead of using the kit mixins.
