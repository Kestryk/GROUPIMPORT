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
 * EasyStud simplified course group manager.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/group/lib.php');

use local_groupimport\service\course_structure;

$id = required_param('id', PARAM_INT);
$course = get_course($id);
require_login($course);

$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

$url = new moodle_url('/local/groupimport/manage.php', ['id' => $course->id]);
$PAGE->set_url($url);
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_pagetype('course-view-participants');
$PAGE->set_title(get_string('easystudmanager', 'local_groupimport'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->requires->js_call_amd('local_groupimport/course_manager', 'init', [
    'local-groupimport-easystud',
    $course->id,
]);

$action = optional_param('action', '', PARAM_ALPHA);
if ($action && confirm_sesskey()) {
    if ($action === 'creategroup') {
        $name = required_param('groupname', PARAM_TEXT);
        $group = (object)[
            'courseid' => $course->id,
            'name' => trim($name),
        ];
        if ($group->name !== '') {
            groups_create_group($group);
            redirect($url, get_string('groupcreated', 'local_groupimport'), null, \core\output\notification::NOTIFY_SUCCESS);
        }
    } else if ($action === 'creategrouping') {
        $name = required_param('groupingname', PARAM_TEXT);
        $grouping = (object)[
            'courseid' => $course->id,
            'name' => trim($name),
        ];
        if ($grouping->name !== '') {
            groups_create_grouping($grouping);
            redirect($url, get_string('groupingcreated', 'local_groupimport'), null, \core\output\notification::NOTIFY_SUCCESS);
        }
    } else if ($action === 'renamegroup') {
        $groupid = required_param('groupid', PARAM_INT);
        $name = required_param('name', PARAM_TEXT);
        $group = groups_get_group($groupid);
        if ($group && (int)$group->courseid === (int)$course->id && trim($name) !== '') {
            $group->name = trim($name);
            groups_update_group($group);
            redirect($url, get_string('groupsaved', 'local_groupimport'), null, \core\output\notification::NOTIFY_SUCCESS);
        }
    } else if ($action === 'renamegrouping') {
        global $DB;
        $groupingid = required_param('groupingid', PARAM_INT);
        $name = required_param('name', PARAM_TEXT);
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);
        if (trim($name) !== '') {
            $grouping->name = trim($name);
            groups_update_grouping($grouping);
            redirect($url, get_string('groupingsaved', 'local_groupimport'), null, \core\output\notification::NOTIFY_SUCCESS);
        }
    }
}

$state = course_structure::get_state($course, $context);
$users = $state['users'];
$groups = $state['groups'];
$groupings = $state['groupings'];

$csvurl = new moodle_url('/local/groupimport/index.php', ['id' => $course->id]);
$nativeparticipantsurl = new moodle_url('/user/index.php', [
    'id' => $course->id,
    'local_groupimport_native' => 1,
]);

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_groupimport/manage', local_groupimport_build_manage_template_data(
    $course,
    $users,
    $groups,
    $groupings,
    $state['ungroupedgroupids'],
    $csvurl,
    $nativeparticipantsurl,
    $OUTPUT->render_participants_tertiary_nav($course)
));

echo $OUTPUT->footer();

/**
 * Build role filter options from users.
 *
 * @param array $users User records.
 * @return array
 */
function local_groupimport_role_filter_options(array $users): array {
    $roles = [];
    foreach ($users as $user) {
        foreach ($user['roles'] as $role) {
            $roles[core_text::strtolower($role)] = $role;
        }
    }
    natcasesort($roles);
    return $roles;
}

/**
 * Build group filter options.
 *
 * @param array $groups Groups.
 * @return array
 */
function local_groupimport_group_filter_options(array $groups): array {
    $options = [];
    foreach ($groups as $group) {
        $options[(string)$group['id']] = $group['name'];
    }
    natcasesort($options);
    return $options;
}

/**
 * Build the EasyStud page template data.
 *
 * @param stdClass $course Course record.
 * @param array $users User records.
 * @param array $groups Group records.
 * @param array $groupings Grouping records.
 * @param array $ungroupedgroupids Group ids without grouping.
 * @param moodle_url $csvurl CSV URL.
 * @param moodle_url $nativeparticipantsurl Native participants URL.
 * @param string $navigationhtml Rendered tertiary navigation.
 * @return array
 */
