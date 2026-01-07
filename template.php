<?php

/**
 * Local Group Import plugin for Moodle
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @author     Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 * This plugin is developed as a personal project and is not private.
 * It is distributed under the terms of the GNU General Public License.
 */
require_once(__DIR__ . '/../../config.php');

$id = required_param('id', PARAM_INT); // course id.

$course = get_course($id);
require_login($course);
$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

$filename = get_string('templatename', 'local_groupimport');

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="modele_import_groupes.csv"');

$output = fopen('php://output', 'w');

// Entête : useridentifier au lieu de username.
fputcsv($output, ['useridentifier', 'groupname', 'groupingname'], ';');

// Éventuelles lignes d’exemple :
fputcsv($output, ['user002', 'Groupe A', 'TD Semaine 1'], ';');
fputcsv($output, ['user003', 'Groupe B', 'TD Semaine 2'], ';');

fclose($output);
exit;

