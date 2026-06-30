<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Local Group Import plugin main page.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/group/lib.php'); // Fonctions groups_*.

use local_groupimport\form\import_form;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Clean an import cell value (handles BOM, NBSP, zero-width chars, trims).
 *
 * @param string $value Raw cell value.
 * @return string Cleaned cell value.
 */
function local_groupimport_clean_cell(string $value): string {
    // Remove BOM if it somehow appears at cell level.
    $value = preg_replace('/^\xEF\xBB\xBF/u', '', $value);

    // Convert non-breaking spaces to normal spaces.
    $value = str_replace("\xC2\xA0", ' ', $value);

    // Remove common zero-width characters.
    $value = preg_replace('/[\x{200B}\x{200C}\x{200D}\x{FEFF}]/u', '', $value);

    // Trim standard whitespace.
    return trim($value);
}

/**
 * Detect the CSV delimiter (';' or ',') from a line.
 *
 * @param string $line The CSV header line.
 * @return string The detected delimiter.
 */
function local_groupimport_detect_delimiter_line(string $line): string {
    $line = trim($line);
    if ($line === '') {
        return ';';
    }

    $semicolons = substr_count($line, ';');
    $commas = substr_count($line, ',');

    if ($commas > $semicolons) {
        return ',';
    }

    return ';';
}

/**
 * Parse CSV content into header + rows arrays.
 *
 * Supports both ';' and ',' delimiters (auto-detected).
 *
 * @param string $content CSV raw content.
 * @param array $errors Errors array (by reference).
 * @return array{header: array, rows: array} Parsed data.
 */
function local_groupimport_parse_csv_content(string $content, array &$errors): array {
    $lines = preg_split("/\r\n|\n|\r/", $content);

    // Find the first non-empty line to detect the delimiter.
    $headerline = null;
    foreach ($lines as $line) {
        if (trim($line) !== '') {
            $headerline = $line;
            break;
        }
    }

    if ($headerline === null) {
        $errors[] = get_string('csvempty', 'local_groupimport');
        return ['header' => [], 'rows' => []];
    }

    $delimiter = local_groupimport_detect_delimiter_line($headerline);

    // Parse header.
    $header = str_getcsv($headerline, $delimiter);
    $header = array_map('trim', $header);

    // Parse rows.
    $rows = [];
    $started = false;

    foreach ($lines as $line) {
        if (!$started) {
            // Skip the first occurrence of the header line.
            if (trim($line) === trim($headerline)) {
                $started = true;
            }
            continue;
        }

        if (trim($line) === '') {
            continue;
        }

        $data = str_getcsv($line, $delimiter);
        $data = array_map('trim', $data);
        $rows[] = $data;
    }

    return ['header' => $header, 'rows' => $rows];
}

/**
 * Parse an Excel workbook into header + rows arrays.
 *
 * @param string $content Uploaded file content.
 * @param string $filename Uploaded filename.
 * @param array $errors Errors array (by reference).
 * @return array{header: array, rows: array} Parsed data.
 */
function local_groupimport_parse_excel_content(string $content, string $filename, array &$errors): array {
    $tempdir = make_temp_directory('local_groupimport');
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $extension = in_array($extension, ['xls', 'xlsx'], true) ? $extension : 'xlsx';
    $tempfile = $tempdir . DIRECTORY_SEPARATOR . uniqid('import_', true) . '.' . $extension;

    if (file_put_contents($tempfile, $content) === false) {
        $errors[] = get_string('csvloaderror', 'local_groupimport', get_string('csvemptyfiledetail', 'local_groupimport'));
        return ['header' => [], 'rows' => []];
    }

    try {
        $reader = IOFactory::createReaderForFile($tempfile);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($tempfile);
        $worksheet = $spreadsheet->getActiveSheet();
        $rawrows = $worksheet->toArray('', false, false, false);
    } catch (Throwable $exception) {
        $errors[] = get_string('spreadsheetreaderror', 'local_groupimport');
        @unlink($tempfile);
        return ['header' => [], 'rows' => []];
    }

    @unlink($tempfile);

    $header = [];
    $rows = [];
    $headerfound = false;

    foreach ($rawrows as $rawrow) {
        $row = array_map(static function($value): string {
            return local_groupimport_clean_cell((string)$value);
        }, $rawrow);

        $hascontent = array_filter($row, static function(string $value): bool {
            return $value !== '';
        });

        if (empty($hascontent)) {
            continue;
        }

        if (!$headerfound) {
            $header = $row;
            $headerfound = true;
            continue;
        }

        $rows[] = $row;
    }

    if (!$headerfound) {
        $errors[] = get_string('csvempty', 'local_groupimport');
    }

    return ['header' => $header, 'rows' => $rows];
}

/**
 * Parse an uploaded import file according to its extension.
 *
 * @param string $content Uploaded file content.
 * @param string $filename Uploaded filename.
 * @param array $errors Errors array (by reference).
 * @return array{header: array, rows: array} Parsed data.
 */
function local_groupimport_parse_import_content(string $content, string $filename, array &$errors): array {
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    if (in_array($extension, ['xls', 'xlsx'], true)) {
        return local_groupimport_parse_excel_content($content, $filename, $errors);
    }

    return local_groupimport_parse_csv_content($content, $errors);
}

