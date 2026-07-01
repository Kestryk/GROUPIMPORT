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
