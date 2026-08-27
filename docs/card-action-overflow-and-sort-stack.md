# Card action overflow and Sort stacking

Group and Grouping card headers use one local overflow trigger. At compact or
intermediate widths, the controller measures the rendered card and places only
actions which no longer fit in that local menu. The original controls remain
the action owners; menu items forward activation to them.

The trigger is also a responsive card-menu hook for compatibility, but its
click is exclusively owned by the local overflow controller. The global
context menu remains available through its context-menu interaction and must
not open from the same click.

Member-list Sort is independent of card actions. While its dropdown is open,
the owning card, pagination and paginated list receive `is-sort-menu-open`.
This keeps a global Groups Sort menu above its first card as well as keeping a
card-local Sort menu above neighbouring cards. The state is removed whenever
the dropdown closes.

Invariants:

- no duplicate action windows from one activation;
- only actions which do not fit appear in the local overflow menu;
- actions return to the header when space becomes available;
- Sort stays above expanded members and neighbouring cards;
- a Grouping label is shown whole or recovered through More actions; it is never
  visually truncated inside a Group card header;
- the recovered More trigger keeps the plain icon treatment of its sibling card
  actions rather than becoming a bordered pill;
- no permission, data, selection or action route changes.