/**
 * Normalise a column header for tolerant matching.
 *
 * @param string $header Column header.
 * @return string Normalised header.
 */
function local_groupimport_normalise_import_header(string $header): string {
    $header = local_groupimport_clean_cell($header);
    $header = core_text::strtolower($header);
    $header = preg_replace('/[^a-z0-9]+/u', '', $header);

    return $header ?? '';
}

/**
 * Find the best matching import column.
 *
 * @param array $normalisedheaders Normalised headers.
 * @param array $aliases Accepted aliases.
 * @return int|false Matching index or false.
 */
function local_groupimport_find_import_column(array $normalisedheaders, array $aliases) {
    foreach ($aliases as $alias) {
        $index = array_search($alias, $normalisedheaders, true);
        if ($index !== false) {
            return $index;
        }
    }

    return false;
}

/**
 * Return user identification fields allowed for imports.
 *
 * @return array Allowed user fields.
 */
function local_groupimport_get_allowed_import_userfields(): array {
    global $DB;

    $alloptions = [
        'username' => get_string('username'),
        'email' => get_string('email'),
        'idnumber' => get_string('idnumber'),
    ];

    $customfields = $DB->get_records('user_info_field', null, 'name ASC');
    foreach ($customfields as $field) {
        $alloptions['profile_field_' . $field->shortname] = format_string($field->name);
    }

    $config = get_config('local_groupimport');
    $allowed = !empty($config->alloweduserfields)
        ? array_map('trim', explode(',', $config->alloweduserfields))
        : ['username'];

    $allowed = array_filter($allowed, static function(string $value): bool {
        return $value !== '';
    });

    $options = array_intersect_key($alloptions, array_flip($allowed));

    return empty($options) ? ['username' => get_string('username')] : $options;
}

/**
 * Convert parsed data into editable preview rows.
 *
 * @param array $parsed Parsed data.
 * @param array $errors Errors array (by reference).
 * @return array Preview rows.
 */
function local_groupimport_build_preview_rows(array $parsed, array &$errors): array {
    $columns = $parsed['header'];
    $rows = $parsed['rows'];

    if (empty($columns)) {
        if (empty($errors)) {
            $errors[] = get_string('csvmissingcolumns', 'local_groupimport');
        }
        return [];
    }

    $normalised = array_map('local_groupimport_normalise_import_header', $columns);

    $identifierindex = local_groupimport_find_import_column($normalised, [
        'useridentifier', 'userid', 'user', 'username', 'email', 'idnumber', 'identifier',
        'identifiant', 'identifiantutilisateur', 'utilisateur', 'mail', 'courriel',
        'studentidentifier', 'student', 'studentid', 'studentlogin', 'studentemail',
        'learneridentifier', 'learner', 'learnerid', 'apprenant', 'identifiantapprenant',
        'etudiant', 'identifiantetudiant', 'eleve', 'identifianteleve',
    ]);
    $groupnameindex = local_groupimport_find_import_column($normalised, [
        'groupname', 'group', 'groups', 'groupid', 'groupe', 'nomdegroupe', 'nomdugroupe',
    ]);
    $groupingindex = local_groupimport_find_import_column($normalised, [
        'groupingname', 'grouping', 'groupings', 'groupingid', 'groupement', 'nomdegroupement',
        'nomdugroupement',
    ]);

    if ($identifierindex === false || $groupnameindex === false) {
        $errors[] = get_string('csvmissingcolumns', 'local_groupimport');
        return [];
    }

    $previewrows = [];
    foreach ($rows as $lineindex => $line) {
        $identifier = isset($line[$identifierindex]) ? local_groupimport_clean_cell((string)$line[$identifierindex]) : '';
        $groupname = isset($line[$groupnameindex]) ? local_groupimport_clean_cell((string)$line[$groupnameindex]) : '';
        $groupingname = ($groupingindex !== false && isset($line[$groupingindex]))
            ? local_groupimport_clean_cell((string)$line[$groupingindex])
            : '';

        if ($identifier === '' && $groupname === '' && $groupingname === '') {
            continue;
        }

        $previewrows[] = [
            'line' => $lineindex + 2,
            'identifier' => $identifier,
            'groupname' => $groupname,
            'groupingname' => $groupingname,
        ];
    }

    return $previewrows;
}

/**
 * Find users matching an identifier for one import identification field.
 *
 * @param string $identifier User identifier.
 * @param string $userfield Identification field.
 * @return array User records.
 */
function local_groupimport_find_import_users_by_field(string $identifier, string $userfield): array {
    global $DB;

    if ($userfield === 'email') {
        $identifier = strtolower(preg_replace('/\s+/u', '', $identifier));
    }

    if ($userfield === 'username') {
        $user = $DB->get_record('user', ['username' => $identifier, 'deleted' => 0]);
        return $user ? [$user->id => $user] : [];
    }

    if ($userfield === 'email') {
        $user = $DB->get_record('user', ['email' => $identifier, 'deleted' => 0]);
        return $user ? [$user->id => $user] : [];
    }

    if ($userfield === 'idnumber') {
        $user = $DB->get_record('user', ['idnumber' => $identifier, 'deleted' => 0]);
        return $user ? [$user->id => $user] : [];
    }

    if (strpos($userfield, 'profile_field_') === 0) {
        $shortname = substr($userfield, strlen('profile_field_'));
        $sql = "SELECT u.*
                  FROM {user} u
                  JOIN {user_info_data} d ON d.userid = u.id
                  JOIN {user_info_field} f ON f.id = d.fieldid
                 WHERE f.shortname = :shortname
                   AND d.data = :data
                   AND u.deleted = 0";
        return $DB->get_records_sql($sql, [
            'shortname' => $shortname,
            'data' => $identifier,
        ]);
    }

    return [];
}

