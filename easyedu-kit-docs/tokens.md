# Tokens

## Semantic surfaces

The kit exposes semantic modal, panel and table tokens under `--easyedu-*`:

- `--easyedu-modal-body-bg`, `--easyedu-modal-footer-bg`;
- `--easyedu-modal-header-{primary|success|warning|danger}-bg`;
- `--easyedu-semantic-border-{primary|success|warning|danger}`;
- `--easyedu-semantic-rail-{primary|success|warning|danger}`;
- `--easyedu-semantic-panel-bg`.

Themes may override these variables. Consuming plugins must not copy the
resolved gradients into local selectors when a semantic variant already
exists.

Tokens are public CSS custom properties used by every EasyEdu component. They
are the primary contract for Moodle theme overrides.

## Categories

- Brand: `--easyedu-primary`, `--easyedu-accent`.
- Semantic state: success, danger, warning, info.
- Object identity: participant, group, grouping.
- Surface: page, card, panel, subtle backgrounds.
- Border and focus: card borders, control borders, focus rings.
- Radius and shadow.
- Spacing and control sizing.
- Motion: duration and easing.

## Motion tokens

- `--easyedu-motion-fast`: `100ms`, exits and compact feedback.
- `--easyedu-motion-normal`: `160ms`, ordinary entries and state changes.
- `--easyedu-motion-slow`: `220ms`, disclosures and modal entrances.
- `--easyedu-motion-ease`: shared spatial easing.
- `--easyedu-motion-disclosure-ease`: balanced easing for measured height
  changes and pagination swaps.

Themes may tune these variables on a plugin root. They must not override the
server `data-easyedu-motion-policy="disabled"` state or the visitor's
`prefers-reduced-motion` preference.

## Theme override example

```scss
.local-coursebannerbuilder {
  --easyedu-primary: #174f78;
  --easyedu-accent: #2f7a56;
  --easyedu-card-radius: 1rem;
  --easyedu-focus-ring: rgba(23, 79, 120, 0.22);
}
```

## Extraction rule

Use a token when a value expresses design language. Keep a local value when it is
purely layout-specific to a component implementation.

The kit should not emit a global `.easyedu-theme` class by default. Production
plugins include `token-defaults` under their own root selector so tokens remain
scoped to the plugin.
