# Cards

Cards represent user-manipulable objects: participants, groups, groupings,
layers, images, sources or any plugin-specific item.

## Mixins

```scss
.my-card {
  @include easyedu.object-card(var(--easyedu-group));
  @include easyedu.identity-rail(var(--easyedu-icon-group));
  @include easyedu.selectable-card(var(--easyedu-group));
  @include easyedu.drag-handle;
}
```

## Variants

- `object-card`: base card shell with identity border.
- `identity-rail`: icon embedded in the left identity rail.
- `selectable-card`: selected/aria-selected states.
- `expanded-card`: smooth expanded state foundation.
- `drag-handle`: swaps the identity icon for a drag handle on hover.
- `disabled-card`: compatible visual disabled state for non-target columns.

## Expected structure

```html
<article class="my-card" aria-selected="false">
  <header class="my-card__header">
    <span class="my-card__title">Object name</span>
  </header>
</article>
```

## Accessibility

Cards that are selectable should expose a real checkbox or button in addition to
visual selected state. Do not rely on drag/drop as the only interaction method.
