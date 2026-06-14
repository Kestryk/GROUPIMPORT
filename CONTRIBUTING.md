# Git workflow for `local_groupimport`

This repository currently supports two parallel tracks:

- `main`: stable production line for the existing `Group import CSV` plugin.
- `develop/easyedu-refactor`: long-running refactor line for the future `EasyEdu` experience.

## Branch roles

- `main`
  - Keep this branch releasable at all times.
  - Do not merge in-progress refactor work here.
  - Only merge fully validated release branches here.

- `develop/easyedu-refactor`
  - Main integration branch for the ongoing refactor.
  - All EasyEdu / EasyStud feature branches should branch from this line.
  - This branch can evolve freely until the new version is ready for stabilization.

- `feature/*`
  - Short-lived branches for focused work.
  - Examples:
    - `feature/easyedu-ui`
    - `feature/easyedu-bulk-actions`
    - `fix/easyedu-styles`
  - Branch from `develop/easyedu-refactor`.
  - Merge back into `develop/easyedu-refactor`.

- `release/*`
  - Created only when the refactor is ready for hardening.
  - Example: `release/easyedu-1.0`
  - Use for testing, cleanup, versioning, and final Moodle compliance checks.
  - Merge to `main` only when validated.

## Current repository baseline

- Stable baseline tag for the existing production plugin:
  - `v1.0-groupimport-csv`

- Active refactor integration branch:
  - `develop/easyedu-refactor`

## Important Moodle note

During the refactor, keep the technical plugin identity unchanged:

- Folder: `local/groupimport`
- Component: `local_groupimport`

This avoids unnecessary migration complexity while the new version is still under development.
The functional / product naming can evolve later without immediately changing the technical plugin identity.

## Recommended daily workflow

1. Update local refactor branch:
   - `git checkout develop/easyedu-refactor`
   - `git pull`

2. Create a focused branch:
   - `git checkout -b feature/my-change`

3. Commit small coherent changes.

4. Merge back into `develop/easyedu-refactor` after validation.

5. Create `release/*` only when the refactor is functionally complete.

6. Merge `release/*` into `main` only for the final public version.