function local_groupimport_build_manage_template_data(
    stdClass $course,
    array $users,
    array $groups,
    array $groupings,
    array $ungroupedgroupids,
    moodle_url $csvurl,
    moodle_url $nativeparticipantsurl,
    string $navigationhtml
): array {
    $alloweduserfields = local_groupimport_get_allowed_user_field_definitions();
    $users = local_groupimport_enrich_users_with_copy_fields($users, $alloweduserfields);

    $detaillabels = [
        'ajaxerror' => get_string('ajaxactionfailed', 'local_groupimport'),
        'username' => get_string('detailusername', 'local_groupimport'),
        'idnumber' => get_string('detailidnumber', 'local_groupimport'),
        'institution' => get_string('detailinstitution', 'local_groupimport'),
        'department' => get_string('detaildepartment', 'local_groupimport'),
        'city' => get_string('detailcity', 'local_groupimport'),
        'country' => get_string('detailcountry', 'local_groupimport'),
        'language' => get_string('detaillanguage', 'local_groupimport'),
        'roles' => get_string('roleslabel', 'local_groupimport'),
        'groups' => get_string('groupslabel', 'local_groupimport'),
        'nativedetails' => get_string('opennativeprofile', 'local_groupimport'),
        'removeuser' => str_replace('{}', '{name}', get_string('removeuserfromgroup', 'local_groupimport')),
        'selectionmode' => get_string('selectionmode', 'local_groupimport'),
        'showless' => get_string('showless', 'local_groupimport'),
        'groupswithoutgrouping' => get_string('groupswithoutgrouping', 'local_groupimport'),
        'rename' => get_string('rename', 'local_groupimport'),
        'save' => get_string('save'),
        'addemailstogroup' => get_string('addemailstogroup', 'local_groupimport'),
        'pasteemailsplaceholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
        'addemails' => get_string('addemails', 'local_groupimport'),
        'addgroupstogrouping' => get_string('addgroupstogrouping', 'local_groupimport'),
        'pastegroupsplaceholder' => get_string('pastegroupsplaceholder', 'local_groupimport'),
        'addgroups' => get_string('addgroups', 'local_groupimport'),
        'nogroupmembers' => get_string('nogroupmembers', 'local_groupimport'),
        'memberscounttemplate' => get_string('memberscount', 'local_groupimport', '__count__'),
        'groupscounttemplate' => get_string('groupscount', 'local_groupimport', '__count__'),
        'groupstructuresummarytemplate' => get_string('groupstructuresummary', 'local_groupimport', (object)[
            'groupings' => '__groupings__',
            'groups' => '__groups__',
        ]),
    ];

    $templatedata = [
        'detaillabelsjson' => json_encode($detaillabels),
        'navigationhtml' => $navigationhtml,
        'eyebrow' => get_string('easystudlabel', 'local_groupimport'),
        'title' => get_string('easystudmanager', 'local_groupimport'),
        'description' => get_string('easystudmanager_desc', 'local_groupimport'),
        'nativeparticipantsurl' => $nativeparticipantsurl->out(false),
        'nativeparticipantslabel' => get_string('nativeparticipants', 'local_groupimport'),
        'csvurl' => $csvurl->out(false),
        'csvlabel' => get_string('csvimportlink', 'local_groupimport'),
        'clipboardlabel' => get_string('clipboardtools', 'local_groupimport'),
        'selectionmodelabel' => get_string('selectionmode', 'local_groupimport'),
        'participantstitle' => get_string('participants', 'local_groupimport'),
        'participantscountlabel' => get_string('participantscount', 'local_groupimport', count($users)),
        'participantactions' => [
            [
                'icon' => 'fa-eye',
                'label' => get_string('viewparticipantdetails', 'local_groupimport'),
                'class' => 'btn btn-outline-secondary btn-sm',
                'attribute' => 'data-easystud-open-selected-user="1"',
                'disabled' => true,
            ],
            [
                'icon' => 'fa-user-times',
                'label' => get_string('removefromcoursefuture', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-remove-selected-users="1"',
                'disabled' => true,
            ],
            [
                'icon' => 'fa-compress',
                'label' => get_string('compactparticipants', 'local_groupimport'),
                'class' => 'btn btn-outline-secondary btn-sm',
                'attribute' => 'data-easystud-density-toggle="1" aria-pressed="false"',
                'disabled' => false,
            ],
            [
                'icon' => 'fa-arrow-right',
                'label' => get_string('moveselectedparticipants', 'local_groupimport'),
                'class' => 'btn btn-outline-primary btn-sm',
                'attribute' => 'data-easystud-move-selected-participants="1"',
                'disabled' => true,
            ],
        ],
        'roleoptions' => local_groupimport_build_select_options(
            ['' => get_string('allroles', 'local_groupimport')] + local_groupimport_role_filter_options($users)
        ),
        'groupoptions' => local_groupimport_build_select_options(
            ['' => get_string('allgroups', 'local_groupimport')] + local_groupimport_group_filter_options($groups)
        ),
        'searchplaceholder' => get_string('searchparticipants', 'local_groupimport'),
        'noparticipantsstate' => get_string('noparticipantsstate', 'local_groupimport'),
        'participants' => [],
        'groupstructuretitle' => get_string('groupstructure', 'local_groupimport'),
        'groupstructuresummarylabel' => get_string('groupstructuresummary', 'local_groupimport', (object)[
            'groupings' => count($groupings),
            'groups' => count($groups),
        ]),
        'groupactions' => [
            [
                'icon' => 'fa-trash',
                'label' => get_string('deletegroupsselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-delete-selected-groups="1"',
            ],
            [
                'icon' => 'fa-trash',
                'label' => get_string('deletegroupingsselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-delete-selected-groupings="1"',
            ],
            [
                'icon' => 'fa-user-minus',
                'label' => get_string('deletemembersselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-delete-selected-members="1"',
            ],
            [
                'icon' => 'fa-arrow-right',
                'label' => get_string('moveselectedgroups', 'local_groupimport'),
                'class' => 'btn btn-outline-primary btn-sm',
                'attribute' => 'data-easystud-move-selected-groups="1"',
            ],
        ],
        'quickcreateurl' => (new moodle_url('/local/groupimport/manage.php', ['id' => $course->id]))->out(false),
        'sesskey' => sesskey(),
        'newgroupplaceholder' => get_string('newgroupplaceholder', 'local_groupimport'),
        'newgroupingplaceholder' => get_string('newgroupingplaceholder', 'local_groupimport'),
        'creategrouplabel' => get_string('creategroup', 'local_groupimport'),
        'creategroupinglabel' => get_string('creategrouping', 'local_groupimport'),
        'nogroupstructurestate' => get_string('nogroupstructurestate', 'local_groupimport'),
        'groupings' => [],
        'ungroupedgroups' => [],
        'groupswithoutgrouping' => get_string('groupswithoutgrouping', 'local_groupimport'),
        'clipboarddesc' => get_string('clipboardtools_desc', 'local_groupimport'),
        'pasteemailsplaceholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
        'participantdetailstitle' => get_string('participantdetails', 'local_groupimport'),
        'movedialogtitle' => get_string('movedialogtitle', 'local_groupimport'),
        'movedialogparticipants' => get_string('movedialogparticipants', 'local_groupimport'),
        'movedialoggroups' => get_string('movedialoggroups', 'local_groupimport'),
        'movedestinationgroup' => get_string('movedestinationgroup', 'local_groupimport'),
        'movedestinationgrouping' => get_string('movedestinationgrouping', 'local_groupimport'),
        'moveconfirm' => get_string('moveconfirm', 'local_groupimport'),
        'deleteconfirmationtitle' => get_string('deleteconfirmationtitle', 'local_groupimport'),
        'confirmdeletegroups' => get_string('confirmdeletegroups', 'local_groupimport'),
        'confirmdeletegroupings' => get_string('confirmdeletegroupings', 'local_groupimport'),
        'confirmlabel' => get_string('confirm', 'local_groupimport'),
        'cancellabel' => get_string('cancel'),
        'contextactions' => local_groupimport_build_context_actions_template_data($alloweduserfields),
    ];

    foreach ($users as $user) {
        $searchtext = core_text::strtolower($user['fullname'] . ' ' . $user['email'] . ' ' .
            implode(' ', $user['roles']) . ' ' . implode(' ', $user['groups']));
        $templatedata['participants'][] = [
            'id' => $user['id'],
            'fullname' => $user['fullname'],
            'email' => $user['email'],
            'profileimage' => $user['profileimage'],
            'userdetailjson' => json_encode($user),
            'usercopyfieldsjson' => json_encode($user['copyfields'] ?? []),
            'searchtext' => $searchtext,
            'roletext' => core_text::strtolower(implode('|', $user['roles'])),
            'groupidscsv' => implode(',', $user['groupids']),
            'rolesmeta' => local_groupimport_build_meta_tags_template_data(
                get_string('roleslabel', 'local_groupimport'),
                $user['roles'],
                'local-groupimport-easystud-token local-groupimport-easystud-token--role',
                get_string('norole', 'local_groupimport')
            ),
            'groupsmeta' => local_groupimport_build_meta_tags_template_data(
                get_string('groupslabel', 'local_groupimport'),
                $user['groups'],
                'local-groupimport-easystud-token local-groupimport-easystud-token--group',
                get_string('nogroup', 'local_groupimport')
            ),
            'viewdetailslabel' => get_string('viewparticipantdetails', 'local_groupimport'),
            'draghint' => get_string('draghintparticipant', 'local_groupimport'),
        ];
    }

    foreach ($groupings as $grouping) {
        $templatedata['groupings'][] = local_groupimport_build_grouping_template_data($course->id, $grouping, $groups, $users);
    }

    foreach ($ungroupedgroupids as $groupid) {
        if (isset($groups[$groupid])) {
            $templatedata['ungroupedgroups'][] = local_groupimport_build_group_template_data($course->id, $groups[$groupid], $users);
        }
    }

    $templatedata['hasgroupstructure'] = !empty($templatedata['groupings']) || !empty($templatedata['ungroupedgroups']);

    return $templatedata;
}

/**
 * Return the user identification fields enabled in plugin settings.
 *
 * @return array
 */
function local_groupimport_get_allowed_user_field_definitions(): array {
    global $DB;

    $definitions = [
        'username' => get_string('username'),
        'email' => get_string('email'),
        'idnumber' => get_string('idnumber'),
    ];

    $customfields = $DB->get_records('user_info_field', null, 'name ASC');
    foreach ($customfields as $field) {
        $definitions['profile_field_' . $field->shortname] = format_string($field->name);
    }

    $config = get_config('local_groupimport');
    $allowed = !empty($config->alloweduserfields)
        ? array_map('trim', explode(',', $config->alloweduserfields))
        : ['username', 'email'];

    $result = [];
    foreach ($allowed as $fieldkey) {
        if (isset($definitions[$fieldkey])) {
            $result[$fieldkey] = $definitions[$fieldkey];
        }
    }

    return $result;
}

/**
 * Enrich users with the copyable field values allowed by plugin settings.
 *
 * @param array $users User records.
 * @param array $alloweduserfields Allowed fields.
 * @return array
 */
function local_groupimport_enrich_users_with_copy_fields(array $users, array $alloweduserfields): array {
    global $DB;

    if (empty($users) || empty($alloweduserfields)) {
        return $users;
    }

    $customshortnames = [];
    foreach (array_keys($alloweduserfields) as $fieldkey) {
        if (strpos($fieldkey, 'profile_field_') === 0) {
            $customshortnames[] = substr($fieldkey, strlen('profile_field_'));
        }
    }

    $customvalues = [];
    if (!empty($customshortnames)) {
        [$usersql, $userparams] = $DB->get_in_or_equal(array_keys($users), SQL_PARAMS_NAMED);
        [$fieldsql, $fieldparams] = $DB->get_in_or_equal($customshortnames, SQL_PARAMS_NAMED, 'field');
        $records = $DB->get_records_sql(
            "SELECT d.userid, f.shortname, d.data
               FROM {user_info_data} d
               JOIN {user_info_field} f ON f.id = d.fieldid
              WHERE d.userid $usersql
                AND f.shortname $fieldsql",
            $userparams + $fieldparams
        );

        foreach ($records as $record) {
            $customvalues[(int)$record->userid]['profile_field_' . $record->shortname] = (string)$record->data;
        }
    }

    foreach ($users as $userid => $user) {
        $copyfields = [];
        foreach ($alloweduserfields as $fieldkey => $label) {
            if (strpos($fieldkey, 'profile_field_') === 0) {
                $value = $customvalues[(int)$userid][$fieldkey] ?? '';
            } else {
                $value = isset($user[$fieldkey]) ? (string)$user[$fieldkey] : '';
            }

            $copyfields[] = [
                'key' => $fieldkey,
                'label' => $label,
                'value' => $value,
            ];
        }
        $users[$userid]['copyfields'] = $copyfields;
    }

    return $users;
}

/**
 * Build select options for Mustache.
 *
 * @param array $options Key => label.
 * @return array
 */
function local_groupimport_build_select_options(array $options): array {
    $result = [];
    foreach ($options as $value => $label) {
        $result[] = [
            'value' => $value,
            'label' => $label,
        ];
    }
    return $result;
}

/**
 * Build participant meta tag data.
 *
 * @param string $label Label.
 * @param array $items Tag items.
 * @param string $class CSS classes.
 * @param string $empty Empty label.
 * @return array
 */
function local_groupimport_build_meta_tags_template_data(string $label, array $items, string $class, string $empty): array {
    $visiblemax = 3;
    $tokens = [];

    if (empty($items)) {
        $tokens[] = [
            'label' => $empty,
            'class' => $class . ' local-groupimport-easystud-token--empty',
            'hidden' => false,
        ];
    } else {
        foreach ($items as $index => $item) {
            $tokens[] = [
                'label' => $item,
                'class' => $class,
                'hidden' => $index >= $visiblemax,
                'extra' => $index >= $visiblemax,
            ];
        }
    }

    return [
        'label' => $label,
        'tokens' => $tokens,
        'hasmore' => count($items) > $visiblemax,
        'showless' => get_string('showless', 'local_groupimport'),
    ];
}

/**
 * Build grouping template data.
 *
 * @param int $courseid Course id.
 * @param array $grouping Grouping data.
 * @param array $groups Group data.
 * @param array $users User data.
 * @return array
 */
function local_groupimport_build_grouping_template_data(int $courseid, array $grouping, array $groups, array $users): array {
    $result = [
        'id' => $grouping['id'],
        'name' => $grouping['name'],
        'countlabel' => get_string('groupscount', 'local_groupimport', $grouping['groupcount']),
        'counttemplate' => get_string('groupscount', 'local_groupimport', '__count__'),
        'sesskey' => sesskey(),
        'renameurl' => (new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]))->out(false),
        'renameaction' => 'renamegrouping',
        'renameidname' => 'groupingid',
        'rawname' => $grouping['rawname'],
        'renamelabel' => get_string('rename', 'local_groupimport'),
        'savelabel' => get_string('save'),
        'addgroupslabel' => get_string('addgroupstogrouping', 'local_groupimport'),
        'pastegroupsplaceholder' => get_string('pastegroupsplaceholder', 'local_groupimport'),
        'addgroupsbutton' => get_string('addgroups', 'local_groupimport'),
        'groups' => [],
    ];

    foreach ($grouping['groupids'] as $groupid) {
        if (isset($groups[$groupid])) {
            $result['groups'][] = local_groupimport_build_group_template_data($courseid, $groups[$groupid], $users, true);
        }
    }

    return $result;
}

/**
 * Build group template data.
 *
 * @param int $courseid Course id.
 * @param array $group Group data.
 * @param array $users User data.
 * @param bool $withingrouping True when the group is rendered inside a grouping.
 * @return array
 */
function local_groupimport_build_group_template_data(int $courseid, array $group, array $users, bool $withingrouping = false): array {
    $result = [
        'id' => $group['id'],
        'name' => $group['name'],
        'membercountlabel' => get_string('memberscount', 'local_groupimport', $group['membercount']),
        'sesskey' => sesskey(),
        'renameurl' => (new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]))->out(false),
        'renameaction' => 'renamegroup',
        'renameidname' => 'groupid',
        'rawname' => $group['rawname'],
        'renamelabel' => get_string('rename', 'local_groupimport'),
        'savelabel' => get_string('save'),
        'addemailstolabel' => get_string('addemailstogroup', 'local_groupimport'),
        'pasteemailsplaceholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
        'addemailsbutton' => get_string('addemails', 'local_groupimport'),
        'withingrouping' => $withingrouping,
        'removefromgroupinglabel' => get_string('removegroupfromgrouping', 'local_groupimport'),
        'members' => [],
        'hasmembers' => !empty($group['memberids']),
        'nomemberslabel' => get_string('nogroupmembers', 'local_groupimport'),
    ];

    foreach ($group['memberids'] as $userid) {
        if (isset($users[$userid])) {
            $result['members'][] = [
                'groupid' => $group['id'],
                'userid' => $users[$userid]['id'],
                'fullname' => $users[$userid]['fullname'],
                'removeuserlabel' => get_string('removeuserfromgroup', 'local_groupimport', $users[$userid]['fullname']),
                'selectableid' => $group['id'] . ':' . $users[$userid]['id'],
            ];
        }
    }

    return $result;
}

