# EasyEdu Component Contract

This document defines reusable component contracts that agents must preserve
when moving UI from one plugin to another.

For guide visual parity, also use `ai/GUIDE_PARITY_CHECKLIST.md`. That checklist
is mandatory when a guide implementation is compared with EasyStud, Course
Banner Builder or another plugin using the same guide kit.

## Guide: show in interface selector

Canonical files:

- `guide/amd/src/easyedu_guide.js`
- `guide/templates/easyedu_guide.mustache`
- `scss/easyedu/components/_guide.scss`
- `docs/components/guide.md`

Must:

- resolve targets by configured target key or CSS selector;
- close the guide modal while preserving the highlight;
- scroll the target into view;
- use a `position: fixed` viewport-anchored highlight;
- keep the highlight aligned during scroll and resize;
- refresh after Bootstrap modal open/close, CSS transitions, animations, DOM
  mutations and `easyedu:guide-refresh-highlight`;
- dock guided checklists away from the highlighted target;
- show the sticky return-to-guide panel;
- clear the highlight when the return panel is dismissed;
- clear the highlight automatically when the temporary return panel auto-hides;
- allow return to the guide without losing context;
- add the stable `is-easyedu-guide-highlight-target` class to the highlighted
  target while active.

Must not:

- implement plugin-local absolute-position selectors;
- let the outline drift during scroll;
- depend on one static measurement after the click;
- use native `title` tooltips for guide actions;
- replace the kit selector with a local style that only approximates it.

Show-in-interface highlights are temporary. Guided checklist highlights are
persistent by design and should remain active until the user closes the
checklist, returns to the guide, or starts another checklist/path.

## Guide: action target versus visual target

Some guided checklist steps must wait for a real action target while visually
highlighting a more helpful parent area. For example, a "select source" step may
complete when the submit button is clicked, but the user should see the source
dropdown wrapper rather than an empty configured-source table.

Must:

- support `highlightTarget` on checklist steps;
- resolve `highlightTarget` by configured target key or CSS selector;
- keep `target` as the real action/completion target;
- highlight `highlightTarget` when it is provided, otherwise fall back to
  `showTarget`, then `target`;
- target stable controls such as dropdown wrappers, creation rows or buttons
  instead of empty result tables.

Must not:

- point onboarding steps to empty tables when the course/plugin has no data yet;
- point source-selection steps to Moodle navigation just because the label is
  similar;
- duplicate both old and new selectors for the same step.

## Guide: locked slides and unlock paths

Must:

- allow slides to declare `requires`;
- add `is-locked` to unavailable navigation cards;
- keep locked navigation cards clickable so the user can read why they are
  locked;
- skip locked slides in next/previous and keyboard navigation;
- use short one-word badges such as `Locked`;
- display long explanations in `.easyedu-guide-slide__locked`;
- support `requirestitle`, `requirescontent`, `unlockpath` and `unlocklabel`;
- render unlock paths with the alternate unlock checklist style;
- keep unlock paths separate from normal practice paths.

Must not:

- use long requirement text inside navigation badges;
- use a `not-allowed` cursor on locked navigation cards;
- share the same path name for a normal guided path and an unlock path.

## Guide: checklist persistence

Must:

- support `requiresStep` dependencies between checklist steps;
- support `requiresStepLabel`;
- show a disabled/locked visual state for blocked checklist steps with
  `data-easyedu-guide-lock-message`;
- use the same subtle striped locked visual language for blocked checklist
  steps and locked navigation cards;
- fall back to `labels.completeStepFirst` and the required step title when a
  dependent checklist step has no custom label;
- support `completeOnClick` for actions that reload the page;
- persist active path, active step, completed steps and active slide;
- restore the checklist after reload;
- when minimized, display the pending active step and visited counter.

Must not:

- mark `completeOnClick` steps complete when the user only clicks the checklist;
- lose the guide context after a real page reload;
- show only a generic title in the minimized checklist.
- auto-hide checklist highlights with a timer after the user clicks a guided
  step.

