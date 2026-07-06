# Changelog

All notable changes to `local_groupimport` are documented here.

Maintenance convention:

- Changes are grouped by work day to avoid one entry per micro-adjustment.
- The `Unreleased` entry contains changes currently present in the worktree but not yet shipped in a version/tag.
- Retrospective entries are reconstructed from the local Git history and the available development context.

## Unreleased

### 2026-07-06

- Synced the embedded EasyEdu UI kit `v0.4.26` SCSS, guide assets and documentation after the inverse EasyStud audit.
- Added the EasyStud / GroupImport kit mapping documentation to clarify which UI primitives are reusable and which behaviours remain plugin-owned.
- Reused the new kit primitives for EasyStud selection checkboxes, participant identity badges, inline reveal panels and group member preview fade lists.
- Regenerated the plugin stylesheet after the kit sync.

### 2026-07-05

- Synced EasyEdu UI kit AI contracts and manifest into `easyedu-kit-docs` so future kit integrations keep the same implementation, guide parity and Moodle plugin review rules.
- Marked `easyedu-kit-docs` as `export-ignore` so development-only kit documentation remains versioned but is excluded from production release archives.

### 2026-07-03

- Refined EasyStud responsive JavaScript orchestration for collapsible filters, pagination, density switches, nested card toggles and mobile action recalculation.
- Improved touch long-press handling so context menus stay touch-specific and no longer interfere with desktop mouse interactions.
- Added stronger accessibility/state synchronisation for long grouping-tag summaries and participant tag overflow toggles.
- Fixed mobile EasyStud overflow found during the Playwright visual audit by constraining the action tray, preserving readable pagination select buttons and fully hiding inactive panels on narrow screens.
- Synced EasyEdu UI kit `v0.4.23` with safer wrapped mobile action tray primitives.
- Synced EasyEdu UI kit `v0.4.24` with a stronger drag preview count badge for readable multi-item drag stacks.
- Restyled the plugin administration settings page with an EasyEdu overview card, field chips and a clearer native Moodle multiselect for automatic user identification fields.
- Added admin-configurable participant card custom profile fields, including a compact coloured badge and two optional full-detail metadata tags.
- Synced EasyEdu UI kit `v0.4.25` with reusable native colour picker primitives for Moodle admin/settings forms.
- Fixed lingering EasyStud UI regressions around the native message modal sizing/loading state, complete-view grouping open rails and paginated list transitions.

### 2026-07-02

- Added participant messaging from EasyStud by reusing Moodle's native messaging flow from the `Enrolled users` page.
- Added a messaging action button for selected participants, gated by Moodle's `moodle/site:sendmessage` and `moodle/course:bulkmessaging` capabilities.
- Added the messaging action to the context menu for participants and members displayed inside groups.
- Restyled Moodle's native send-message modal to match the EasyStud/EasyEdu visual language.
- Added a shared entrance animation for Moodle native modals decorated by EasyStud.
- Restored and strengthened the EasyStud guide checklist success message when all guided path steps are complete.
- Synced the embedded EasyEdu guide copy with UI kit `v0.4.4`.
- Synced EasyEdu UI kit `v0.4.5` with reusable motion primitives, destructive/move modal primitives and drag preview helpers.
- Synced EasyEdu UI kit `v0.4.6` with reusable settings/detail modal filepicker, help icon and image placeholder primitives.
- Synced EasyEdu UI kit `v0.4.7` with reusable metadata list section primitives for settings/detail modals.
- Synced EasyEdu UI kit `v0.4.8` with a reusable Moodle native modal loading state.
- Harmonised the native Moodle send-message loading state so the EasyStud modal animation and loader styling are applied earlier.
- Synced EasyEdu UI kit `v0.4.9` with standardised guide modal size tokens aligned with the EasyStud tutorial modal.
- Synced EasyEdu UI kit `v0.4.10` with replayable native Moodle modal entrance animations.
- Restored the send-message modal entrance animation after Moodle's loading phase and enlarged the message textarea.
- Synced EasyEdu UI kit `v0.4.11` with reusable report/preview table primitives, history-list modal primitives and guided-step documentation hooks.
- Synced EasyEdu UI kit `v0.4.12` with sticky selection panel primitives and responsive long-press/action-tray guidance.
- Reused EasyEdu context-menu primitives for the EasyStud contextual menu to reduce local styling duplication.
- Synced EasyEdu UI kit `v0.4.13` with reusable modal file-drop overlay primitives for advanced settings dialogs.
- Synced EasyEdu UI kit `v0.4.14` with richer pagination primitives for select-all/results, counters, sort controls and placeholder alignment.
- Synced EasyEdu UI kit `v0.4.15` with a reusable card reveal toggle for expanding hidden card content.
- Synced EasyEdu UI kit `v0.4.16` with reusable open identity rail primitives for expanded grouping/container cards.
- Synced EasyEdu UI kit `v0.4.17` with reusable insert drop-target and configurable drag-disabled primitives.
- Synced EasyEdu UI kit `v0.4.18` with a public guided highlight refresh event for UI transitions, pagination and Ajax updates.
- Connected EasyStud layout switches, filters, pagination, collapsible cards and Ajax list updates to the reusable guided highlight refresh event.
- Synced EasyEdu UI kit `v0.4.19` with orchestration documentation for dynamic views, filters, pagination, Ajax mutations and guided-path highlight refresh timing.
- Synced EasyEdu UI kit `v0.4.20` with reusable card related-tag summaries and compact/detail density transition primitives.
- Reused the new EasyEdu card primitives for EasyStud group grouping-tag summaries and participant compact/full-detail transitions.
- Synced EasyEdu UI kit `v0.4.21` with reusable custom drag preview, stacked drag and source-placeholder primitives.
- Reused the new drag/drop primitives for EasyStud drag previews and dragged card placeholders.
- Synced EasyEdu UI kit `v0.4.22` with reusable mobile action tray primitives for responsive selection actions.
- Reused the new responsive action tray primitives in EasyStud tablet/mobile layouts.