/**
 * Build context menu action data for Mustache.
 *
 * @param array $alloweduserfields Allowed configured fields.
 * @return array
 */
function local_groupimport_build_context_actions_template_data(array $alloweduserfields = []): array {
    $actions = [
        'participant-open-details' => [
            'contexts' => 'participant',
            'icon' => 'fa-eye',
            'label' => get_string('viewparticipantdetails', 'local_groupimport'),
        ],
        'clear-selection' => [
            'contexts' => 'participant',
            'icon' => 'fa-times-circle',
            'label' => get_string('contextclearselection', 'local_groupimport'),
        ],
        'group-paste-emails' => [
            'contexts' => 'group',
            'icon' => 'fa-envelope-open-text',
            'label' => get_string('contextaddemails', 'local_groupimport'),
        ],
        'group-focus-rename' => [
            'contexts' => 'group',
            'icon' => 'fa-pen',
            'label' => get_string('contextfocusrename', 'local_groupimport'),
        ],
        'copy-group-name' => [
            'contexts' => 'group',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopygroupname', 'local_groupimport'),
        ],
        'grouping-paste-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-layer-group',
            'label' => get_string('contextaddgroups', 'local_groupimport'),
        ],
        'grouping-focus-rename' => [
            'contexts' => 'grouping',
            'icon' => 'fa-pen',
            'label' => get_string('contextfocusrenamegrouping', 'local_groupimport'),
        ],
        'copy-grouping-name' => [
            'contexts' => 'grouping',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopygroupingname', 'local_groupimport'),
        ],
        'remove-member' => [
            'contexts' => 'member',
            'icon' => 'fa-user-minus',
            'label' => get_string('contextremovemember', 'local_groupimport'),
        ],
        'copy-member-name' => [
            'contexts' => 'member',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopymembername', 'local_groupimport'),
        ],
    ];

    $result = [];
    foreach ($alloweduserfields as $fieldkey => $fieldlabel) {
        $result[] = [
            'action' => 'copy-participant-field',
            'contexts' => 'participant',
            'icon' => $fieldkey === 'email' ? 'fa-at' : 'fa-copy',
            'label' => get_string('contextcopyfield', 'local_groupimport', $fieldlabel),
            'fieldkey' => $fieldkey,
        ];
    }

    foreach ($actions as $action => $definition) {
        $result[] = [
            'action' => $action,
            'contexts' => $definition['contexts'],
            'icon' => $definition['icon'],
            'label' => $definition['label'],
            'fieldkey' => '',
        ];
    }

    return $result;
}

