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
 * CSV template download endpoint for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

$id = required_param('id', PARAM_INT); // Course id.

$course = get_course($id);
require_login($course);

$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

$filename = 'modele_import_groupes.csv';
if (get_string_manager()->string_exists('templatename', 'local_groupimport')) {
    $filename = clean_filename(get_string('templatename', 'local_groupimport'));
    if (substr($filename, -4) !== '.csv') {
        $filename .= '.csv';
    }
}

// Build CSV content.
$fh = fopen('php://temp', 'w+');

// Header row: use teacher-friendly labels recognised by the automatic importer.
fputcsv($fh, ['student', 'group', 'grouping'], ';');

// Example rows.
fputcsv($fh, ['test.etudiant.01@example.com', 'Groupe A', 'TD Semaine 1'], ';');
fputcsv($fh, ['test.etudiant.02', 'Groupe B', 'TD Semaine 2'], ';');

rewind($fh);
$content = stream_get_contents($fh);
fclose($fh);

// Send file via Moodle API.
send_file(
    $content,
    $filename,
    0,
    0,
    true,
    false,
    'text/csv; charset=utf-8'
);