## 0.3.0-beta - 2026-07-02

- Synced EasyEdu UI kit `v0.4.3` to refine the compact action menu trigger.
- Adjusted compact action menu styling so it reads closer to EasyEdu labels/buttons.
- Reduced and softened hover/focus treatment for compact action buttons in dense action rows.

### 2026-07-01

- Synced EasyEdu UI kit `v0.4.2` into the plugin.
- Added the reusable `easyedu-guide-kit` foundation: AMD module, Mustache template, language files, documentation and Moodle integration example.
- Extracted and documented many EasyEdu primitives: animations, buttons, cards, badges, menus, modals, forms, overlays, pagination, tables, tooltips, responsive helpers and guide patterns.
- Enriched the EasyStud guide with rich navigation, guided paths, floating checklist, interface highlights and keyboard behaviour.
- Improved hover help bubbles and compact action menus.
- Documented the EasyEdu kit and integration notes for Course Banner Builder.

### 2026-06-30

- Major redesign of the EasyStud simplified management view for participants, groups and groupings.
- Added three layout modes: participants and groups, complete view, groups and groupings.
- Added and refined multi-selection for participants, group members, groups and groupings.
- Added move, delete, remove members, remove groups from groupings, duplicate and advanced edit actions.
- Added desktop and mobile context menus that adapt to the current selection.
- Added a more complete responsive interface: adaptive columns, mobile actions, card density and touch-oriented behaviours.
- Added detailed participant, group and grouping cards with icons, identity rails, selection states, filters and animations.
- Added detail/settings modals for participants, groups and groupings.
- Added a rich EasyStud guide with slides, visual examples, guided paths, floating checklist and interface highlighting.
- Redesigned the mass group import view with harmonised styles, drag-and-drop area, file detection, preview and clearer import reports.
- Added more flexible CSV/Excel interpretation and automatic user identifier detection.
- Added an embedded EasyEdu kit foundation: tokens, SCSS mixins, documentation, sync script and reusable structure.
- Reorganised SCSS into dedicated components to improve maintenance, Moodle theme overrides and reuse in other plugins.

### 2026-06-15

- Migrated EasyStud refinements to Moodle 5.1.
- Improved multi-selection and contextual action handling.
- Added and refined move/delete actions for participants, groups and groupings.
- Added dynamic Ajax behaviour for several actions to reduce full page reloads.
- Improved toast notifications and user feedback messages.
- Adjusted cards, action buttons, filters and empty states visually.

### 2026-06-14

- Created the EasyEdu/EasyStud refactor branch and prepared the dedicated Git workflow, separate from the historical plugin version.
- Added the initial EasyStud simplified management view on Moodle 4.5.
- Added the first interactive interface for participants, groups and groupings.
- Added initial drag-and-drop, group/grouping creation, CSV import and Moodle native view navigation actions.
- Started the Moodle 5.1 migration and prepared the development branch.
- Improved the visual clarity of the EasyStud interface.

## Historical Versions

### 2026-02-13

- Updated README content and release information.
- Changed the declared maturity from beta to stable for the historical plugin version.

### 2026-02-12

- Fixed empty `{}` placeholders in import messages.

### 2026-02-10

- Minor code cleanup.

### 2026-01-07

- Fixed CodeChecker issues.
- Initial commit of the historical Group Import CSV plugin.
