# EasyStud batch register

## Waves 1-3 corrective RF2

- Date: 2026-08-30
- Lots: `EED-UI-2026-0038-RF2`, `0039-RF2`, `0041-RF2`, `0049-RF3` and
  shared-title `0048-RF2`.
- Scope: repair only the human-rejected modal, Administration, Import history,
  Mass Import body/result and ungrouped-title surfaces from preview `f0bc74f`.
- Preservation: native multiselect and settings storage, import Restore/Export,
  modal scrolling/profile action, entity persistence and accepted page title
  and introduction remain unchanged.
- Exclusions: stale-data rehydration, page intro/navigation order, Filepicker,
  global Kit modal migration, preview/cache/fixtures and browser validation.
- Validation: official Sass/AMD builds, focused RF2 and existing regression
  contracts, PHP syntax and `git diff --check`.

## EED-UI-2026-0041 - Import history actions

- Date: 2026-08-30
- Scope: consumer-only static alignment for Restore this import and Export
  annotated Excel in the Import history list.
- Correction: both controls share the Kit compact action geometry, baseline and
  minimum height; their row wraps cleanly to full-width controls below 30rem.
  Existing Bootstrap semantic variants, labels and import/export behavior are
  preserved.
- Validation: Sass build, focused Import history action contract and
  `git diff --check`; no browser or preview run was performed.

## EED-UI-2026-0039-RF1 - Administration hierarchy

- Date: 2026-08-30
- Repository: `local_groupimport`
- Scope: static Administration typography and icon harmonisation, plus a
  naming alias for the existing More filters compact label treatment.
- Preservation: the identifier explanation text, native multiselect markup,
  options, settings storage and all disclosure behaviour remain unchanged.
- Validation: Sass build, focused typography contract, plugin release checks
  and `git diff --check`; no browser or preview.

## EED-UI-2026-0049 RF2 — visible Mass Import hierarchy

- Date: 2026-08-30
- Cause: RF1 reused the same card/section roles already present in the accepted
  stylesheet, so its principal Mass Import headings could not visibly soften.
- Correction: map panel-card titles to the shared compact control-label tier
  and upload form labels to the eyebrow/caption tiers used by Student
  Management. Page identity and the larger introductory description remain.
- Validation: Sass build, focused typography contract and `git diff --check`;
  browser acceptance remains human and separate.

## EED-UI-2026-0049 — typography convergence

- Date: 2026-08-30
- Repository: `local_groupimport`
- Scope: static SCSS/CSS convergence for Simplified student management and Mass
  Import chrome, including the `Import file (CSV or Excel)` card and Groups
  inside Groups without grouping.
- Base: accepted preview `EED-UI-2026-0048`.
- Result: a late consumer typography partial uses the embedded EasyEdu roles;
  `styles.css` is rebuilt and covered by a source/generated CSS contract.
- Validation: Sass build, `tools/release/test-typography-contract.ps1` and
  `git diff --check`. Browser review remains human and separate.
