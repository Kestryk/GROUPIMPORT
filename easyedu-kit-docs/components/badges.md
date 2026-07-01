# Badges And Tokens

Badges and tokens communicate metadata such as roles, groups, categories,
statuses and item counts.

## Mixins

```scss
.my-token {
  @include easyedu.token-pill(#eef8f2, #c7e3d1, #29724d);
}

.my-count {
  @include easyedu.count-badge-filled(var(--easyedu-group));
}

.my-more-token {
  @include easyedu.token-overflow-toggle(#eef8f2, #c7e3d1, #29724d);
}
```

Use neutral count badges for `0`, and filled semantic badges when the count is
greater than zero.
