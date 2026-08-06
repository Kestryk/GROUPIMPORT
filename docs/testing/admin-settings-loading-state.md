# Administration settings loading-state contract

The EasyStud administration page keeps Moodle's native `admin_setting_*`
controls and settings APIs. `settings.php` adds one server-rendered structural
skeleton heading before the real settings so the page does not expose controls
while Moodle dependency/show-hide logic and fonts settle.

The classic `js/admin_settings_loading.js` bootstrap marks the page root as
loading, keeps the native form hidden, observes settings-form mutations and
reveals it after a 240 ms quiet period, but never before a 1200 ms minimum
visible interval. This minimum keeps the structural skeleton perceptible on a
page whose native controls are already settled at first paint. A 1.5-second
deadline fails open to a degraded state. No loading text or second modal is
introduced. The loading selector deliberately outranks Moodle's broad
`.settingsform > *` reset and its ID-qualified `display: none` rule, and reveals
its first `fieldset` parent so the server-rendered skeleton is not hidden by
the native settings layout. The skeleton includes three overview cards and
three lower settings sections with ten form-row placeholders, including a tall
multiselect-shaped control, so the complete admin page height remains simulated
instead of only the first viewport being represented. Because Moodle's
dependency controller can rewrite inline display values during bootstrap, the
loader preserves those values, temporarily forces every non-skeleton fieldset
child hidden, and restores the latest Moodle state before revealing the form.

With motion enabled, the skeleton fades out over 180 ms and the restored native
form fades in over 180 ms. Native controls remain masked until the skeleton has
left; reduced-motion users receive the same ordered reveal without a delay.

The page uses the shared EasyEdu bottom-end action indicator. It stays fixed at
the lower-right corner, uses the localized `Loading in progress` label and
keeps the historical rotating circle. Reduced-motion and forced-colors users
receive a static skeleton surface.

The focused contract is the exact test named
`keeps the EasyStud administration skeleton and shared bottom-end indicator
contract` in `tools/playwright/mass-import-audit.spec.js`. The validated Moodle
5.1 run is recorded in the external artifact manifest
`easystud-authenticated-20260730T130714944Z-11468`.

The plugin declares Moodle 5.1 as its compatibility floor. Moodle 4.5, 5.2
and 5.3 remain deferred to the final compatibility matrix.

### Markup correction - 2026-07-30

The skeleton builder now concatenates its cards and sections before passing the
CSS class and attribute array to the outer `html_writer::div()` call. This is
required by the Moodle 5.1 renderer signature and prevents a fatal
`TypeError`; the `moodle_page::add_body_class()` message was a cascading
output-order error from the same malformed call. Static PHP validation passed
after the correction. An authenticated browser rerun remains a separate
runtime validation step.
