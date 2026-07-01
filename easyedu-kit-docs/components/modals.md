# Modals

EasyEdu modals use Moodle-compatible markup with a shared visual shell.

## Mixins

```scss
.my-modal {
  @include easyedu.modal-surface;
}

.my-modal__header {
  @include easyedu.modal-header;
}

.my-modal__icon {
  @include easyedu.modal-header-icon(var(--easyedu-group));
}

.my-modal__section {
  @include easyedu.modal-section;
}
```

## Variants

- Detail modal: object identity, lists and native Moodle links.
- Settings modal: editable fields and filepicker sections.
- Confirmation modal: concise risk/action confirmation.
- Move/copy modal: destination list and option checkboxes.

## Settings/detail modals

```scss
.my-settings-modal {
  @include easyedu.settings-modal-dialog;
}

.my-settings-modal__heading {
  @include easyedu.settings-modal-heading;
}

.my-settings-modal__field {
  @include easyedu.settings-modal-field;
}

.my-settings-modal__summary {
  @include easyedu.settings-modal-summary-grid;
}

.my-settings-modal__image {
  @include easyedu.image-preview;
}

.my-settings-modal__list {
  @include easyedu.metadata-list;
}
```

Use these for group/layer/banner settings, participant/user details or any modal
that combines identity, editable fields, image preview and related item lists.
