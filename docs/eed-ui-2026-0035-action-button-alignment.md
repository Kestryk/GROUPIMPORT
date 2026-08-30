# EED-UI-2026-0035 - EasyStud action-button alignment

## Scope

This consumer-only correction aligns EasyStud's existing action controls with
the embedded EasyEdu UI Kit. It does not change the Kit token, action meaning,
navigation, modal ownership, card geometry or responsive routing.

## Delivered behaviour

- The upper Participants action row uses the existing
  `easyedu.action-button(small)` primitive with one consumer value of
  `--easyedu-action-icon-gap`; obsolete Bootstrap icon utility margins no
  longer add a second visual gap.
- The same markup is cloned into the responsive More actions menu, so the
  clone keeps the corrected spacing.
- The responsive selected-action tray uses the same centred action-button
  alignment while retaining its established compact touch density.
- The native Moodle profile link, plus inline rename Save/Cancel controls,
  use the action-button alignment contract without changing their destinations,
  submission or cancellation handlers.
- The panel More actions trigger and every visible action-menu item explicitly
  remain undecorated for hover, active and keyboard-focus states. Focus still
  comes from the existing visible focus treatment.

## Preserved controls

More filters, Sort, A-Z and result counts keep the typography contract from
`scss/components/_control-typography.scss`: normal theme typography for the
first three, and the accepted semibold weight for result counts.

## Validation boundary

`tools/release/test-action-button-alignment-contract.ps1` checks the source
adoption, menu no-underline protection and generated stylesheet. Sass and the
standard plugin validation remain source checks only. A managed-preview
browser review is a separate gate and should inspect desktop and compact
Participants actions, the overflow menu, participant detail's native-profile
link, and an inline Group/Grouping rename row.
