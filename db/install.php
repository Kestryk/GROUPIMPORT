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
 * Installation hook for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Installation hook: import Moodle user tours shipped with the plugin.
 *
 * @return void
 */
function xmldb_local_groupimport_install(): void {
    global $DB;

    $dbman = $DB->get_manager();
    $table = new xmldb_table('local_groupimport_history');

    if (!$dbman->table_exists($table)) {
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE);
        $table->add_field('courseid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL);
        $table->add_field('filename', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL);
        $table->add_field('filehash', XMLDB_TYPE_CHAR, '64', null, XMLDB_NOTNULL);
        $table->add_field('rowcount', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('successcount', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('errorcount', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('replacepolicy', XMLDB_TYPE_CHAR, '32', null, XMLDB_NOTNULL, null, 'keep');
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL);

        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_index('courseid', XMLDB_INDEX_NOTUNIQUE, ['courseid']);
        $table->add_index('userid', XMLDB_INDEX_NOTUNIQUE, ['userid']);
        $table->add_index('filehash', XMLDB_INDEX_NOTUNIQUE, ['filehash']);

        $dbman->create_table($table);
    }

    if (!class_exists('\tool_usertours\manager')) {
        return;
    }

    $tours = [
        [
            'name' => 'tour_groupimport_teacher_name,local_groupimport',
            'pathmatch' => '/local/groupimport/index.php%',
            'json' => __DIR__ . '/tours/local_groupimport_teacher_guide.json',
        ],
        [
            'name' => 'tour_groupimport_coursehome_name,local_groupimport',
            'pathmatch' => '/course/view.php%',
            'json' => __DIR__ . '/tours/local_groupimport_course_home_hint.json',
        ],
    ];

    foreach ($tours as $tour) {
        if ($DB->record_exists('tool_usertours_tours', [
            'name' => $tour['name'],
            'pathmatch' => $tour['pathmatch'],
        ])) {
            continue;
        }

        if (!file_exists($tour['json'])) {
            continue;
        }

        $json = file_get_contents($tour['json']);
        if ($json === false || trim($json) === '') {
            continue;
        }

        \tool_usertours\manager::import_tour_from_json($json);
    }
}
