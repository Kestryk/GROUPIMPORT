# EasyStud continuity handoff — 2026-07-22

## Checkpoint scope

This handoff preserves the accepted loading-state work on branch
`handoff/easystud-skeleton-v2-2026-07`. It is a recovery checkpoint, not a
release or a professional-machine bootstrap.

The Moodle component remains `local_groupimport`. The active local runtime is
Moodle 5.1.3. Its resolved plugin root is
`C:\MoodleRuntime\Moodle51\moodle\local\groupimport`; the Windows server
package and configuration dependencies remain under the corresponding
`D:\dev\Moodle 51\MoodleWindowsInstaller-latest-501\server` tree.

## Product state

- Lot V1 server-rendered loading skeleton is implemented.
- Lot V2 geometry is accepted for product review at 390, 520, 768, 1024 and
  1440 px. The largest measured root reveal displacement is 8.4 px.
- The terminal lifecycle remains `loading -> ready | degraded`.
- Batch 2 lifecycle regression passed 18/18 with a one-worker authenticated
  local fixture.
- Lot V3 shimmer/motion has not started.
- Batch 3 performed a restored, independently verified mutation but remains
  not accepted because the former network observer could not attribute two
  failed XHR events. Do not rerun it without fresh explicit mutation approval.

## Build and validation

Compile SCSS to an external candidate with the pinned toolchain, review the
candidate, then compare it with `styles.css` before replacing generated output:

```powershell
npx --yes --package=node@20.19.4 --package=sass@1.77.8 `
  sass scss/easystud.scss D:\EasyEduQAArtifacts\easystud\build\<run>\styles.css `
  --no-source-map
```

Use the PHP executable shipped by the Moodle Windows runtime for Moodle CLI
work; do not use the global PHP 8.1 executable. After an authorised asset
change, purge caches through the absolute runtime `config.php` and
`purge_all_caches()`.

The AMD source and built module are checkpointed together. The generated module
retains its Moodle `define(...)` wrapper. The exact Rollup/Terser fallback
command has not yet been made durable, so it must not be guessed during a new
machine reconstruction.

From `tools/playwright`, use Node 20 and an explicit one worker. Authenticated
variables must be injected only into the test process. Batch 2 and V2 geometry
are non-mutating. Write new privacy-safe evidence outside the repository and
never overwrite a prior evidence root.

## Fixture and evidence policy

The public fixture alias is `local-disposable-fixture`; no participant,
course, account, URL, cookie, sesskey or credential belongs in evidence. The
current wide Structure fixture is empty, so V2 records
`missing-structure-card-fixture` rather than inventing Moodle groups.

Keep private Batch 3 checkpoints, browser profiles, storage state, Moodle
configuration, databases and `moodledata` outside Git and outside Syncthing.
Recovery manifests and redacted V2/Batch 2 evidence are retained externally.

## Ownership and next task

Five `ccb-*.spec.js` files currently present under this plugin's Playwright
directory are Course Banner Builder source, not EasyStud source. They are
excluded from this branch and must be secured on a separate CCB branch before
any later cleanup removes their originals.

The next product task, only after a clean-clone recovery and professional
bootstrap decision, is Lot V3: coordinated loading shimmer/highlight motion
with reduced-motion, geometry and lifecycle non-regression. Do not start V3
as part of this checkpoint.
