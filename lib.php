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
 * Library callbacks for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Extends the course navigation with the EasyStud entries (course "More" menu).
 *
 * @param navigation_node $coursenode The course navigation node.
 * @param stdClass $course The course record.
 * @param context_course $context The course context.
 * @return void
 */
function local_groupimport_extend_navigation_course(navigation_node $coursenode, stdClass $course,
        context_course $context): void {
    if (!has_capability('moodle/course:managegroups', $context)) {
        return;
    }

    local_groupimport_require_navigation_js((int)$course->id);
    $participantsnode = $coursenode->get('participants', navigation_node::TYPE_CONTAINER);
    if (!$participantsnode) {
        $participantsnode = $coursenode->get('participants', navigation_node::TYPE_CUSTOM);
    }
    if ($participantsnode) {
        local_groupimport_configure_participants_node($participantsnode, (int)$course->id);
    }

    if (!$participantsnode && !$coursenode->find('local_groupimport_easystud', navigation_node::TYPE_CUSTOM)) {
        $easystudnode = navigation_node::create(
            get_string('easystudmanager', 'local_groupimport'),
            local_groupimport_get_manager_url((int)$course->id),
            navigation_node::TYPE_CUSTOM,
            null,
            'local_groupimport_easystud',
            new pix_icon('i/groups', '')
        );
        $coursenode->add_node($easystudnode, 'participants');
    }

    if (!$coursenode->find('local_groupimport', navigation_node::TYPE_CUSTOM)) {
        $coursenode->add(
            get_string('groupimport', 'local_groupimport'),
            new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
            navigation_node::TYPE_CUSTOM,
            null,
            'local_groupimport',
            new pix_icon('i/import', '')
        );
    }
}

/**
 * Extends the settings navigation with the EasyStud participant entry.
 *
 * @param settings_navigation $settingsnav The settings navigation tree.
 * @param context|null $context The page context.
 * @return void
 */
function local_groupimport_extend_settings_navigation(settings_navigation $settingsnav, context $context = null): void {
    global $COURSE;

    if (!$context || $context->contextlevel !== CONTEXT_COURSE || empty($COURSE->id) || (int)$COURSE->id === SITEID) {
        return;
    }

    if (!has_capability('moodle/course:managegroups', $context)) {
        return;
    }

    $courseid = (int)$COURSE->id;
    local_groupimport_require_navigation_js($courseid);

    $usersnode = $settingsnav->find('users', navigation_node::TYPE_CONTAINER);
    if (!$usersnode) {
        $usersnode = $settingsnav->find('users', navigation_node::TYPE_SETTING);
    }
    if (!$usersnode) {
        return;
    }

    if (!$usersnode->find('local_groupimport_easystud', navigation_node::TYPE_CUSTOM)) {
        $usersnode->add(
            get_string('easystudmanager', 'local_groupimport'),
            local_groupimport_get_manager_url($courseid),
            navigation_node::TYPE_CUSTOM,
            null,
            'local_groupimport_easystud',
            new pix_icon('i/groups', '')
        );
    }

    local_groupimport_configure_participants_node($usersnode, $courseid);
}

/**
 * Returns the EasyStud manager URL for a course.
 *
 * @param int $courseid The course id.
 * @return moodle_url
 */
function local_groupimport_get_manager_url(int $courseid): moodle_url {
    return new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]);
}

/**
 * Returns the native participants URL for a course.
 *
 * @param int $courseid The course id.
 * @return moodle_url
 */
function local_groupimport_get_native_participants_url(int $courseid): moodle_url {
    return new moodle_url('/user/index.php', [
        'id' => $courseid,
        'local_groupimport_native' => 1,
    ]);
}

/**
 * Loads the EasyStud navigation AMD module for the current page.
 *
 * @param int $courseid The course id.
 * @return void
 */
function local_groupimport_require_navigation_js(int $courseid): void {
    global $PAGE;

    $PAGE->requires->js_call_amd('local_groupimport/navigation', 'init', [
        $courseid,
        local_groupimport_get_manager_url($courseid)->out(false),
        local_groupimport_get_native_participants_url($courseid)->out(false),
        get_string('easystudmanager', 'local_groupimport'),
    ]);
}

/**
 * Configures a participants-style navigation node to point at EasyStud.
 *
 * @param navigation_node $participantsnode The participants navigation node.
 * @param int $courseid The course id.
 * @return void
 */
function local_groupimport_configure_participants_node(navigation_node $participantsnode, int $courseid): void {
    $participantsnode->action = local_groupimport_get_manager_url($courseid);

    if (!$participantsnode->find('local_groupimport_nativeparticipants', navigation_node::TYPE_CUSTOM)) {
        $participantsnode->add(
            get_string('nativeparticipants', 'local_groupimport'),
            local_groupimport_get_native_participants_url($courseid),
            navigation_node::TYPE_CUSTOM,
            null,
            'local_groupimport_nativeparticipants',
            new pix_icon('i/users', '')
        );
    }
}