/**
 * Automatically find a user by testing every configured identification field.
 *
 * @param string $identifier User identifier.
 * @param array $errors Errors array (by reference).
 * @return stdClass|null User record, if exactly one user is matched.
 */
function local_groupimport_find_import_user(string $identifier, array &$errors): ?stdClass {
    $allowedfields = local_groupimport_get_allowed_import_userfields();
    $matches = [];
    $matchedlabels = [];

    foreach ($allowedfields as $fieldkey => $fieldlabel) {
        $fieldmatches = local_groupimport_find_import_users_by_field($identifier, $fieldkey);
        foreach ($fieldmatches as $userid => $user) {
            $matches[$userid] = $user;
            $matchedlabels[$userid][] = $fieldlabel;
        }
    }

    if (count($matches) === 1) {
        return reset($matches);
    }

    if (count($matches) > 1) {
        $errors[] = get_string('userautomaticmultiplematches', 'local_groupimport', $identifier);
        return null;
    }

    $errors[] = get_string('userautomaticnotfound', 'local_groupimport', $identifier);
    return null;
}

/**
 * Validate preview rows for user feedback before final confirmation.
 *
 * @param array $rows Preview rows.
 * @param context_course $context Course context.
 * @return array Validation messages keyed by row index.
 */
function local_groupimport_validate_preview_rows(array $rows, context_course $context): array {
    global $DB;

    $messages = [];

    foreach ($rows as $index => $row) {
        $rowmessages = [];
        $identifier = local_groupimport_clean_cell((string)($row['identifier'] ?? ''));
        $groupname = local_groupimport_clean_cell((string)($row['groupname'] ?? ''));
        $groupingname = local_groupimport_clean_cell((string)($row['groupingname'] ?? ''));

        if ($identifier === '' || $groupname === '') {
            $rowmessages[] = get_string('csvinvalidrowmissing', 'local_groupimport');
        } else {
            $lookupmessages = [];
            $user = local_groupimport_find_import_user($identifier, $lookupmessages);
            if (!$user) {
                $rowmessages = array_merge($rowmessages, $lookupmessages);
            } else if (!is_enrolled($context, $user->id)) {
                $rowmessages[] = get_string('usernotenrolled', 'local_groupimport', $identifier);
            } else {
                $groupid = groups_get_group_by_name($context->instanceid, $groupname);
                if ($groupid && groups_is_member($groupid, $user->id)) {
                    $rowmessages[] = get_string('previewuseralreadyingroup', 'local_groupimport');
                }

                if ($groupid && $groupingname !== '') {
                    $groupingid = $DB->get_field('groupings', 'id', [
                        'courseid' => $context->instanceid,
                        'name' => $groupingname,
                    ]);
                    if ($groupingid && $DB->record_exists('groupings_groups', [
                        'groupingid' => $groupingid,
                        'groupid' => $groupid,
                    ])) {
                        $rowmessages[] = get_string('previewgroupalreadyingrouping', 'local_groupimport');
                    }
                }
            }
        }

        $messages[$index] = $rowmessages;
    }

    return $messages;
}

/**
 * Whether the import history table is available in this plugin installation.
 *
 * @return bool
 */
function local_groupimport_history_table_exists(): bool {
    global $DB;

    static $exists = null;
    if ($exists !== null) {
        return $exists;
    }

    $exists = $DB->get_manager()->table_exists(new xmldb_table('local_groupimport_history'));
    return $exists;
}

/**
 * Record a confirmed course import in the course-level history.
 *
 * @param int $courseid Course id.
 * @param int $userid User id.
 * @param string $filename Uploaded filename.
 * @param string $filehash Uploaded content hash.
 * @param int $rowcount Number of confirmed rows.
 * @param int $successcount Number of success messages.
 * @param int $errorcount Number of error messages.
 * @param string $replacepolicy Selected replacement policy.
 * @return void
 */
function local_groupimport_record_import_history(
    int $courseid,
    int $userid,
    string $filename,
    string $filehash,
    int $rowcount,
    int $successcount,
    int $errorcount,
    string $replacepolicy
): void {
    global $DB;

    if (!local_groupimport_history_table_exists()) {
        return;
    }

    $record = (object)[
        'courseid' => $courseid,
        'userid' => $userid,
        'filename' => clean_param($filename, PARAM_TEXT),
        'filehash' => clean_param($filehash, PARAM_ALPHANUM),
        'rowcount' => $rowcount,
        'successcount' => $successcount,
        'errorcount' => $errorcount,
        'replacepolicy' => clean_param($replacepolicy, PARAM_ALPHA),
        'timecreated' => time(),
    ];
    $DB->insert_record('local_groupimport_history', $record);
}

/**
 * Get recent course import history records.
 *
 * @param int $courseid Course id.
 * @param int $limit Max records.
 * @return array
 */