/**
 * Render create group and grouping forms.
 *
 * @param int $courseid Course id.
 * @return string
 */
function local_groupimport_render_quick_create_forms(int $courseid): string {
    $url = new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]);
    $groupform = html_writer::start_tag('form', [
            'method' => 'post',
            'action' => $url->out(false),
            'class' => 'local-groupimport-easystud-create',
        ]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'action', 'value' => 'creategroup']) .
        html_writer::empty_tag('input', [
            'type' => 'text',
            'name' => 'groupname',
            'class' => 'form-control',
            'placeholder' => get_string('newgroupplaceholder', 'local_groupimport'),
        ]) .
        html_writer::tag('button',
            html_writer::span('', 'fa fa-plus', ['aria-hidden' => 'true']),
            [
            'type' => 'submit',
            'class' => 'btn btn-primary local-groupimport-easystud-icon-button',
            'aria-label' => get_string('creategroup', 'local_groupimport'),
            'title' => get_string('creategroup', 'local_groupimport'),
            ]
        ) .
        html_writer::end_tag('form');

    $groupingform = html_writer::start_tag('form', [
            'method' => 'post',
            'action' => $url->out(false),
            'class' => 'local-groupimport-easystud-create',
        ]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'action', 'value' => 'creategrouping']) .
        html_writer::empty_tag('input', [
            'type' => 'text',
            'name' => 'groupingname',
            'class' => 'form-control',
            'placeholder' => get_string('newgroupingplaceholder', 'local_groupimport'),
        ]) .
        html_writer::tag('button',
            html_writer::span('', 'fa fa-plus', ['aria-hidden' => 'true']),
            [
            'type' => 'submit',
            'class' => 'btn btn-outline-primary local-groupimport-easystud-icon-button',
            'aria-label' => get_string('creategrouping', 'local_groupimport'),
            'title' => get_string('creategrouping', 'local_groupimport'),
            ]
        ) .
        html_writer::end_tag('form');

    return html_writer::div($groupform . $groupingform, 'local-groupimport-easystud-create-row');
}

