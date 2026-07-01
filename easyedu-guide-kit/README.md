# EasyEdu Guide Kit

Reusable onboarding foundation for EasyEdu Moodle plugins.

The guide kit is not a complete guide for a specific plugin. It provides the
common behaviour that plugins can embed and configure:

- tutorial modal lifecycle;
- reusable compass launcher button styling;
- slide navigation;
- "show in the interface" highlights;
- guided checklist progress;
- first-visit discovery state;
- responsive-friendly floating checklist;
- custom completion events emitted by plugin actions.

Each plugin keeps its own content, selectors and language strings. This keeps
plugins independent while making the interaction model consistent across the
EasyEdu suite.

## Suggested plugin structure

Copy this folder into a plugin as `easyedu-guide-kit/`, then adapt or move the
files into Moodle-native locations:

```text
your-plugin/
  amd/src/easyedu_guide.js        copied/adapted from guide/amd/src/
  templates/easyedu_guide.mustache copied/adapted from guide/templates/
  lang/en/your_plugin.php         strings copied from guide/lang/en/
  lang/fr/your_plugin.php         strings copied from guide/lang/fr/
```

Keep a small note in the plugin README:

```text
Embedded EasyEdu Guide Kit: v0.1.0
Source: git@github.com:Kestryk/easyedu-ui-kit.git
```

## AMD initialisation contract

The generic module expects a root element and a configuration object:

```js
import {init} from './easyedu_guide';

init(document.querySelector('[data-easyedu-guide-root]'), {
  storageKey: 'coursebannerbuilder.guide.seen',
  firstVisit: true,
  targets: {
    createLayer: '[data-banner-create-layer]',
    layerList: '[data-banner-layer-list]',
    saveButton: '[data-banner-save]'
  },
  paths: {
    basics: [
      {
        id: 'create-layer',
        title: 'Create a layer',
        target: 'createLayer',
        completeOn: 'easyedu:layer-created'
      }
    ]
  }
});
```

## Target convention

Prefer semantic data attributes over fragile CSS implementation selectors:

```html
<button data-easyedu-guide-target="create-layer">Add layer</button>
<section data-easyedu-guide-target="layer-list">...</section>
```

The plugin can then map targets by name:

```js
targets: {
  createLayer: '[data-easyedu-guide-target="create-layer"]'
}
```

## Completion event convention

Plugin actions should complete guided steps by dispatching a custom event after
the real action succeeds:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
  detail: {
    path: 'basics',
    step: 'create-layer'
  }
}));
```

The guide also supports plugin-specific events through each step's `completeOn`
property.

## First visit

Use a plugin-specific `storageKey` so guides do not conflict between plugins.
If the plugin prefers Moodle user preferences instead of browser storage, keep
the same public behaviour but replace the storage adapter in the plugin copy.

## Styling

The guide assumes the EasyEdu SCSS kit is present. Use the shared tokens instead
of hard-coded colours whenever possible. Moodle themes should be able to
override the public `--easyedu-*` variables on the plugin root.