function local_groupimport_get_import_history(int $courseid, int $limit = 20): array {
    global $DB;

    if (!local_groupimport_history_table_exists()) {
        return [];
    }

    return $DB->get_records('local_groupimport_history', ['courseid' => $courseid], 'timecreated DESC', '*', 0, $limit);
}

/**
 * Get the last import using the same file hash in the course.
 *
 * @param int $courseid Course id.
 * @param string $filehash File hash.
 * @return stdClass|null
 */
function local_groupimport_get_matching_import_history(int $courseid, string $filehash): ?stdClass {
    global $DB;

    if (!local_groupimport_history_table_exists() || $filehash === '') {
        return null;
    }

    $records = $DB->get_records('local_groupimport_history', [
        'courseid' => $courseid,
        'filehash' => $filehash,
    ], 'timecreated DESC', '*', 0, 1);

    return $records ? reset($records) : null;
}

/**
 * Process confirmed import rows.
 *
 * @param array $rows Confirmed rows.
 * @param stdClass $course Course record.
 * @param context_course $context Course context.
 * @param array $success Success messages.
 * @param array $errors Error messages.
 * @return void
 */
function local_groupimport_process_import_rows(
    array $rows,
    stdClass $course,
    context_course $context,
    array &$success,
    array &$errors
): void {
    global $DB;

    foreach ($rows as $row) {
        $identifier = local_groupimport_clean_cell((string)($row['identifier'] ?? ''));
        $groupname = local_groupimport_clean_cell((string)($row['groupname'] ?? ''));
        $groupingname = local_groupimport_clean_cell((string)($row['groupingname'] ?? ''));

        if ($identifier === '' && $groupname === '') {
            continue;
        }

        if ($identifier === '' || $groupname === '') {
            $errors[] = get_string('csvinvalidrowmissing', 'local_groupimport');
            continue;
        }

        $user = local_groupimport_find_import_user($identifier, $errors);
        if (!$user) {
            continue;
        }

        if (!is_enrolled($context, $user->id)) {
            $errors[] = get_string('usernotenrolled', 'local_groupimport', $identifier);
            continue;
        }

        $groupid = groups_get_group_by_name($course->id, $groupname);
        if (!$groupid) {
            $groupdata = new stdClass();
            $groupdata->courseid = $course->id;
            $groupdata->name = $groupname;

            $groupid = groups_create_group($groupdata);
            if (!$groupid) {
                $errors[] = get_string('groupcreatefailed', 'local_groupimport', (object)[
                    'groupname' => $groupname,
                    'identifier' => $identifier,
                ]);
                continue;
            }
        }

        if ($groupingname !== '') {
            $groupingid = $DB->get_field('groupings', 'id', [
                'courseid' => $course->id,
                'name' => $groupingname,
            ]);

            if (!$groupingid) {
                $groupingdata = new stdClass();
                $groupingdata->courseid = $course->id;
                $groupingdata->name = $groupingname;

                $groupingid = groups_create_grouping($groupingdata);
                if (!$groupingid) {
                    $errors[] = get_string('groupingcreatefailed', 'local_groupimport', (object)[
                        'groupingname' => $groupingname,
                        'groupname' => $groupname,
                    ]);
                }
            }

            if ($groupingid && !$DB->record_exists('groupings_groups', [
                'groupingid' => $groupingid,
                'groupid' => $groupid,
            ])) {
                groups_assign_grouping($groupingid, $groupid);
            }
        }

        if (!groups_is_member($groupid, $user->id)) {
            groups_add_member($groupid, $user->id);

            $a = (object)[
                'identifier' => $identifier,
                'groupname' => $groupname,
            ];

            if ($groupingname !== '') {
                $a->groupingname = $groupingname;
                $success[] = get_string('useraddedtogroupwithgrouping', 'local_groupimport', $a);
            } else {
                $success[] = get_string('useraddedtogroup', 'local_groupimport', $a);
            }
        } else {
            $errors[] = get_string('useralreadyingroup', 'local_groupimport', (object)[
                'identifier' => $identifier,
                'groupname' => $groupname,
            ]);
        }
    }
}

// Try to retrieve the course id via GET or POST.
$id = optional_param('id', 0, PARAM_INT);
if (!$id) {
    throw new moodle_exception('missingparam', 'error', '', 'id');
}

$course = get_course($id);
require_login($course);

$context = context_course::instance($course->id);

// Only users who can manage groups may use this tool.
require_capability('moodle/course:managegroups', $context);