/**
 * Render a grouping tree item.
 *
 * @param int $courseid Course id.
 * @param array $grouping Grouping.
 * @param array $groups Groups.
 * @param array $users Users.
 * @return string
 */
function local_groupimport_render_grouping(int $courseid, array $grouping, array $groups, array $users): string {
    $out = html_writer::start_div('local-groupimport-easystud-tree__section', [
        'data-easystud-grouping-id' => $grouping['id'],
        'data-easystud-grouping-drop' => $grouping['id'],
        'data-selectable-type' => 'grouping',
        'data-selectable-id' => $grouping['id'],
    ]);
    $out .= html_writer::start_div('local-groupimport-easystud-grouping__header');
    $out .= html_writer::tag('button',
        html_writer::span('', 'fa fa-chevron-down', ['aria-hidden' => 'true']) .
            html_writer::span(s($grouping['name']), 'local-groupimport-easystud-grouping__name') .
            html_writer::span(
                get_string('groupscount', 'local_groupimport', $grouping['groupcount']),
                'badge bg-secondary text-white',
                ['data-count-template' => get_string('groupscount', 'local_groupimport', '__count__')]
            ),
        [
            'type' => 'button',
            'class' => 'local-groupimport-easystud-tree__toggle',
            'data-easystud-collapse-toggle' => '1',
            'aria-expanded' => 'true',
        ]
    );
    $out .= html_writer::tag('button',
        html_writer::span('', 'fa fa-layer-group', ['aria-hidden' => 'true']),
        [
            'type' => 'button',
            'class' => 'btn btn-link p-0 local-groupimport-easystud-group__mail-button',
            'data-easystud-toggle-grouping-groups' => $grouping['id'],
            'aria-label' => get_string('addgroupstogrouping', 'local_groupimport'),
            'title' => get_string('addgroupstogrouping', 'local_groupimport'),
        ]
    );
    $out .= html_writer::end_div();
    $out .= local_groupimport_render_inline_rename_form(
        $courseid,
        'renamegrouping',
        'groupingid',
        $grouping['id'],
        $grouping['rawname']
    );
    $out .= local_groupimport_render_grouping_groups_panel($grouping['id']);
    $out .= html_writer::start_div('local-groupimport-easystud-tree__children');
    foreach ($grouping['groupids'] as $groupid) {
        if (isset($groups[$groupid])) {
            $out .= local_groupimport_render_group($courseid, $groups[$groupid], $users);
        }
    }
    $out .= html_writer::end_div();
    $out .= html_writer::end_div();

    return $out;
}

