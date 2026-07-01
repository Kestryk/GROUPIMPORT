# Tokens

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
