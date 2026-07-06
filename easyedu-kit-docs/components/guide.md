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

The guide modal size is standardised by public tokens so every EasyEdu plugin
can share the same proportions while still allowing Moodle themes to override
them:

```scss
.my-plugin {
  --easyedu-guide-modal-width: 72rem;
  --easyedu-guide-modal-height: min(90vh, 46rem);
  --easyedu-guide-modal-max-height: calc(100vh - 2rem);
  --easyedu-guide-modal-min-height: min(42rem, calc(100vh - 2rem));
}
```

## Rich guide navigation

```scss
.my-plugin {
  @include easyedu.guide-rich-navigation;
}
```

Use the rich kit template as the default source for Moodle plugins. It includes
the EasyStud-grade header, subtitle, map flow, navigation cards, progress bar,
slide icons, visual flow cards and footer step count placement. Avoid copying a
reduced/base guide template into plugins unless the product intentionally needs a
minimal guide.

Expected classes:

```html
<div class="easyedu-guide-nav-wrap">
  <button class="easyedu-guide-nav-arrow easyedu-guide-nav-arrow--prev">...</button>
  <nav class="easyedu-guide-nav">
    <button class="easyedu-guide-nav-item has-guided-path" data-easyedu-guided-label="Guide">
      <span class="easyedu-guide-nav-item__icon" aria-hidden="true">
        <span class="fa fa-route" aria-hidden="true"></span>
      </span>
      <span class="easyedu-guide-nav-copy">
        <small>Guided</small>
        <span>Create a first structure</span>
      </span>
    </button>
  </nav>
  <button class="easyedu-guide-nav-arrow easyedu-guide-nav-arrow--next">...</button>
</div>
```

Guided-path nav cards should use a short badge label, normally `Guide`, through
`data-easyedu-guided-label`. Longer explanatory wording belongs in the card
subtitle or guided panel, not in the badge, otherwise the badge can overflow the
navigation card.

Expected interaction:

- Left and right arrow keys move to the previous or next guide slide while the
  guide modal is open.
- Home and End move to the first or last guide slide.
- Escape closes the guide modal.
- Vertical mouse-wheel movement over the slide navigation should scroll the
  horizontal navigation rail without showing a native scrollbar.
- The active navigation item should be kept in view when slides change.
- Navigation rail arrows must be disabled when the rail is already at the start
  or end of the scroll range. Recalculate this after opening the modal, after
  nav scrolling, after slide changes and after window resizing.
- Footer progress text should use the visible `Step X of Y` wording from the
  language string/template and sit directly next to the Previous/Next buttons.

Guided checklist steps may need to open a Moodle modal before their target is
available. In that case, define `open` with either a configured target key or a
selector, and optionally `openDelay` in milliseconds:

```js
{
  id: 'preview',
  title: 'Interactive preview',
  target: 'previewModal',
  open: 'appearanceButton',
  openDelay: 650
}
```

When the step is clicked, the guide triggers the opener, waits for the modal,
scrolls/highlights the target, and marks the step complete. Keep the guided
panel above Moodle modals so the checklist remains usable after the modal opens.

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
      <span>
        <strong>Create a group</strong>
        <small>Use the creation field, then validate.</small>
      </span>
    </button>
  </div>
  <div class="easyedu-guided-panel__message is-complete">
    <span class="fa fa-check-circle" aria-hidden="true"></span>
    <span>All steps are complete.</span>
  </div>
  <footer class="easyedu-guided-panel__footer">
    <button class="btn btn-outline-primary btn-sm easyedu-guided-panel__return">
      Return to guide
    </button>
  </footer>
</aside>
```

The generic AMD module now docks the checklist away from the highlighted target
when a user clicks a checklist step or "show in the interface". It also refreshes
the highlight during scroll and resize events so the outline follows moving UI.
It updates the active step, shows step feedback, switches the minimise icon
between minus and expand, and turns the message block into the green success
state when every step is complete.

When a slide uses "show in the interface", the guide modal should close while
preserving a fixed viewport highlight on the target. A sticky return panel lets
the user reopen the guide without losing their place:

```html
<aside class="easyedu-guide-interface-return" data-easyedu-guide-interface-return hidden>
  <div class="easyedu-guide-interface-return__text">
    <strong>Return to guide</strong>
    <span>The highlighted interface area remains selected while the guide is hidden.</span>
  </div>
  <div class="easyedu-guide-interface-return__actions">
    <button class="btn btn-outline-primary btn-sm easyedu-guide-interface-return__button"
            data-easyedu-guide-interface-return-button="1">
      <span class="fa fa-question-circle" aria-hidden="true"></span>
      <span>Return to guide</span>
    </button>
    <button class="btn btn-outline-secondary btn-sm easyedu-guide-interface-return__dismiss"
            data-easyedu-guide-interface-return-dismiss="1"
            aria-label="Dismiss return to guide">
      <span class="fa fa-times" aria-hidden="true"></span>
    </button>
  </div>
