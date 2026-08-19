# EED-UI-2026-0027 — Nested Group card action/count containment

## Scope

At responsive widths of 320, 390 and 768 px, an action trigger injected into
the header of a Group nested inside a Grouping has a dedicated touch-target
lane. The member-count badge remains visible before that lane.

The correction is consumer-local to the responsive nested Group header. Its
action lane is reserved only by the affected header, never by a Grouping card
that contains child Groups. This keeps the full nested-card width available
without changing the card box, member-count content, actions menu, Grouping
rail or disclosure Motion.

At 320 and 390 px, the nested card can be narrower than the count badge and the
compact action touch target combined. The action therefore joins the header's
existing wrapping flow at those widths. Grouping and member-count badges are
also hidden there so names and essential actions remain usable; 768 px retains
the established horizontal badge-before-action layout.
At those compact widths, Grouping search, add-group and rename shortcuts also
move behind the existing compact card menu so the Grouping name is not reduced
to an unusable fragment.

The visible checkbox squares are centred on their corresponding Grouping and
Group title lines. The nested Group action trigger uses that same centre line.
At 320 and 390 px, where the nested action participates in the header flow,
the nested Group selector receives its compact-line alignment separately from
wider responsive cards. Its internal right gutter and title typography are
reduced only enough to preserve the full Group name; card dimensions and the
identity rail are not changed.

## Validation

`tools/playwright/nested-group-card-action-count.spec.js` records the Group
card, visible checkbox square, title, member-count badge and action-trigger
rectangles at 320, 390, 768 and 1280 px.
It requires both compact count badges to be hidden at 320 and 390 px, keeps the
trigger inside the Group card and rejects horizontal document overflow. At 768
px it requires the badge to remain visible and at least 4 px before the action
trigger. It also requires the compact Grouping secondary shortcuts to be hidden,
the checkbox/action centres to match their title line within 2 px, and the
nested Group name to fit without truncation at 320 and 390 px.
The responsive menu assertion targets Moodle's visible shared context menu:
the nested Group sub-menu is deliberately desktop-only, while the compact
trigger opens the existing card context menu. The scenario closes that modal
surface through Escape before continuing to the next viewport, which works for
both responsive and desktop menu presentations.
It also opens the existing menu to preserve its route and capture evidence.

Runtime and visual validation are intentionally not executed until this
candidate is committed and pushed.

## Planned follow-up

After this production fix, redesign the compact Group card inside a Grouping
and the distinct compact Group card in the Groups view. The member list needs a
separate small-viewport presentation focused on readable participant rows,
rather than adding more controls to the current card header.
