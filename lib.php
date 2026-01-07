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

defined('MOODLE_INTERNAL') || die();

/**
 * Ajoute une entrée dans la navigation du cours (menu "Plus").
 *
 * @param navigation_node $coursenode
 * @param stdClass $course
 * @param context_course $context
 */
function local_groupimport_extend_navigation_course(navigation_node $coursenode, stdClass $course, context_course $context) {
    if (!has_capability('moodle/course:managegroups', $context)) {
        return;
    }

    $url = new moodle_url('/local/groupimport/index.php', ['id' => $course->id]);

    if (!$coursenode->find('local_groupimport', navigation_node::TYPE_CUSTOM)) {
        $coursenode->add(
            get_string('groupimport', 'local_groupimport'),
            $url,
            navigation_node::TYPE_CUSTOM,
            null,
            'local_groupimport',
            new pix_icon('i/groups', '')
        );
    }
}

// >>> IMPORTANT <<<
// NE PAS définir local_groupimport_extend_settings_navigation ici.
// On laisse Moodle tranquille pour la navigation d'administration.