</aside>
```

The highlight is intentionally `position: fixed`; target calculations should use
`getBoundingClientRect()` coordinates directly so the selector remains anchored
correctly while the page scrolls.

The return panel and its highlight are temporary. They auto-hide after a short
delay, matching EasyStud, and the highlight is cleared at the same time. If the
user dismisses the return panel manually, the highlight must be cleared
immediately. Opening the guide normally while the temporary return panel is
active must also clear the old highlight. Guided checklists are different: the
highlight remains visible while the checklist is active so the user can keep the
target and the instruction together. It is cleared only when the user closes the
checklist, returns to the guide, or starts another guide flow.

## Show In Interface Button

Slides that point to real UI elements should use the shared show button:

```html
<button class="btn btn-outline-primary btn-sm easyedu-guide-slide__show">
  <span class="fa fa-location-arrow" aria-hidden="true"></span>
  <span>Show in the interface</span>
</button>
```

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

When a target moves after an accordion, pagination, filter or Ajax update,
plugins should ask the guide to recalculate the outline:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-refresh-highlight', {
  detail: {
    target: 'createLayer',
    dock: true
  }
}));
```

Use `target` to point to either a configured target key or a CSS selector. Omit
`target` to refresh the currently highlighted element. Use `dock: false` only
when the plugin intentionally wants to keep the checklist on its current side.

Checklist steps can separate the real action target from the visual highlight.
Use `target` for the element that completes the action, and `highlightTarget`
for the area the user should look at:

```js
{
  id: 'select-source',
  title: 'Select a source',
  target: 'selectSourceButton',
  highlightTarget: 'sourcePickers',
  completeOnClick: true
}
```

This is useful when a step should complete after a submit button click but the
helpful visual area is a wrapper containing dropdowns, filters or creation
controls. Do not target an empty results table, page navigation item or generic
heading when a stable control wrapper exists.

For source-selection interfaces, prefer a stable wrapper such as:

```html
<div data-easyedu-guide-target="source-pickers">
  ...
</div>
```

Then expose both action and visual targets:

```js
targets: {
  sourcePicker: '[data-easyedu-guide-target="source-pickers"]',
  selectSourceButton: '[data-action="plugin-submit-source"]'
}
```

Use `target: 'selectSourceButton'` when the real action is the submit button,
and `highlightTarget: 'sourcePicker'` when the useful visual area is the source
dropdown wrapper. Avoid using configured-source tables as guide targets when
they can be empty before setup.

## Conditional slides and guided paths

Some guide slides are only useful after the user has created or selected an
object in the current view. For example, a "general preview" slide should not be
available in a banner editor before a source exists.

Slides can declare a prerequisite with `requires`. The value can be either a
configured target key or a CSS selector, using the same resolution rules as
`target`.

```json
{
  "title": "General preview",
  "target": "visualEditor",
  "requires": "visualEditor",
  "requiresbadge": "Locked",
  "requireslabel": "Source",
  "requirestitle": "Create or select a source first",
  "requirescontent": "The preview slide needs a source to exist before it can point to the real interface.",
  "unlockpath": "source-setup",
  "unlocklabel": "Create a source"
}
```

When the prerequisite cannot be found:

- the navigation card receives `is-locked`;
- next/previous and keyboard navigation skip the card;
- clicking the card opens the slide in a temporary locked state;
- `requiresbadge` is shown as a compact one-word badge in the navigation card;
- the locked slide content explains why it is blocked and can start an unlock
  checklist through `unlockpath`;
- any guided checklist step using `requires` is disabled and displays its
  `requiresLabel` text.

Use a very short badge label, such as "Locked". Long explanations belong in
`requirestitle` and `requirescontent`; do not put them in the navigation card,
otherwise translated labels can overflow the thumbnail. Put a creation/setup
slide before locked slides so the user can immediately understand how to unlock
the next path.

The reusable template expects these optional fields on each slide:

| Field | Purpose |
| --- | --- |
| `requires` | Target key or selector that must exist before the slide is available. |
| `requiresbadge` | Short badge shown on the locked navigation card. Defaults to `guiderequiresbadge`. |
| `requirestitle` | Title of the locked-state panel inside the slide. |
| `requirescontent` | Longer explanation shown inside the locked-state panel. |
| `unlockpath` | Guided path to start from the locked-state panel. |
| `unlocklabel` | Button label for the unlock path. |

Required template hooks:

```html
<section data-easyedu-guide-slide="2" data-easyedu-guide-requires="visualEditor">
  <div class="easyedu-guide-slide__locked">
    <h4>{{requirestitle}}</h4>
    <p>{{requirescontent}}</p>
    <button class="easyedu-guide-slide__unlock" data-easyedu-guide-start-path="{{unlockpath}}">
      {{unlocklabel}}
    </button>
  </div>
</section>
```

Unlock paths can be visually distinguished with `unlockPaths` in the guide
configuration:

```js
init('[data-easyedu-guide-root]', {
  unlockPaths: ['source-setup']
});
```

Keep unlock paths separate from normal practice paths. For example, a
`configured-sources` path can teach the source list with the standard checklist
style, while `unlock-source-preview` can use the amber unlock style and explain
which blocked slide it unlocks.

Use `pathLabels` when an unlock path should name the blocked slide:

