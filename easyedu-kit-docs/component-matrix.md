# EasyEdu Component Extraction Matrix

This matrix tracks the full EasyStud visual language and its migration into the
portable EasyEdu kit.

Status values:

- `done`: reusable kit API exists and is documented.
- `partial`: foundation exists, but EasyStud refinements still need extraction.
- `todo`: not yet extracted from EasyStud.

| Family | EasyStud sources | Kit target | Status | Notes |
| --- | --- | --- | --- | --- |
| Tokens | `scss/abstracts/_tokens.scss`, `scss/easyedu/_tokens.scss` | `scss/easyedu/_tokens.scss`, `docs/tokens.md` | partial | Need more semantic tokens for guide, tables, drag/drop and responsive. |
| Animations | `scss/utilities/_animations.scss` | `scss/easyedu/components/_animations.scss` | todo | Must include modal, slide, expand, drag/drop, tutorial and success animations. |
| Panels/layout | `scss/components/_layout.scss` | `components/_panels.scss`, `docs/components/panels.md` | partial | Panel/header/actions/split exist; sticky selection panels remain. |
| Cards | `scss/components/_participants.scss`, `_structure.scss` | `components/_cards.scss`, `docs/components/cards.md` | partial | Base, rail, selected, expanded and drag-handle exist; grouping open rail remains. |
| Buttons/actions | `_layout.scss`, `_structure.scss`, `_forms.scss` | `components/_buttons.scss`, `docs/components/buttons.md` | partial | Icon/action/close/overflow exist; plugin-specific toolbar overflow remains. |
| Forms/filters | `_forms.scss`, `_structure.scss` | `components/_forms.scss`, `docs/components/forms.md` | partial | Search, segmented toggle, toggle check, more filters and filepicker exist; token detection inputs remain. |
| Dropdowns/menus | `_forms.scss`, `_interaction.scss`, `_structure.scss` | `components/_menus.scss`, `docs/components/dropdowns.md` | partial | Menu/context/overflow surfaces exist; responsive long-press patterns remain. |
| Tooltips | `scss/components/_tooltips.scss` | `components/_tooltips.scss`, `docs/components/tooltips.md` | partial | Hover bubble and help icon exist; placement variants remain. |
| Modals | `_modals.scss`, `_settings-modal.scss`, `_tutorial.scss` | `components/_modals.scss`, `docs/components/modals.md` | partial | Surface/header/icon/section/confirm/settings/detail patterns exist; move-specific destination UI remains. |
| Tables/import | `scss/views/_mass-import.scss` | `components/_tables.scss`, `docs/components/tables.md` | partial | Data/preview/status rows exist; selectable preview controls remain. |
| Badges/tokens | `_structure.scss`, `_participants.scss`, `_settings-modal.scss` | `components/_feedback.scss`, `docs/components/badges.md` | partial | Token, count, filled count and overflow toggles exist; plugin-specific colours remain. |
| Empty states | `_structure.scss`, `_participants.scss`, `_mass-import.scss` | `components/_feedback.scss`, `docs/components/empty-states.md` | partial | Base, inline and search variants exist; table-specific copy remains. |
| Drag/drop | `_interaction.scss`, `_structure.scss`, `_tutorial.scss` | `components/_overlays.scss`, `docs/components/drag-drop.md` | partial | Drop overlay, file overlay, stack preview and disabled zones exist; JS drag ghost behaviour remains plugin-owned. |
| Guide | `_tutorial.scss`, `amd/src/course_manager.js` | `components/_guide.scss`, `guide/`, `docs/components/guide.md` | partial | Base, rich nav, visual demos, guided panel, docking and highlight refresh exist; plugin-specific demo content remains. |
| Responsive | `scss/responsive/_mobile.scss`, `_desktop.scss` | `components/_responsive.scss`, `docs/components/responsive.md` | partial | Stack/action tray/cards/guide hooks exist; pagination and filter orchestration remain plugin-owned. |

## Next extraction lots

1. Documentation skeleton and manifest.
2. Core component API: buttons, tooltips, dropdowns, empty states, badges.
3. Cards and panels: identity rails, expanded states, action bars.
4. Modals and tables/import.
5. Drag/drop and animations.
6. Complete guide visual system.
7. Responsive behaviour.
