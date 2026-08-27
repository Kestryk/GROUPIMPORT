# EasyStud Skeleton B K3 coverage

## Immutable input

This consumer batch adopts EasyEdu UI Kit K3 commit
`e5fe986a4a21ce630d4b952af3dfccd82818232b`. K3 requires a static logical
inline-start section accent and, for every real Navigation view, a compact
decorative frame with a Guide-start circle and internal cues.

## Exhaustive EasyStud route inventory

| Entry surface | Real product navigation | K3 delivery | Evidence |
| --- | --- | --- | --- |
| Student Management (`manage.php`, `templates/manage.mustache`) | Yes: shared `easyedu_navigation` | Compact frame, Guide circle and two cues | `templates/manage.mustache`, `scss/components/_layout.scss` |
| Mass Import (`index.php`) | Yes: shared `easyedu_navigation` | Compact frame, Guide circle and two cues | `index.php`, `scss/views/_mass-import.scss` |
| Administration/settings (`settings.php`) | No | Generic loading remains unchanged | `scss/views/_admin-settings.scss` has no Navigation Skeleton selector |
| Guide tutorial/dialog navigation | No: internal dialog progression | Excluded; it is not product page navigation | `templates/manage.mustache`, `templates/easyedu_guide.mustache` |
| AJAX, export and template endpoints | No rendered view | Excluded | `ajax.php`, `export.php`, `template.php` |

The shared `easyedu_navigation` templates are a component used by the two
views above, not a third page. No other rendered EasyStud route contains real
product navigation and a loading Skeleton. A newly added route with real
navigation must update this matrix, the local agent rules and the static
contract in the same batch.

## Non-regression boundary

All K3 additions are `aria-hidden`, non-focusable and action-free. They do not
change `aria-busy`, lifecycle timing, no-script behavior, fail-open behavior,
Moodle navigation destinations or native-zoom containment protections.
