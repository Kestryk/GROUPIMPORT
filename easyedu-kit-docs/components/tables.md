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

.my-report-summary {
  @include easyedu.report-summary-grid;
}

.my-report-summary__item {
  @include easyedu.report-summary-item(var(--easyedu-success-soft), #cfe7d9, var(--easyedu-success));
}

.my-report-title {
  @include easyedu.report-title(var(--easyedu-success));
}

.my-report-list {
  @include easyedu.report-list;
}

.my-preview-notice {
  @include easyedu.preview-notice;
}

.my-preview-toolbar {
  @include easyedu.preview-toolbar;
}

.my-preview-table-wrap {
  @include easyedu.preview-table-wrap;
}

.my-status {
  @include easyedu.preview-status(#e8f6ee, #1f6748);
}
```

## Variants

- `success`: interpreted or imported successfully.
- `warning`: imported with warnings or already existing data.
- `error`: cannot be imported without correction.

## Accessibility

Use real table markup for tabular data. Keep status colours paired with text or
icons so the result does not rely on colour alone.