/**
 * Render a hidden group paste panel for a grouping.
 *
 * @param int $groupingid Grouping id.
 * @return string
 */
function local_groupimport_render_grouping_groups_panel(int $groupingid): string {
    return html_writer::start_div('local-groupimport-easystud-group-email', [
            'data-easystud-grouping-groups-panel' => $groupingid,
            'hidden' => 'hidden',
        ]) .
        html_writer::tag('textarea', '', [
            'class' => 'form-control form-control-sm',
            'rows' => 3,
            'placeholder' => get_string('pastegroupsplaceholder', 'local_groupimport'),
            'data-easystud-grouping-groups-box' => $groupingid,
        ]) .
        html_writer::tag('button',
            html_writer::span('', 'fa fa-plus me-1', ['aria-hidden' => 'true']) .
            html_writer::span(get_string('addgroups', 'local_groupimport')),
            [
                'type' => 'button',
                'class' => 'btn btn-sm btn-outline-primary mt-2',
                'data-easystud-add-grouping-groups' => $groupingid,
            ]
        ) .
        html_writer::div('', 'local-groupimport-easystud-group-email__result', [
            'data-easystud-grouping-groups-result' => $groupingid,
            'aria-live' => 'polite',
        ]) .
        html_writer::end_div();
}

/**
 * Render a group tree item.
 *
 * @param int $courseid Course id.
 * @param array $group Group.
 * @param array $users Users.
 * @return string
 */
function local_groupimport_render_group(int $courseid, array $group, array $users): string {
    $out = html_writer::start_div('local-groupimport-easystud-group', [
        'data-easystud-group-id' => $group['id'],
        'data-easystud-user-drop' => $group['id'],
        'data-selectable-type' => 'group',
        'data-selectable-id' => $group['id'],
        'draggable' => 'true',
    ]);
    $out .= html_writer::tag('div',
        html_writer::span('', 'fa fa-users local-groupimport-easystud-drag-indicator', ['aria-hidden' => 'true']) .
            html_writer::span(s($group['name']), 'local-groupimport-easystud-group__name') .
            html_writer::span(
                get_string('memberscount', 'local_groupimport', $group['membercount']),
                'badge bg-light text-dark'
            ) .
            html_writer::tag('button',
                html_writer::span('', 'fa fa-at', ['aria-hidden' => 'true']),
                [
                    'type' => 'button',
                    'class' => 'btn btn-link p-0 local-groupimport-easystud-group__mail-button',
                    'data-easystud-toggle-group-email' => $group['id'],
                    'aria-label' => get_string('addemailstogroup', 'local_groupimport'),
                    'title' => get_string('addemailstogroup', 'local_groupimport'),
                ]
            ),
        ['class' => 'local-groupimport-easystud-group__header']
    );
    $out .= local_groupimport_render_inline_rename_form(
        $courseid,
        'renamegroup',
        'groupid',
        $group['id'],
        $group['rawname']
    );
    $out .= html_writer::start_tag('ul', [
        'class' => 'local-groupimport-easystud-group__members',
        'data-easystud-group-members' => $group['id'],
    ]);
    foreach ($group['memberids'] as $userid) {
        if (isset($users[$userid])) {
            $out .= local_groupimport_render_group_member($group['id'], $users[$userid]);
        }
    }
    if (empty($group['memberids'])) {
        $out .= html_writer::tag('li', get_string('nogroupmembers', 'local_groupimport'), ['class' => 'text-muted']);
    }
    $out .= html_writer::end_tag('ul');
    $out .= local_groupimport_render_group_email_panel($group['id']);
    $out .= html_writer::end_div();

    return $out;
}

