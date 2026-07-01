# Pagination And List Tools

Pagination bars should stay aligned between neighbouring columns, even when only
one column has multiple pages.

## Mixins

```scss
.my-pagination {
  @include easyedu.pagination-bar;
}

.my-pagination__controls {
  @include easyedu.pagination-controls;
}

.my-list-tools {
  @include easyedu.list-tools;
}
```

Place select-all/select-results controls in the list tools area, not inside the
pagination controls, so the page navigation remains centred.
