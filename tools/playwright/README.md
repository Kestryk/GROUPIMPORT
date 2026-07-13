# EasyStud motion audit

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
