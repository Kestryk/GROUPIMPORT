# Guide

The EasyEdu guide kit has two layers:

- `guide-shell`: modal, launcher, slides, basic navigation, highlight and basic
  checklist.
- rich optional layers: navigation thumbnails, visual demos and guided panel.

## Base guide

```scss
.my-plugin {
  @include easyedu.guide-shell;
}
```

## Rich guide navigation

```scss
.my-plugin {
  @include easyedu.guide-rich-navigation;
}
```

Expected classes:

```html
<div class="easyedu-guide-nav-wrap">
  <button class="easyedu-guide-nav-arrow easyedu-guide-nav-arrow--prev">...</button>
  <nav class="easyedu-guide-nav">
    <button class="easyedu-guide-nav-item has-guided-path" data-easyedu-guided-label="Guide">
      <span class="fa fa-route" aria-hidden="true"></span>
      <span class="easyedu-guide-nav-copy">
        <small>Guided</small>
        <span>Create a first structure</span>
      </span>
    </button>
  </nav>
  <button class="easyedu-guide-nav-arrow easyedu-guide-nav-arrow--next">...</button>
</div>
```

Expected interaction:

- Left and right arrow keys move to the previous or next guide slide while the
  guide modal is open.
- Home and End move to the first or last guide slide.
- Escape closes the guide modal.
- Vertical mouse-wheel movement over the slide navigation should scroll the
  horizontal navigation rail without showing a native scrollbar.
- The active navigation item should be kept in view when slides change.

## Visual demos

```scss
.my-plugin {
  @include easyedu.guide-visuals;
}
```

Useful classes:

- `.easyedu-guide-visual`
- `.easyedu-guide-mini-card`
- `.easyedu-guide-mini-card--participant`
- `.easyedu-guide-mini-card--group`
- `.easyedu-guide-mini-card--grouping`
- `.easyedu-guide-flow-arrow`
- `.easyedu-guide-demo-cursor`
- `.easyedu-guide-demo-drop`

## Guided panel

```scss
.my-plugin {
  @include easyedu.guided-panel;
}
```

The guided panel supports left/right docking, minimised state and complete state:

```html
<aside class="easyedu-guided-panel is-docked-right">
  <header class="easyedu-guided-panel__header">...</header>
  <div class="easyedu-guided-panel__steps">
    <button class="easyedu-guided-panel__step is-complete">
      <span class="easyedu-guided-panel__index">1</span>
      <span>Create a group</span>
    </button>
  </div>
  <div class="easyedu-guided-panel__message is-complete">All steps are complete.</div>
</aside>
```

The generic AMD module now docks the checklist away from the highlighted target
when a user clicks a checklist step or "show in the interface". It also refreshes
the highlight during scroll and resize events so the outline follows moving UI.

## JavaScript contract

The reusable AMD foundation handles base modal and checklist behaviour. Rich
plugins should complete real actions using events:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
  detail: {
    path: 'basics',
    step: 'create-layer'
  }
}));
```

## Extraction status

The kit now includes most generic visual guide primitives from EasyStud. Plugin
specific slide content and exact demos still belong in each plugin.
