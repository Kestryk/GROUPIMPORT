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
 * AJAX endpoint for EasyStud course group actions.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/group/lib.php');

$courseid = required_param('courseid', PARAM_INT);
$action = required_param('action', PARAM_ALPHA);

require_sesskey();

$course = get_course($courseid);
require_login($course);

$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

$response = ['success' => false];

try {
    if ($action === 'creategroup') {
        $name = trim(required_param('groupname', PARAM_TEXT));
        if ($name === '') {
            throw new moodle_exception('invaliddata', 'error');
        }

        $group = (object)[
            'courseid' => $course->id,
            'name' => $name,
        ];
        $groupid = groups_create_group($group);

        $response['success'] = true;
        $response['message'] = get_string('groupcreated', 'local_groupimport');
        $response['group'] = [
            'id' => (int)$groupid,
            'name' => format_string($name),
            'rawname' => $name,
            'membercount' => 0,
        ];
    } else if ($action === 'creategrouping') {
        $name = trim(required_param('groupingname', PARAM_TEXT));
        if ($name === '') {
            throw new moodle_exception('invaliddata', 'error');
        }

        $grouping = (object)[
            'courseid' => $course->id,
            'name' => $name,
        ];
        $groupingid = groups_create_grouping($grouping);

        $response['success'] = true;
        $response['message'] = get_string('groupingcreated', 'local_groupimport');
        $response['grouping'] = [
            'id' => (int)$groupingid,
            'name' => format_string($name),
            'rawname' => $name,
            'groupcount' => 0,
        ];
    } else if ($action === 'renamegroup') {
        $groupid = required_param('groupid', PARAM_INT);
        $name = trim(required_param('name', PARAM_TEXT));
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id || $name === '') {
            throw new moodle_exception('invaliddata', 'error');
        }

        $group->name = $name;
        groups_update_group($group);

        $response['success'] = true;
        $response['message'] = get_string('groupsaved', 'local_groupimport');
        $response['group'] = [
            'id' => (int)$groupid,
            'name' => format_string($name),
            'rawname' => $name,
        ];
    } else if ($action === 'renamegrouping') {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $name = trim(required_param('name', PARAM_TEXT));
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);

        if ($name === '') {
            throw new moodle_exception('invaliddata', 'error');
        }

        $grouping->name = $name;
        groups_update_grouping($grouping);

        $response['success'] = true;
        $response['message'] = get_string('groupingsaved', 'local_groupimport');
        $response['grouping'] = [
            'id' => (int)$groupingid,
            'name' => format_string($name),
            'rawname' => $name,
        ];
    } else if ($action === 'movegroup') {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $targetgroupingid = optional_param('groupingid', 0, PARAM_INT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        if ($targetgroupingid > 0) {
            $grouping = $DB->get_record(
                'groupings',
                ['id' => $targetgroupingid, 'courseid' => $course->id],
                '*',
                MUST_EXIST
            );
            local_groupimport_remove_group_from_other_groupings($groupid, $course->id, $targetgroupingid);
            if (!$DB->record_exists('groupings_groups', ['groupingid' => $grouping->id, 'groupid' => $groupid])) {
                groups_assign_grouping($grouping->id, $groupid);
            }
            $response['message'] = get_string('groupmovedtogrouping', 'local_groupimport', format_string($grouping->name));
        } else {
            local_groupimport_remove_group_from_other_groupings($groupid, $course->id);
            $response['message'] = get_string('groupremovedfromgroupings', 'local_groupimport');
        }

        $response['success'] = true;
    } else if ($action === 'addusers') {
        $groupid = required_param('groupid', PARAM_INT);
        $userids = required_param_array('userids', PARAM_INT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        $added = 0;
        foreach (array_unique($userids) as $userid) {
            if (!is_enrolled($context, $userid)) {
                continue;
            }
            if (!groups_is_member($groupid, $userid)) {
                groups_add_member($groupid, $userid);
                $added++;
            }
        }

        $response['success'] = true;
        $response['message'] = get_string('usersaddedtogroup', 'local_groupimport', $added);
    } else if ($action === 'addemails') {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $rawemails = required_param('emails', PARAM_TEXT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        $emails = local_groupimport_extract_emails($rawemails);
        $addedusers = [];
        $missing = [];

        foreach ($emails as $email) {
            $user = $DB->get_record('user', ['email' => $email, 'deleted' => 0], 'id, firstname, lastname, email');
            if (!$user || !is_enrolled($context, $user->id)) {
                $missing[] = $email;
                continue;
            }
            if (!groups_is_member($groupid, $user->id)) {
                groups_add_member($groupid, $user->id);
            }
            $addedusers[] = [
                'id' => (int)$user->id,
                'fullname' => fullname($user),
            ];
        }

        $response['success'] = true;
        $response['users'] = $addedusers;
        $response['missing'] = $missing;
        $response['message'] = get_string('emailsprocessed', 'local_groupimport', count($addedusers));
    } else if ($action === 'addgroups') {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $rawgroups = required_param('groups', PARAM_TEXT);
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);
        $tokens = local_groupimport_extract_group_tokens($rawgroups);
        $coursegroups = groups_get_all_groups($course->id) ?: [];

        $groupsbyid = [];
        $groupsbyname = [];
        foreach ($coursegroups as $group) {
            $groupsbyid[(int)$group->id] = $group;
            $normalizedname = core_text::strtolower(trim($group->name));
            if (!isset($groupsbyname[$normalizedname])) {
                $groupsbyname[$normalizedname] = [];
            }
            $groupsbyname[$normalizedname][] = $group;
        }

        $matchedgroups = [];
        $missing = [];
        $ambiguous = [];

        foreach ($tokens as $token) {
            if ($token === '') {
                continue;
            }

            if (ctype_digit($token) && isset($groupsbyid[(int)$token])) {
                $matchedgroups[(int)$token] = $groupsbyid[(int)$token];
                continue;
            }

            $normalizedtoken = core_text::strtolower($token);
            $namecandidates = $groupsbyname[$normalizedtoken] ?? [];
            if (count($namecandidates) === 1) {
                $group = reset($namecandidates);
                $matchedgroups[(int)$group->id] = $group;
            } else if (count($namecandidates) > 1) {
                $ambiguous[] = $token;
            } else {
                $missing[] = $token;
            }
        }

        $movedgroups = [];
        foreach ($matchedgroups as $group) {
            local_groupimport_remove_group_from_other_groupings((int)$group->id, $course->id, $groupingid);
            if (!$DB->record_exists('groupings_groups', ['groupingid' => $groupingid, 'groupid' => $group->id])) {
                groups_assign_grouping($groupingid, $group->id);
            }
            $movedgroups[] = [
                'id' => (int)$group->id,
                'name' => format_string($group->name),
            ];
        }

        $response['success'] = true;
        $response['groups'] = $movedgroups;
        $response['missing'] = array_values(array_unique($missing));
        $response['ambiguous'] = array_values(array_unique($ambiguous));
        $response['message'] = get_string('groupsprocessed', 'local_groupimport', count($movedgroups));
    } else if ($action === 'removeuser') {
        $groupid = required_param('groupid', PARAM_INT);
        $userid = required_param('userid', PARAM_INT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        if (groups_is_member($groupid, $userid)) {
            groups_remove_member($groupid, $userid);
        }

        $response['success'] = true;
        $response['message'] = get_string('userremovedfromgroup', 'local_groupimport');
    } else if ($action === 'removemembers') {
        $groupids = required_param_array('groupids', PARAM_INT);
        $userids = required_param_array('userids', PARAM_INT);
        $removed = 0;

        foreach ($groupids as $index => $groupid) {
            $userid = $userids[$index] ?? 0;
            if (!$groupid || !$userid) {
                continue;
            }

            $group = groups_get_group($groupid);
            if (!$group || (int)$group->courseid !== (int)$course->id) {
                continue;
            }

            if (groups_is_member($groupid, $userid)) {
                groups_remove_member($groupid, $userid);
                $removed++;
            }
        }

        $response['success'] = true;
        $response['message'] = get_string('membersremoved', 'local_groupimport', $removed);
    } else if ($action === 'deletegroups') {
        $groupids = required_param_array('groupids', PARAM_INT);
        $deleted = 0;

        foreach (array_unique($groupids) as $groupid) {
            $group = groups_get_group($groupid);
            if (!$group || (int)$group->courseid !== (int)$course->id) {
                continue;
            }

            groups_delete_group($groupid);
            $deleted++;
        }

        $response['success'] = true;
        $response['message'] = get_string('groupsdeleted', 'local_groupimport', $deleted);
    } else if ($action === 'deletegroupings') {
        global $DB;

        $groupingids = required_param_array('groupingids', PARAM_INT);
        $deleted = 0;

        foreach (array_unique($groupingids) as $groupingid) {
            $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id]);
            if (!$grouping) {
                continue;
            }

            groups_delete_grouping($grouping);
            $deleted++;
        }

        $response['success'] = true;
        $response['message'] = get_string('groupingsdeleted', 'local_groupimport', $deleted);
    }
} catch (Throwable $exception) {
    $response['error'] = $exception->getMessage();
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response);

