# EED-UI-2026-0027 — Nested Group card action/count containment

## Scope

At responsive widths of 320, 390 and 768 px, an action trigger injected into
the header of a Group nested inside a Grouping has a dedicated touch-target
lane. The member-count badge remains visible before that lane.

The correction is consumer-local to the responsive nested Group header. It
does not change the card box, member-count content, actions menu, Grouping
rail, desktop presentation or disclosure Motion.

At exactly 320 px, the nested card can be narrower than the count badge and the
compact action touch target combined. The action therefore joins the header's
existing wrapping flow only at that width; 390 and 768 px retain the established
horizontal badge-before-action layout.

## Validation

`tools/playwright/nested-group-card-action-count.spec.js` records the Group
card, member-count badge and action-trigger rectangles at each target width.
It rejects overlap in either axis, keeps the trigger inside the Group card and
rejects horizontal document overflow. At 390 and 768 px it also requires the
badge to remain at least 4 px before the action trigger.
It also opens the existing menu to preserve its route and capture evidence.

Runtime and visual validation are intentionally not executed until this
candidate is committed and pushed.