## Compact action menus

Canonical files:

- `scss/easyedu/components/_menus.scss`
- `docs/components/dropdowns.md`

Must:

- use the kit compact action trigger for overflow/action menus;
- use readable menu items with accessible focus states;
- avoid custom hover bubbles inside menus when the visible item label is enough;
- keep menus above neighbouring cards and panels.

Must not:

- use bare `...` buttons for action menus;
- create plugin-specific menu item spacing when a kit primitive exists;
- add native `title` to menu items that already have visible labels.

## Buttons and controls

Canonical files:

- `scss/easyedu/components/_buttons.scss`
- `docs/components/buttons.md`

Must:

- use button size and state primitives from the kit;
- keep icon alignment stable;
- support hover, active, focus-visible and disabled states;
- use Moodle-compatible button markup.

Must not:

- hard-code button heights or radii locally for reusable controls;
- use inconsistent icon-only hit areas;
- rely on text-only affordances where the kit defines an icon control.

## Cards and identity rails

Canonical files:

- `scss/easyedu/components/_cards.scss`
- `docs/components/cards.md`

Must:

- use `object-card`, `identity-rail` and `selectable-card` for manipulable
  objects;
- use `open-identity-rail-base` / `open-identity-rail-state` for opened
  container cards;
- use `preview-fade-list` with `card-reveal-toggle` for collapsed child lists
  such as members, groups inside a grouping, layers inside a folder, or similar
  nested content;
- use related-tag summary/detail primitives when related labels become too long
  for a single row;
- expose real selection controls in addition to visual selected states.

Must not:

- create a second left rail to fake an opened container state;
- show drag handles on objects that are not draggable in the current view;
- let related tags push badges or action buttons onto a new line.
- implement one-off gradients for collapsed child previews.

## Forms, filters and admin controls

Canonical files:

- `scss/easyedu/components/_forms.scss`
- `docs/components/forms.md`

Must:

- use compact form sizes in dense runtime filters and regular/large sizes in
  admin settings;
- use `selection-checkbox` for selectable cards, nested items and list rows;
- use `inline-reveal-panel` for card-contained search, paste, add-by-text or
  similar controls that expand inside a card;
- use `toggle-check` for binary filters inside EasyEdu filter boxes;
- use `multi-select-list(small)` for runtime filters and
  `multi-select-list(regular|large)` for settings/admin screens;
- keep focus rings on the full control wrapper.

Must not:

- use admin-sized multiselects inside card/list filter panels;
- make allowed checkboxes look disabled because another nested card type owns
  the parent container;
- replace native selects with custom lists unless keyboard and screen-reader
  behaviour is rebuilt deliberately;
- put long help text in labels when a help icon/tooltip is more appropriate.

## Badges, tokens and counters

Canonical files:

- `scss/easyedu/components/_feedback.scss`
- `docs/components/badges.md`

Must:

- use `identity-badge` for one high-priority title-line metadata badge;
- use count badge variants for numeric counts;
- use token overflow toggles for collapsed metadata lists.

Must not:

- use identity badges for numeric counters;
- let title-line metadata push primary actions out of the card header;
- rely on raw text for `+N` or collapse controls when a token style exists.

## Modals and metadata surfaces

Canonical files:

- `scss/easyedu/components/_modals.scss`
- `docs/components/modals.md`

Must:

- use `modal-runtime-animation` for custom and Moodle native modals;
- use `native-modal-loading` when a Moodle native modal resolves content
  asynchronously;
- use `settings-modal-dialog`, `metadata-section`, `metadata-scroll-list`,
  `metadata-item-chip` and `metadata-empty` for rich object detail/settings
  modals;
- use `settings-modal-filepicker` and `modal-file-drop-state` for image/file
  uploads.

Must not:

- leave raw `x` close controls;
- let a modal exceed the viewport because related lists are not collapsed into
  metadata sections;
- restyle file pickers independently in each plugin.