$PAGE->set_url(new moodle_url('/local/groupimport/index.php', ['id' => $course->id]));
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title(get_string('groupimport', 'local_groupimport'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->requires->js_call_amd('local_groupimport/csv_import', 'init', [
    'local-groupimport-import',
    [
        'dropready' => get_string('csvdropready', 'local_groupimport'),
        'dropsubtitle' => get_string('csvdropsubtitle', 'local_groupimport'),
    ],
]);

$mform = new import_form(null, ['courseid' => $course->id]);
$allowedimportfields = local_groupimport_get_allowed_import_userfields();

$success = [];
$errors = [];
$preview = null;

// Template CSV download button URL.
$templateurl = new moodle_url('/local/groupimport/template.php', ['id' => $course->id]);

$confirmimport = optional_param('confirmimport', 0, PARAM_BOOL);

if ($confirmimport) {
    global $USER;

    require_sesskey();

    $enabledrows = optional_param_array('rowenabled', [], PARAM_INT);
    $identifiers = optional_param_array('identifier', [], PARAM_RAW_TRIMMED);
    $groupnames = optional_param_array('groupname', [], PARAM_RAW_TRIMMED);
    $groupingnames = optional_param_array('groupingname', [], PARAM_RAW_TRIMMED);
    $importfilename = optional_param('importfilename', '', PARAM_TEXT);
    $importhash = optional_param('importhash', '', PARAM_ALPHANUM);
    $replacepolicy = optional_param('replacepolicy', 'keep', PARAM_ALPHA);

    $confirmedrows = [];
    foreach ($enabledrows as $index => $enabled) {
        if (!$enabled) {
            continue;
        }

        $confirmedrows[] = [
            'identifier' => $identifiers[$index] ?? '',
            'groupname' => $groupnames[$index] ?? '',
            'groupingname' => $groupingnames[$index] ?? '',
        ];
    }

    if (empty($confirmedrows)) {
        $errors[] = get_string('importnorowsselected', 'local_groupimport');
    } else {
        local_groupimport_process_import_rows($confirmedrows, $course, $context, $success, $errors);
        local_groupimport_record_import_history(
            (int)$course->id,
            (int)$USER->id,
            $importfilename !== '' ? $importfilename : get_string('unknownfile', 'local_groupimport'),
            $importhash,
            count($confirmedrows),
            count($success),
            count($errors),
            $replacepolicy
        );
    }
} else if ($mform->is_cancelled()) {
    redirect(course_get_url($course));

} else if ($data = $mform->get_data()) {
    // Retrieve uploaded file content.
    $content = $mform->get_file_content('importfile');
    $filename = $mform->get_new_filename('importfile');
    if (empty($filename)) {
        $filename = 'import.csv';
    }

    // Global BOM cleanup at the beginning of the file (if present).
    if (is_string($content) && substr($content, 0, 3) === "\xEF\xBB\xBF") {
        $content = substr($content, 3);
    }

    if ($content === false || $content === null || $content === '') {
        $errors[] = get_string('csvloaderror', 'local_groupimport', get_string('csvemptyfiledetail', 'local_groupimport'));
    } else {
        $filehash = hash('sha256', $content);
        $parsed = local_groupimport_parse_import_content($content, $filename, $errors);
        $previewrows = local_groupimport_build_preview_rows($parsed, $errors);

        if (!empty($previewrows)) {
            $preview = [
                'filename' => $filename,
                'filehash' => $filehash,
                'previousimport' => local_groupimport_get_matching_import_history((int)$course->id, $filehash),
                'rows' => $previewrows,
                'messages' => local_groupimport_validate_preview_rows($previewrows, $context),
            ];
        } else if (empty($errors)) {
            $errors[] = get_string('importnorowsdetected', 'local_groupimport');
        }
    }
}

$mform = new import_form(null, [
    'courseid' => $course->id,
    'submitlabel' => $preview !== null
        ? get_string('replacefile', 'local_groupimport')
        : get_string('previewimport', 'local_groupimport'),
]);
$historyrecords = local_groupimport_get_import_history((int)$course->id);

// Output.
echo $OUTPUT->header();

// Main container.
echo html_writer::start_div('local-groupimport-import' . ($preview !== null ? ' has-preview is-upload-collapsed' : ''), [
    'id' => 'local-groupimport-import',
    'data-region' => 'local-groupimport-import',
]);

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::span(get_string('easystudlabel', 'local_groupimport'), 'local-groupimport-import__eyebrow') .
        html_writer::tag('h2', get_string('groupimport', 'local_groupimport'), [
            'class' => 'h4 local-groupimport-import__title',
        ]) .
        html_writer::tag('p', get_string('importfile_help', 'local_groupimport'), [
            'class' => 'local-groupimport-import__intro',
        ])
    ) .
    html_writer::tag('div',
        html_writer::link(new moodle_url('/local/groupimport/manage.php', ['id' => $course->id]),
            get_string('easystudmanager', 'local_groupimport'), [
                'class' => 'btn btn-primary',
            ]) .
        html_writer::link($templateurl, get_string('downloadtemplate', 'local_groupimport'), [
            'class' => 'btn btn-outline-primary local-groupimport-import__template-link',
        ]) .
        html_writer::tag('button',
            html_writer::tag('span', '', ['class' => 'fa fa-history me-2', 'aria-hidden' => 'true']) .
            html_writer::tag('span', get_string('importhistory', 'local_groupimport')),
            [
                'type' => 'button',
                'class' => 'btn btn-outline-secondary',
                'data-local-groupimport-history-open' => '1',
            ]
        ) .
        html_writer::link(course_get_url($course), get_string('backtocourse', 'local_groupimport'), [
            'class' => 'btn btn-outline-secondary',
        ]),
        ['class' => 'local-groupimport-import__header-actions']
    ),
    ['class' => 'local-groupimport-import__header']
);

echo html_writer::start_div('local-groupimport-import__grid');

