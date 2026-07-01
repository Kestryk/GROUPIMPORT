# Forms And Filters

EasyEdu form primitives style plugin-specific controls while keeping Moodle
forms and accessibility behaviour intact.

## Search fields

```scss
.my-search {
  @include easyedu.search-field;
}
```

Expected structure:

```html
<label class="my-search">
  <span class="fa fa-search" aria-hidden="true"></span>
  <input type="search" placeholder="Search">
</label>
```

## Segmented toggles

```scss
.my-view-toggle {
  @include easyedu.segmented-toggle;
}
```

## On/off toggles

```scss
.my-toggle-check {
  @include easyedu.toggle-check;
}
```

## File picker

```scss
.my-filepicker {
  @include easyedu.filepicker;
}

.my-filepicker__icon {
  @include easyedu.filepicker-icon;
}
```

## Detected token inputs

Use this pattern for text inputs that transform recognised identifiers into
chips, such as users by email/id or groups by name/id.

```scss
.my-token-input {
  @include easyedu.detected-token-input;
}

.my-token-row {
  @include easyedu.detected-token-row;
}

.my-token {
  @include easyedu.detected-token(success);
}
```
