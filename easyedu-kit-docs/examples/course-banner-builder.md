# Course Banner Builder Integration Notes

This example describes how Course Banner Builder should consume EasyEdu UI Kit
`v0.4.0`.

## Sync

```powershell
.\sync-easyedu-kit.ps1 -IncludeGuide -IncludeDocs -TargetPluginRoots @(
  "C:\dev\Moodle 51\MoodleWindowsInstaller-latest-501\server\moodle\local\coursebannerbuilder"
)
```

## SCSS entry point

```scss
@use "easyedu" as easyedu;

@include easyedu.motion-keyframes;

.local-coursebannerbuilder {
  @include easyedu.token-defaults;
  @include easyedu.guide-shell;
  @include easyedu.guide-rich-navigation;
  @include easyedu.guide-visuals;
  @include easyedu.guided-panel;
}
```

## Suggested component mapping

| Course Banner Builder concept | EasyEdu component |
| --- | --- |
| Main editor/card containers | `panel-shell`, `panel-header`, `split-layout` |
| Layers | `object-card`, `identity-rail`, `selectable-card`, `drag-handle` |
| Image upload | `filepicker`, `file-drop-overlay`, `image-preview` |
| Layer settings modal | `settings-modal-dialog`, `settings-modal-field`, `metadata-list` |
| Source picker dropdowns | `menu-surface`, `menu-item`, `dropdown-menu` |
| Inline help | `hover-help-host`, `help-icon` |
| Guide | `guide-shell`, `guide-rich-navigation`, `guide-visuals`, `guided-panel` |

## Guide target naming

Use semantic target attributes in Course Banner Builder templates:

```html
<button data-easyedu-guide-target="create-layer">Add layer</button>
<section data-easyedu-guide-target="layer-list">...</section>
<button data-easyedu-guide-target="save-banner">Save</button>
```

Then configure the guide:

```js
init('[data-easyedu-guide-root]', {
  storageKey: 'local_coursebannerbuilder.easyedu_guide.seen',
  firstVisit: true,
  targets: {
    createLayer: '[data-easyedu-guide-target="create-layer"]',
    layerList: '[data-easyedu-guide-target="layer-list"]',
    sourcePickers: '[data-easyedu-guide-target="source-pickers"]',
    sourcePicker: '[data-source-dropdown="category"]',
    sourceParentPicker: '[data-source-dropdown="summary-sourceparent"]',
    saveBanner: '[data-easyedu-guide-target="save-banner"]'
  },
  paths: {
    basics: [
      {
        id: 'create-layer',
        title: 'Create a first layer',
        target: 'createLayer',
        completeOn: 'coursebannerbuilder:layer-created'
      },
      {
        id: 'organise-layers',
        title: 'Organise layers',
        target: 'layerList',
        completeOn: 'coursebannerbuilder:layer-moved'
      }
    ]
  }
});
```

For source-related guide steps, avoid targeting the Moodle page navigation,
generic section headers or the configured-source table. The table can be empty
when the user has not configured anything yet, so it is a poor onboarding
target. The stable targets are the actual source UI elements:

- `sourcePickers`: a plugin-owned wrapper such as
  `data-easyedu-guide-target="source-pickers"` around the category and custom
  field dropdowns;
- `sourcePicker`: `[data-source-dropdown="category"]`, the primary "Choose a
  source" dropdown;
- `sourceParentPicker`: `[data-source-dropdown="summary-sourceparent"]`, the
  configured source parent dropdown in the selected-source summary.

If a guided path needs to wait for a real submit button but visually show the
two dropdowns, keep `target` on the real action and use `highlightTarget` for
the dropdown wrapper:

```js
{
  id: 'select-source',
  title: 'Select source',
  target: 'selectSourceButton',
  highlightTarget: 'sourcePickers',
  completeOnClick: true
}
```

Do not point the step at a nav item or an empty table only because it has the
same text label.

After a real action succeeds:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
  detail: {
    path: 'basics',
    step: 'create-layer'
  }
}));
```
