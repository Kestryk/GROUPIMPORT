# Tables And Reports

Tables are used for import previews, reports and dense administrative data.

## Mixins

```scss
.my-preview {
  @include easyedu.preview-table;
}

.my-row--warning {
  @include easyedu.table-status-row(warning);
}
```

## Variants

- `success`: interpreted or imported successfully.
- `warning`: imported with warnings or already existing data.
- `error`: cannot be imported without correction.

## Accessibility

Use real table markup for tabular data. Keep status colours paired with text or
icons so the result does not rely on colour alone.