/**
 * Remove a group from every grouping in its course, optionally preserving one target grouping.
 *
 * @param int $groupid Group id.
 * @param int $courseid Course id.
 * @param int|null $keepgroupingid Grouping id to keep.
 * @return void
 */
function local_groupimport_remove_group_from_other_groupings(
    int $groupid,
    int $courseid,
    ?int $keepgroupingid = null
): void {
    global $DB;

    $sql = "SELECT gg.id, gg.groupingid
              FROM {groupings_groups} gg
              JOIN {groupings} g ON g.id = gg.groupingid
             WHERE gg.groupid = :groupid
               AND g.courseid = :courseid";
    $records = $DB->get_records_sql($sql, [
        'groupid' => $groupid,
        'courseid' => $courseid,
    ]);

    foreach ($records as $record) {
        if ($keepgroupingid !== null && (int)$record->groupingid === $keepgroupingid) {
            continue;
        }
        $DB->delete_records('groupings_groups', ['id' => $record->id]);
    }
}

/**
 * Extract normalised email addresses from pasted text.
 *
 * @param string $text Pasted text.
 * @return array
 */
function local_groupimport_extract_emails(string $text): array {
    preg_match_all('/[^\s,;<>]+@[^\s,;<>]+/u', core_text::strtolower($text), $matches);
    return array_values(array_unique($matches[0] ?? []));
}

/**
 * Extract normalised group tokens from pasted text.
 *
 * @param string $text Pasted text.
 * @return array
 */
function local_groupimport_extract_group_tokens(string $text): array {
    $parts = preg_split('/[\r\n,;|]+/u', core_text::strtolower($text));
    $tokens = array_map(static function(string $part): string {
        return trim($part);
    }, $parts ?: []);

    return array_values(array_unique(array_filter($tokens, static function(string $token): bool {
        return $token !== '';
    })));
}
