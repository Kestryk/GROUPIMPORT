# EED-UI-2026-0029 - Desktop Grouping label containment

## Scope

The desktop header of a Group card measures the space needed by the complete
Grouping pill before showing it. If the complete pill fits beside the Group
title, member count and existing actions, it remains visible without clipping
or ellipsis. Otherwise the visual pill is entirely hidden; the Group card box,
actions, desktop layout and disclosure motion remain unchanged.

At the existing responsive boundary of 1024 px and below, the pre-existing
responsive rule continues to suppress inline Grouping labels. This lot adds no
responsive fallback or new compact control.

## Accessible fallback

When desktop capacity hides a visual pill, a non-focusable, visually hidden
description lists the Grouping count and names. The existing Group `More
actions` menu then exposes a local Grouping-details action. Its accessible name
contains the same complete information; selecting it opens the existing
Grouping-details disclosure. The hidden inline pill cannot receive focus.

## Validation protocol

`tools/playwright/grouping-label-desktop-containment.spec.js` requires a
managed course with one Group that belongs to one Grouping and one Group that
belongs to several Groupings. It covers 1024, 1025, 1200, 1201, 1280 and 1440
px, with a short and a constrained long Group title. The scenario verifies:

- the 1024 px responsive boundary has no desktop fallback action;
- a visible desktop pill has no ellipsis and no horizontal truncation;
- a capacity-hidden pill has no focusable visual control and retains its
  non-focusable accessible description;
- the existing Group context menu exposes details only for a hidden desktop
  pill, and that action opens the existing details disclosure.

The scenario writes its screenshots only to the external runner artifact
directory. Source/static validation does not constitute a preview or visual
acceptance. A lease, compatible preview and explicit runtime authorisation are
required before execution.

## Ownership and handoff

The source allowlist is local to `local_groupimport`: `course_manager` AMD and
its generated artifacts, the local structure SCSS/CSS, this scenario and these
local records. It excludes EED-UI-2026-0019, EED-UI-2026-0021,
EED-UI-2026-0028, Navigation, Guide, Skeleton, Moodle permissions and the UI
Kit. Platform owns the canonical batch/roadmap reconciliation after factual
completion.
