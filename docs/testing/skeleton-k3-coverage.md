# EasyStud Skeleton B K3.1 coverage

## Immutable input

This consumer batch adopts EasyEdu UI Kit K3.1 commit
`7043fe5c2fc9440201cbb5b7d25e41a8a9bf54b4`. K3.1 requires static logical
inline-start accents on internal cards, a distinct block-start accent on large
structural left/right containers and, for every real Navigation view, a compact
one-line decorative frame with a Guide-start circle and one internal cue.

## Exhaustive EasyStud route inventory

| Entry surface | Real product navigation | K3 delivery | Evidence |
| --- | --- | --- | --- |
| Student Management (`manage.php`, `templates/manage.mustache`) | Yes: shared `easyedu_navigation` | One-line compact frame, Guide circle, one cue; structural panels top-accented and internal cards inline-start-accented | `templates/manage.mustache`, `scss/components/_layout.scss` |
| Mass Import (`index.php`) | Yes: shared `easyedu_navigation` | One-line compact frame, Guide circle, one cue; two structural import regions top-accented | `index.php`, `scss/views/_mass-import.scss` |
| Administration/settings (`settings.php`) | No | Generic loading remains unchanged | `scss/views/_admin-settings.scss` has no Navigation Skeleton selector |
| Guide tutorial/dialog navigation | No: internal dialog progression | Excluded; it is not product page navigation | `templates/manage.mustache`, `templates/easyedu_guide.mustache` |
| AJAX, export and template endpoints | No rendered view | Excluded | `ajax.php`, `export.php`, `template.php` |

The shared `easyedu_navigation` templates are a component used by the two
views above, not a third page. No other rendered EasyStud route contains real
product navigation and a loading Skeleton. A newly added route with real
navigation must update this matrix, the local agent rules and the static
contract in the same batch.

## Non-regression boundary

All K3.1 additions are `aria-hidden`, non-focusable and action-free. The
Student Management view selector receives no Skeleton frame or border. They do not
change `aria-busy`, lifecycle timing, no-script behavior, fail-open behavior,
Moodle navigation destinations or native-zoom containment protections.