$uploadtoggle = '';
if ($preview !== null) {
    $uploadtoggle = html_writer::tag('button',
        html_writer::tag('span', '', ['class' => 'fa fa-chevron-right', 'aria-hidden' => 'true']),
        [
            'type' => 'button',
            'class' => 'btn btn-link p-0 local-groupimport-import-card__toggle',
            'data-local-groupimport-upload-toggle' => '1',
            'data-expand-label' => get_string('expanduploadpanel', 'local_groupimport'),
            'data-collapse-label' => get_string('collapseuploadpanel', 'local_groupimport'),
            'aria-expanded' => 'false',
            'aria-label' => get_string('expanduploadpanel', 'local_groupimport'),
        ]
    );
}

// Form card.
echo html_writer::start_div('local-groupimport-import-card local-groupimport-import-card--upload');
echo html_writer::tag('div',
    html_writer::tag('span', '', ['class' => 'fa fa-file-csv', 'aria-hidden' => 'true']) .
    html_writer::tag('div',
        html_writer::tag('h3', get_string('importfile', 'local_groupimport'), [
            'class' => 'h5 local-groupimport-import-card__title',
        ]) .
        html_writer::tag('p', get_string('csvimportintro', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__description',
        ])
    ) .
    $uploadtoggle,
    ['class' => 'local-groupimport-import-card__header']
);

$fieldtags = [];
foreach ($allowedimportfields as $fieldlabel) {
    $fieldtags[] = html_writer::tag('span', s($fieldlabel), [
        'class' => 'local-groupimport-import-fields__tag',
    ]);
}

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::tag('span',
            html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']),
            ['class' => 'local-groupimport-import-fields__icon', 'aria-hidden' => 'true']
        ) .
        html_writer::tag('div',
            html_writer::tag('strong', get_string('importautodetecttitle', 'local_groupimport')) .
            html_writer::tag('p', get_string('importautodetectintro', 'local_groupimport'), ['class' => 'mb-0'])
        ),
        ['class' => 'local-groupimport-import-fields__header']
    ) .
    html_writer::tag('p', get_string('importfieldsavailable', 'local_groupimport'), [
        'class' => 'local-groupimport-import-fields__label mb-0',
    ]) .
    html_writer::tag('div', implode("\n", $fieldtags), ['class' => 'local-groupimport-import-fields__tags']),
    ['class' => 'local-groupimport-import-fields']
);

// Moodle form (with filepicker).
echo html_writer::start_div('local-groupimport-import-form', [
    'id' => 'local_groupimport-form',
    'data-local-groupimport-import-form' => '1',
]);
$mform->display();
echo html_writer::end_div();

echo html_writer::end_div(); // Card.

// Results card.
echo html_writer::start_div('local-groupimport-import-card local-groupimport-import-card--results', ['id' => 'local_groupimport-results']);
echo html_writer::tag('div',
    html_writer::tag('span', '', ['class' => 'fa fa-clipboard-check', 'aria-hidden' => 'true']) .
    html_writer::tag('div',
        html_writer::tag('h3', get_string('importresults', 'local_groupimport'), [
            'class' => 'h5 local-groupimport-import-card__title',
        ]) .
        html_writer::tag('p', get_string('csvreportintro', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__description',
        ])
    ),
    ['class' => 'local-groupimport-import-card__header']
);

