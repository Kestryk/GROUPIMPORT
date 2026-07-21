# EasyStud motion audit

## Accessibility smoke

The accessibility smoke uses `@axe-core/playwright` and targets only regions
owned by the plugin. It is explicit and non-destructive:

```powershell
$env:EASYEDU_MOODLE_URL = 'http://localhost/local/groupimport/manage.php?id=5'
$env:EASYEDU_MASS_IMPORT_URL = 'http://localhost/local/groupimport/index.php?id=5'
$env:EASYEDU_MOODLE_USERNAME = 'Admin'
$env:EASYEDU_MOODLE_PASSWORD = '<local test password>'
npx --yes node@20 .\node_modules\@playwright\test\cli.js test `
    .\accessibility-smoke.spec.js --reporter=line
```

It fails on critical or serious axe violations within
`#local-groupimport-easystud` or `#local-groupimport-import`. It is not a
required CI gate until the platform provides a deterministic authenticated
course fixture. See `docs/testing/accessibility.md`.

This Playwright scenario validates the shared motion controller in normal and
reduced-motion modes. It does not change Moodle data or administration settings.

From the plugin root:

    .\tools\playwright\run-motion-audit.ps1

The launcher prompts for the local Moodle password when the
`EASYEDU_MOODLE_PASSWORD` environment variable is not set. It installs the
isolated Playwright test dependency under `tools/playwright/node_modules` on
first use; credentials and generated results are ignored by Git.
The audit intentionally uses one browser worker because the local Moodle
Windows stack becomes unreliable under several simultaneous login requests.

The card-title and selection audit verifies the shared EasyEdu compact,
regular and container title hierarchy, grouping disclosure accessibility,
semantic checkbox colour and desktop/mobile hit areas:

    npx playwright test .\card-title-selection-audit.spec.js `
        --reporter=line --workers=1 --timeout=90000

Override the course or account when needed:

    .\tools\playwright\run-motion-audit.ps1 `
        -MoodleUrl 'http://localhost/local/groupimport/manage.php?id=8' `
        -Username 'Admin'

Run the same scenario after disabling **Enable interface animations** in the
plugin administration page to validate the server policy. Browser execution is
deliberately manual because visual audits are comparatively expensive.

## Mass Import and administration audit

The Mass Import audit is read-only. It checks the shared EasyEdu navigation,
centred page containment, the left-anchored guide launcher, desktop and mobile
containment, the history modal, the Excel example download and the legacy-safe
feature setting:

    .\tools\playwright\run-mass-import-audit.ps1

Override the course URL with `-MoodleUrl` when the test course id is not `5`.

The restoration audit intentionally creates and removes one prefixed group,
grouping and history record. It verifies import, manual deletion, state restore
and annotated XLSX export, then cleans up its data:

    .\tools\playwright\run-mass-import-restore-audit.ps1

The read-only audit also replaces the file in an active preview and confirms
that mixed username and email identifiers are recognised before import.