```js
init('[data-easyedu-guide-root]', {
  pathLabels: {
    'unlock-source-preview': 'Unlock: General preview'
  }
});
```

Checklist steps can depend on earlier checklist steps with `requiresStep`. The
dependent step stays disabled until the required step is complete and can show a
short requirement label:

```json
{
  "id": "select-source",
  "title": "Select source",
  "target": "selectSourceButton",
  "requiresStep": "choose-source",
  "requiresStepLabel": "Choose a source first"
}
```

Checklist steps may separate the real action target from the visual highlight
target:

```json
{
  "id": "select-source",
  "title": "Select source",
  "target": "selectSourceButton",
  "highlightTarget": "sourcePickers",
  "requiresStep": "choose-source",
  "completeOnClick": true
}
```

Use `target` for the element that should complete the action, such as a submit
button. Use `highlightTarget` for the clearer visual area, such as a wrapper
around related dropdowns. This prevents guides from highlighting empty result
tables or unrelated navigation simply because their text labels are similar.
`showTarget` is accepted as an alias for `highlightTarget` when plugin code
already uses that wording.

Locked checklist steps receive `is-locked`, `aria-disabled="true"` and
`data-easyedu-guide-lock-message`. The kit displays that lock message as a
small overlay on the blocked step. Locked checklist steps use the same subtle
striped language as locked navigation cards so the user recognises them as
temporarily unavailable rather than broken. If `requiresStepLabel` is omitted,
the kit falls back to `labels.completeStepFirst` and inserts the required step
title. Use this default for ordinary linear checklists, and provide
`requiresStepLabel` only when the user-facing wording needs to be more specific.

When a real interface action reloads the page, use `completeOnClick` on the
step that targets the real button or link. The guide stores the checklist path,
active step, completed steps and active slide before the browser follows the
click. After reload, the same checklist is restored and can show the completed
state.

```json
{
  "id": "select-source",
  "title": "Select source",
  "target": "selectSourceButton",
  "completeOnClick": true
}
```

Do not mark `completeOnClick` steps as complete from the checklist click alone.
The kit intentionally waits for the real click on the target element so the
guided path represents actual user progress.

## Highlight and show-in-interface behaviour

The kit highlight used by checklist steps and "show in the interface" is
viewport anchored. It uses a fixed overlay that is recalculated after scrolling,
resizing, modal opening/closing, CSS transitions, animations, DOM mutations and
plugin-dispatched refresh events. This avoids the fragile absolute-position
behaviour where the highlighted outline drifts away from the selected DOM
element while the page scrolls.

When a target is shown, the reusable AMD also applies
`is-easyedu-guide-highlight-target` to the selected DOM element and removes it
from the previous target. The fixed overlay remains the main visual highlight;
the class exists so consuming plugins can attach non-destructive local behaviour
or test the currently selected guide target.

The recommended pattern is:

- resolve the target from a configured target key or a selector;
- close the guide modal while preserving the highlight;
- scroll the target into view;
- dock the checklist away from the highlighted target;
- show the sticky return-to-guide card;
- refresh the highlight after plugin UI transitions with
  `easyedu:guide-refresh-highlight`.

The generic AMD listens to `scroll`, `resize`, `transitionend`,
`animationend`, `shown.bs.modal`, `hidden.bs.modal` and DOM mutations. Plugins
should still dispatch `easyedu:guide-refresh-highlight` after intentional Ajax
or view-state changes so the refresh happens at the semantic moment, not only
after the browser reports movement.

Checklist clicks should not trigger Moodle toast notifications by default. Use
the guided panel message area for step feedback, and reserve toasts for real
plugin actions such as save, create, delete or failed permission checks.
Checklist highlights must remain stable until explicit cancellation; do not
auto-hide them just because the step was clicked. Only temporary
show-in-interface highlights should disappear automatically with the sticky
return panel.

## Minimized guided checklist

When the guided checklist is minimized, the header remains visible and must show
the current pending step, not only the generic checklist title. The reusable AMD
updates `[data-easyedu-guide-checklist-title]` with
`Guided path: {active step title}` and
`[data-easyedu-guide-checklist-subtitle]` with the visited counter. Plugins can
localise these two parts through `labels.guidedPath` and `labels.visited`.

Recommended plugin-owned hooks:

- Add a stable `data-easyedu-guided-target` selector to slides or guided steps
  that can point to a real interface element.
- Dispatch `easyedu:guide-step-complete` after the user performs the real
  action, not only after they click the checklist item.
- Dispatch `easyedu:guide-refresh-highlight` after transitions that move the
  highlighted element, such as expanding a card, changing page or injecting Ajax
  results.
- Keep demo-only slides independent from real Moodle data so the guide still
  teaches something when a course is empty.
- If a highlighted target can move because of expansion, pagination or Ajax,
  refresh the highlight after that UI transition completes.

For plugins with many moving parts, see `docs/components/orchestration.md` for a
complete hook map covering view toggles, filters, pagination, Ajax updates,
responsive trays and nested accordions.

## Extraction status

The kit now includes most generic visual guide primitives from EasyStud. Plugin
specific slide content and exact demos still belong in each plugin.