if ($preview !== null) {
    $rowcount = count($preview['rows']);
    $warningcount = count(array_filter($preview['messages'], static function(array $messages): bool {
        return !empty($messages);
    }));

    echo html_writer::tag('div',
        html_writer::tag('span',
            html_writer::tag('strong', $rowcount) . ' ' . get_string('importpreviewrows', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--success']
        ) .
        html_writer::tag('span',
            html_writer::tag('strong', $warningcount) . ' ' . get_string('importpreviewwarnings', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--error']
        ),
        ['class' => 'local-groupimport-import-summary']
    );

    echo html_writer::start_tag('form', [
        'method' => 'post',
        'action' => new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
        'class' => 'local-groupimport-import-preview',
    ]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'id', 'value' => $course->id]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'confirmimport', 'value' => 1]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'importfilename', 'value' => $preview['filename']]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'importhash', 'value' => $preview['filehash']]);

    echo html_writer::tag('div',
        html_writer::tag('span', '', ['class' => 'fa fa-magic', 'aria-hidden' => 'true']) .
        html_writer::tag('div',
            html_writer::tag('strong', get_string('importpreviewtitle', 'local_groupimport')) .
            html_writer::tag('p', get_string('importpreviewintro', 'local_groupimport', s($preview['filename'])), [
                'class' => 'mb-0',
            ])
        ),
        ['class' => 'local-groupimport-import-preview__notice']
    );

    if (!empty($preview['previousimport'])) {
        echo html_writer::tag('div',
            html_writer::tag('span', '', ['class' => 'fa fa-history', 'aria-hidden' => 'true']) .
            html_writer::tag('p',
                get_string('previewpreviousimport', 'local_groupimport',
                    userdate((int)$preview['previousimport']->timecreated)),
                ['class' => 'mb-0']
            ),
            ['class' => 'local-groupimport-import-preview__reimport-alert']
        );
    }

    echo html_writer::tag('div',
        html_writer::tag('strong', get_string('reimportstrategy', 'local_groupimport')) .
        html_writer::tag('label',
            html_writer::empty_tag('input', [
                'type' => 'radio',
                'name' => 'replacepolicy',
                'value' => 'keep',
                'checked' => 'checked',
            ]) .
            html_writer::tag('span', get_string('reimportkeep', 'local_groupimport'))
        ) .
        html_writer::tag('label',
            html_writer::empty_tag('input', [
                'type' => 'radio',
                'name' => 'replacepolicy',
                'value' => 'replace',
                'disabled' => 'disabled',
            ]) .
            html_writer::tag('span', get_string('reimportreplaceplanned', 'local_groupimport'))
        ),
        ['class' => 'local-groupimport-import-preview__strategy']
    );

    echo html_writer::tag('div',
        html_writer::tag('div',
            html_writer::tag('button', get_string('selectallrows', 'local_groupimport'), [
                'type' => 'button',
                'class' => 'btn btn-outline-primary btn-sm',
                'data-local-groupimport-preview-toggle-all' => '1',
                'data-select-label' => get_string('selectallrows', 'local_groupimport'),
                'data-deselect-label' => get_string('deselectallrows', 'local_groupimport'),
            ]),
            ['class' => 'local-groupimport-import-preview__bulk-actions']
        ) .
        html_writer::tag('label',
            html_writer::span(get_string('previewsearchlabel', 'local_groupimport'), 'accesshide') .
            html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']) .
            html_writer::empty_tag('input', [
                'type' => 'search',
                'class' => 'form-control local-groupimport-import-preview__search',
                'placeholder' => get_string('previewsearchplaceholder', 'local_groupimport'),
                'data-local-groupimport-preview-search' => '1',
            ]),
            [
                'class' => 'local-groupimport-import-preview__search-field',
                'aria-label' => get_string('previewsearchlabel', 'local_groupimport'),
            ]
        ) .
        html_writer::tag('div',
            html_writer::tag('button', get_string('selectmatchingrows', 'local_groupimport'), [
                'type' => 'button',
                'class' => 'btn btn-outline-primary btn-sm',
                'data-local-groupimport-preview-toggle-results' => '1',
                'data-select-label' => get_string('selectmatchingrows', 'local_groupimport'),
                'data-deselect-label' => get_string('deselectmatchingrows', 'local_groupimport'),
                'hidden' => 'hidden',
            ]),
            ['class' => 'local-groupimport-import-preview__result-actions']
        ),
        ['class' => 'local-groupimport-import-preview__toolbar']
    );

    echo html_writer::start_tag('div', ['class' => 'local-groupimport-import-preview__table-wrap']);
    echo html_writer::start_tag('table', ['class' => 'generaltable local-groupimport-import-preview__table']);
    echo html_writer::tag('thead',
        html_writer::tag('tr',
            html_writer::tag('th', get_string('importpreviewinclude', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewline', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewidentifier', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewgroup', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewgrouping', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewstatus', 'local_groupimport'))
        )
    );
    echo html_writer::start_tag('tbody');

    foreach ($preview['rows'] as $index => $row) {
        $messages = $preview['messages'][$index] ?? [];
        $status = empty($messages)
            ? html_writer::tag('span', get_string('importpreviewready', 'local_groupimport'), [
                'class' => 'local-groupimport-import-preview__status local-groupimport-import-preview__status--ready',
            ])
            : html_writer::tag('span', implode(' ', array_map('s', $messages)), [
                'class' => 'local-groupimport-import-preview__status local-groupimport-import-preview__status--warning',
            ]);

        echo html_writer::tag('tr',
            html_writer::tag('td',
                html_writer::empty_tag('input', [
                    'type' => 'checkbox',
                    'name' => 'rowenabled[' . $index . ']',
                    'value' => 1,
                    'checked' => 'checked',
                    'aria-label' => get_string('importpreviewinclude', 'local_groupimport'),
                ])
            ) .
            html_writer::tag('td', (string)$row['line']) .
            html_writer::tag('td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'identifier[' . $index . ']',
                    'value' => $row['identifier'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag('td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'groupname[' . $index . ']',
                    'value' => $row['groupname'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag('td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'groupingname[' . $index . ']',
                    'value' => $row['groupingname'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag('td', $status),
            [
                'class' => empty($messages) ? '' : 'local-groupimport-import-preview__row--warning',
                'data-local-groupimport-preview-row' => '1',
            ]
        );
    }

    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
    echo html_writer::end_tag('div');
    echo html_writer::tag('div',
        html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']) .
        html_writer::tag('p', get_string('nopreviewmatches', 'local_groupimport'), ['class' => 'mb-0']),
        [
            'class' => 'local-groupimport-import-empty local-groupimport-import-empty--preview-search',
            'data-local-groupimport-preview-empty' => '1',
            'hidden' => 'hidden',
        ]
    );

    echo html_writer::tag('div',
        html_writer::tag('button',
            html_writer::tag('span', '', ['class' => 'fa fa-check', 'aria-hidden' => 'true']) .
            get_string('submitimport', 'local_groupimport'),
            ['type' => 'submit', 'class' => 'btn btn-primary']
        ) .
        html_writer::link(new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
            get_string('cancel', 'local_groupimport'),
            ['class' => 'btn btn-outline-secondary']
        ),
        ['class' => 'local-groupimport-import-preview__actions']
    );
    echo html_writer::end_tag('form');
} else if (empty($success) && empty($errors)) {
    echo html_writer::tag('div',
        html_writer::tag('span', '', ['class' => 'fa fa-inbox', 'aria-hidden' => 'true']) .
        html_writer::tag('p', get_string('noresults', 'local_groupimport'), ['class' => 'mb-0']),
        ['class' => 'local-groupimport-import-empty']
    );
} else {
    echo html_writer::tag('div',
        html_writer::tag('span',
            html_writer::tag('strong', count($success)) . ' ' . get_string('successheader', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--success']
        ) .
        html_writer::tag('span',
            html_writer::tag('strong', count($errors)) . ' ' . get_string('errorheader', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--error']
        ),
        [
            'class' => 'local-groupimport-import-summary',
            'aria-label' => get_string('importsummary', 'local_groupimport'),
        ]
    );

    if (!empty($success)) {
        echo html_writer::tag('h4', get_string('successheader', 'local_groupimport'), [
            'class' => 'local-groupimport-import-report__title local-groupimport-import-report__title--success',
        ]);
        echo html_writer::start_tag('ul', [
            'class' => 'local-groupimport-import-report local-groupimport-import-report--success',
        ]);
        foreach ($success as $msg) {
            echo html_writer::tag('li',
                html_writer::tag('span', '', ['class' => 'fa fa-check', 'aria-hidden' => 'true']) .
                html_writer::tag('span', s($msg))
            );
        }
        echo html_writer::end_tag('ul');
    }

    if (!empty($errors)) {
        echo html_writer::tag('h4', get_string('errorheader', 'local_groupimport'), [
            'class' => 'local-groupimport-import-report__title local-groupimport-import-report__title--error',
        ]);
        echo html_writer::start_tag('ul', [
            'class' => 'local-groupimport-import-report local-groupimport-import-report--error',
        ]);
        foreach ($errors as $msg) {
            echo html_writer::tag('li',
                html_writer::tag('span', '', ['class' => 'fa fa-exclamation-triangle', 'aria-hidden' => 'true']) .
                html_writer::tag('span', s($msg))
            );
        }
        echo html_writer::end_tag('ul');
    }
}

echo html_writer::end_div(); // Card.

echo html_writer::end_div(); // Grid.

$historyitems = '';
if (!empty($historyrecords)) {
    foreach ($historyrecords as $record) {
        $historyitems .= html_writer::tag('li',
            html_writer::tag('div',
                html_writer::tag('strong', s($record->filename)) .
                html_writer::tag('span', userdate((int)$record->timecreated)),
                ['class' => 'local-groupimport-import-history__item-main']
            ) .
            html_writer::tag('div',
                html_writer::tag('span', get_string('importhistoryrows', 'local_groupimport', (int)$record->rowcount)) .
                html_writer::tag('span', get_string('importhistorysuccess', 'local_groupimport', (int)$record->successcount)) .
                html_writer::tag('span', get_string('importhistoryerrors', 'local_groupimport', (int)$record->errorcount)),
                ['class' => 'local-groupimport-import-history__item-meta']
            )
        );
    }
} else {
    $historyitems = html_writer::tag('li',
        html_writer::tag('span', '', ['class' => 'fa fa-inbox', 'aria-hidden' => 'true']) .
        html_writer::tag('span', get_string('importhistoryempty', 'local_groupimport')),
        ['class' => 'local-groupimport-import-history__empty']
    );
}

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::tag('div',
            html_writer::tag('h3', get_string('importhistory', 'local_groupimport'), [
                'id' => 'local-groupimport-import-history-title',
                'class' => 'h5 mb-0',
            ]) .
            html_writer::tag('button',
                html_writer::tag('span', '', ['class' => 'fa fa-times', 'aria-hidden' => 'true']),
                [
                    'type' => 'button',
                    'class' => 'local-groupimport-import-modal__close',
                    'data-local-groupimport-history-close' => '1',
                    'aria-label' => get_string('close', 'moodle'),
                ]
            ),
            ['class' => 'local-groupimport-import-modal__header']
        ) .
        html_writer::tag('div',
            html_writer::tag('p', get_string('importhistorydesc', 'local_groupimport'), [
                'class' => 'local-groupimport-import-history__desc',
            ]) .
            html_writer::tag('ul', $historyitems, ['class' => 'local-groupimport-import-history']),
            ['class' => 'local-groupimport-import-modal__body']
        ),
        [
            'class' => 'local-groupimport-import-modal__dialog',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-import-history-title',
        ]
    ),
    [
        'class' => 'local-groupimport-import-modal',
        'data-local-groupimport-history-modal' => '1',
        'hidden' => 'hidden',
    ]
);

echo html_writer::tag('div',
    html_writer::tag('div',
        html_writer::tag('span', '', ['class' => 'fa fa-plus', 'aria-hidden' => 'true']) .
        html_writer::tag('strong', get_string('csvdropready', 'local_groupimport')) .
        html_writer::tag('p', get_string('csvdropsubtitle', 'local_groupimport'), ['class' => 'mb-0']),
        ['class' => 'local-groupimport-import-drop__panel']
    ),
    [
        'class' => 'local-groupimport-import-drop',
        'data-local-groupimport-drop-overlay' => '1',
        'hidden' => 'hidden',
        'aria-hidden' => 'true',
    ]
);

echo html_writer::end_div(); // Container.

echo $OUTPUT->footer();
