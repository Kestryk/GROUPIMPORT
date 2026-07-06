# Modals

EasyEdu modals use Moodle-compatible markup with a shared visual shell.

## Mixins

```scss
.my-modal {
  @include easyedu.modal-surface;
}

.my-modal-root {
  @include easyedu.modal-runtime-animation(".my-modal");
}

.my-native-modal-root {
  @include easyedu.modal-runtime-animation(".modal-dialog");
  @include easyedu.native-modal-loading(".loading-icon");
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

.my-danger-modal {
  @include easyedu.destructive-confirmation-modal;
}

.my-move-modal {
  @include easyedu.move-destination-modal;
}
```

## Variants

- Detail modal: object identity, lists and native Moodle links.
- Settings modal: editable fields and filepicker sections.
- Confirmation modal: concise risk/action confirmation.
- Move/copy modal: destination list and option checkboxes.
- Moodle native bridge modal: decorate Moodle's `.modal-dialog` with a
  plugin-specific class, then apply `modal-runtime-animation()` on the native
  modal root so it opens with the same EasyEdu motion as custom modals.
  If the native body is still resolving, toggle an `is-loading` class and use
  `native-modal-loading()` to harmonise Moodle's `core/loading` template.
  When a Moodle native modal is created before it becomes visible, temporarily
  add `is-easyedu-animating` after it receives the visible state to replay the
  EasyEdu entrance motion.

## Move/Copy Modal Structure

Use these optional class hooks inside move/copy modals:

```html
<p class="easyedu-modal__help">Choose where the selected items should go.</p>
<div class="easyedu-modal__destination">
  <label>Destination</label>
  <select class="form-select">...</select>
</div>
<label class="easyedu-modal__option">
  <input type="checkbox">
  <span>Remove from original location</span>
</label>
```

## Settings/detail modals

```scss
.my-settings-modal {
  @include easyedu.settings-modal-dialog;
  @include easyedu.modal-file-drop-state(".is-file-drag-over", var(--easyedu-primary));
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

.my-settings-modal__image-placeholder {
  @include easyedu.image-preview-placeholder;
}

.my-settings-modal__help {
  @include easyedu.settings-modal-help-icon;
}

.my-settings-modal__filepicker {
  @include easyedu.settings-modal-filepicker;
}

.my-settings-modal__list {
  @include easyedu.metadata-list;
}

.my-settings-modal__section {
  @include easyedu.metadata-section;
}

.my-settings-modal__section summary {
  @include easyedu.metadata-section-summary;
}

.my-settings-modal__section-scroll {
  @include easyedu.metadata-scroll-list;
}

.my-settings-modal__chip {
  @include easyedu.metadata-item-chip;
}

.my-settings-modal__empty {
  @include easyedu.metadata-empty;
}

.my-history-list {
  @include easyedu.history-list;
}

.my-history-list__main {
  @include easyedu.history-item-main;
}

.my-history-list__meta {
  @include easyedu.history-meta;
}
```

Use these for group/layer/banner settings, participant/user details or any modal
that combines identity, editable fields, image preview and related item lists.

The filepicker primitive is intentionally visual only. The plugin remains
responsible for connecting Moodle's file API, validating accepted file types and
updating the displayed filename.

If the whole modal accepts image/file drops, combine `settings-modal-dialog`
with `modal-file-drop-state` and toggle the provided state class from plugin
JavaScript.

## Import Audit Checklist

Use this checklist before recreating a modal locally:

- The modal shell uses `modal-surface` or `settings-modal-dialog`.
- Runtime entrance/exit motion is applied through `modal-runtime-animation`,
  including Moodle native modal bridges.
- Moodle native loading states use `native-modal-loading` instead of the raw
  default spinner when the modal body resolves asynchronously.
- The header icon uses `modal-header-icon`; the icon must be centred both
  visually and by line-height.
- Close controls use `close-button`; do not leave raw `x` links.
- Field groups use `settings-modal-field` and short labels; longer Moodle help
  text belongs in a help icon/tooltip.
- Related-object lists use `metadata-section`, `metadata-scroll-list`,
  `metadata-item-chip` and `metadata-empty`.
- Image/file areas use `image-preview`, `image-preview-placeholder`,
  `settings-modal-filepicker` and `modal-file-drop-state`.
- The modal should fit inside the viewport without requiring the browser page to
  scroll; if content grows, reorganise into sections/lists before increasing
  size.

Plugin-owned responsibilities:

- Data loading, capability checks and Moodle API calls.
- File validation and file area persistence.
- Export actions for metadata lists.
- The exact field set for Moodle object settings.