/**
 * Render a group member row.
 *
 * @param int $groupid Group id.
 * @param array $user User data.
 * @return string
 */
function local_groupimport_render_group_member(int $groupid, array $user): string {
    return html_writer::tag('li',
        html_writer::span(s($user['fullname']), 'local-groupimport-easystud-member__name') .
        html_writer::tag('button',
            html_writer::span('&times;', '', ['aria-hidden' => 'true']),
            [
                'type' => 'button',
                'class' => 'btn btn-link p-0 local-groupimport-easystud-member__remove',
                'data-easystud-remove-member' => '1',
                'data-group-id' => $groupid,
                'data-user-id' => $user['id'],
                'aria-label' => get_string('removeuserfromgroup', 'local_groupimport', $user['fullname']),
                'title' => get_string('removeuserfromgroup', 'local_groupimport', $user['fullname']),
            ]
        ),
        [
            'class' => 'local-groupimport-easystud-member',
            'data-easystud-member-id' => $user['id'],
            'data-member-key' => $groupid . ':' . $user['id'],
            'data-selectable-type' => 'member',
            'data-selectable-id' => $groupid . ':' . $user['id'],
        ]
    );
}

/**
 * Render a hidden email paste panel for a group.
 *
 * @param int $groupid Group id.
 * @return string
 */
function local_groupimport_render_group_email_panel(int $groupid): string {
    return html_writer::start_div('local-groupimport-easystud-group-email', [
            'data-easystud-group-email-panel' => $groupid,
            'hidden' => 'hidden',
        ]) .
        html_writer::tag('textarea', '', [
            'class' => 'form-control form-control-sm',
            'rows' => 3,
            'placeholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
            'data-easystud-group-email-box' => $groupid,
        ]) .
        html_writer::tag('button',
            html_writer::span('', 'fa fa-plus me-1', ['aria-hidden' => 'true']) .
            html_writer::span(get_string('addemails', 'local_groupimport')),
            [
                'type' => 'button',
                'class' => 'btn btn-sm btn-primary mt-2',
                'data-easystud-add-group-emails' => $groupid,
            ]
        ) .
        html_writer::div('', 'local-groupimport-easystud-group-email__result', [
            'data-easystud-group-email-result' => $groupid,
            'aria-live' => 'polite',
        ]) .
        html_writer::end_div();
}

/**
 * Render the optional clipboard validation modal.
 *
 * @return string
 */
function local_groupimport_render_clipboard_modal(): string {
    $content = html_writer::tag('p', get_string('clipboardtools_desc', 'local_groupimport'), ['class' => 'text-muted']) .
        html_writer::tag('textarea', '', [
            'class' => 'form-control',
            'rows' => 6,
            'placeholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
            'data-easystud-paste-box' => '1',
        ]) .
        html_writer::div('', 'local-groupimport-easystud__paste-results', [
            'data-easystud-paste-results' => '1',
            'aria-live' => 'polite',
        ]);

    return html_writer::start_div('local-groupimport-easystud-modal', [
            'data-easystud-clipboard-modal' => '1',
            'hidden' => 'hidden',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-easystud-clipboard-title',
        ]) .
        html_writer::start_div('local-groupimport-easystud-modal__dialog') .
        html_writer::start_div('local-groupimport-easystud-modal__header') .
        html_writer::tag('h3', get_string('clipboardtools', 'local_groupimport'), [
            'id' => 'local-groupimport-easystud-clipboard-title',
            'class' => 'h5 mb-0',
        ]) .
        html_writer::tag('button',
            html_writer::span('&times;', '', ['aria-hidden' => 'true']),
            [
                'type' => 'button',
                'class' => 'btn btn-link p-0 local-groupimport-easystud-modal__close',
                'data-easystud-close-clipboard' => '1',
                'aria-label' => get_string('closebuttontitle'),
            ]
        ) .
        html_writer::end_div() .
        html_writer::div($content, 'local-groupimport-easystud-modal__body') .
        html_writer::end_div() .
        html_writer::end_div();
}

/**
 * Render the participant details modal.
 *
 * @return string
 */
function local_groupimport_render_participant_modal(): string {
    return html_writer::start_div('local-groupimport-easystud-modal', [
            'data-easystud-user-modal' => '1',
            'hidden' => 'hidden',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-easystud-user-title',
        ]) .
        html_writer::start_div('local-groupimport-easystud-modal__dialog local-groupimport-easystud-modal__dialog--user') .
        html_writer::start_div('local-groupimport-easystud-modal__header') .
        html_writer::tag('h3', get_string('participantdetails', 'local_groupimport'), [
            'id' => 'local-groupimport-easystud-user-title',
            'class' => 'h5 mb-0',
        ]) .
        html_writer::tag('button',
            html_writer::span('&times;', '', ['aria-hidden' => 'true']),
            [
                'type' => 'button',
                'class' => 'btn btn-link p-0 local-groupimport-easystud-modal__close',
                'data-easystud-close-user-modal' => '1',
                'aria-label' => get_string('closebuttontitle'),
            ]
        ) .
        html_writer::end_div() .
        html_writer::div('', 'local-groupimport-easystud-modal__body', [
            'data-easystud-user-modal-body' => '1',
        ]) .
        html_writer::end_div() .
        html_writer::end_div();
}

