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

After a real action succeeds:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
  detail: {
    path: 'basics',
    step: 'create-layer'
  }
}));
```