/**
 * Render the right-click context menu.
 *
 * @return string
 */
function local_groupimport_render_context_menu(): string {
    $actions = [
        'copy-email' => [
            'contexts' => 'participant',
            'icon' => 'fa-at',
            'label' => get_string('contextcopyemail', 'local_groupimport'),
        ],
        'participant-open-details' => [
            'contexts' => 'participant',
            'icon' => 'fa-eye',
            'label' => get_string('viewparticipantdetails', 'local_groupimport'),
        ],
        'copy-selected-emails' => [
            'contexts' => 'participant',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopyselectedemails', 'local_groupimport'),
        ],
        'clear-selection' => [
            'contexts' => 'participant',
            'icon' => 'fa-times-circle',
            'label' => get_string('contextclearselection', 'local_groupimport'),
        ],
        'group-paste-emails' => [
            'contexts' => 'group',
            'icon' => 'fa-envelope-open-text',
            'label' => get_string('contextaddemails', 'local_groupimport'),
        ],
        'group-focus-rename' => [
            'contexts' => 'group',
            'icon' => 'fa-pen',
            'label' => get_string('contextfocusrename', 'local_groupimport'),
        ],
        'copy-group-name' => [
            'contexts' => 'group',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopygroupname', 'local_groupimport'),
        ],
        'grouping-paste-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-layer-group',
            'label' => get_string('contextaddgroups', 'local_groupimport'),
        ],
        'grouping-focus-rename' => [
            'contexts' => 'grouping',
            'icon' => 'fa-pen',
            'label' => get_string('contextfocusrenamegrouping', 'local_groupimport'),
        ],
        'copy-grouping-name' => [
            'contexts' => 'grouping',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopygroupingname', 'local_groupimport'),
        ],
        'remove-member' => [
            'contexts' => 'member',
            'icon' => 'fa-user-minus',
            'label' => get_string('contextremovemember', 'local_groupimport'),
        ],
        'copy-member-name' => [
            'contexts' => 'member',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopymembername', 'local_groupimport'),
        ],
    ];

    $out = html_writer::start_div('local-groupimport-easystud-context-menu', [
        'data-easystud-context-menu' => '1',
        'hidden' => 'hidden',
        'role' => 'menu',
    ]);
    foreach ($actions as $action => $definition) {
        $out .= html_writer::tag('button',
            html_writer::span('', 'fa ' . $definition['icon'], ['aria-hidden' => 'true']) .
                html_writer::span($definition['label']),
            [
                'type' => 'button',
                'data-easystud-context-action' => $action,
                'data-easystud-contexts' => $definition['contexts'],
                'role' => 'menuitem',
            ]
        );
    }
    $out .= html_writer::end_div();

    return $out;
}

/**
 * Render a small inline rename form.
 *
 * @param int $courseid Course id.
 * @param string $action Action.
 * @param string $idname Id parameter name.
 * @param int $id Item id.
 * @param string $value Current value.
 * @return string
 */
function local_groupimport_render_inline_rename_form(
    int $courseid,
    string $action,
    string $idname,
    int $id,
    string $value
): string {
    $url = new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]);
    return html_writer::start_tag('form', [
            'method' => 'post',
            'action' => $url->out(false),
            'class' => 'local-groupimport-easystud-rename',
        ]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'action', 'value' => $action]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => $idname, 'value' => $id]) .
        html_writer::empty_tag('input', [
            'type' => 'text',
            'name' => 'name',
            'class' => 'form-control form-control-sm',
            'value' => s($value),
            'aria-label' => get_string('rename', 'local_groupimport'),
        ]) .
        html_writer::tag('button', get_string('save'), ['type' => 'submit', 'class' => 'btn btn-sm btn-outline-secondary']) .
        html_writer::end_tag('form');
}

/**
 * Render a labelled list of participant tags with overflow toggle.
 *
 * @param string $label Section label.
 * @param array $items Items.
 * @param string $class Token CSS class.
 * @param string $empty Empty-state label.
 * @return string
 */
function local_groupimport_render_meta_tags(string $label, array $items, string $class, string $empty): string {
    $visiblemax = 3;
    $out = html_writer::start_div('local-groupimport-easystud-user__meta-group');
    $out .= html_writer::tag('span', s($label), ['class' => 'local-groupimport-easystud-user__meta-label']);
    $out .= html_writer::start_div('local-groupimport-easystud-user__meta-tags');

    if (empty($items)) {
        $out .= html_writer::tag('span', s($empty), ['class' => $class . ' local-groupimport-easystud-token--empty']);
    } else {
        foreach ($items as $index => $item) {
            $attributes = ['class' => $class];
            if ($index >= $visiblemax) {
                $attributes['hidden'] = 'hidden';
                $attributes['data-easystud-extra-tag'] = '1';
            }
            $out .= html_writer::tag('span', s($item), $attributes);
        }

        if (count($items) > $visiblemax) {
            $out .= html_writer::tag('button', '…', [
                'type' => 'button',
                'class' => 'btn btn-link p-0 local-groupimport-easystud-tags-toggle',
                'data-easystud-toggle-tags' => '1',
                'data-more-label' => '…',
                'data-less-label' => get_string('showless', 'local_groupimport'),
            ]);
        }
    }

    $out .= html_writer::end_div();
    $out .= html_writer::end_div();

    return $out;
}
