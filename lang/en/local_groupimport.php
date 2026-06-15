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
 * English language strings for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['addemails'] = 'Add emails';
$string['addemailstogroup'] = 'Add students by email';
$string['addgroups'] = 'Add groups';
$string['addgroupstogrouping'] = 'Add groups to this grouping';
$string['ajaxactionfailed'] = 'The requested action could not be completed.';
$string['allgroups'] = 'All groups';
$string['alloweduserfields'] = 'User fields allowed for identification';
$string['alloweduserfields_desc'] = 'Select which user fields can be used to identify learners in CSV import files (username, email, idnumber or any custom profile fields).';
$string['allroles'] = 'All roles';
$string['backtocourse'] = 'Back to course';
$string['clipboardtools'] = 'Clipboard tools';
$string['clipboardtools_desc'] = 'Paste email addresses to check which ones match enrolled course participants. Unrecognised addresses are highlighted in red.';
$string['compactparticipants'] = 'Compact list';
$string['contextaddemails'] = 'Add emails to this group';
$string['contextaddgroups'] = 'Add groups to this grouping';
$string['contextclearselection'] = 'Clear selection';
$string['contextcopyemail'] = 'Copy email';
$string['contextcopyfield'] = 'Copy {$a}';
$string['contextcopygroupingname'] = 'Copy grouping name';
$string['contextcopygroupname'] = 'Copy group name';
$string['contextcopymembername'] = 'Copy student name';
$string['contextcopyselectedemails'] = 'Copy selected emails';
$string['contextfocusrename'] = 'Rename this group';
$string['contextfocusrenamegrouping'] = 'Rename this grouping';
$string['contextremovemember'] = 'Remove from group';
$string['creategroup'] = 'Create group';
$string['creategrouping'] = 'Create grouping';
$string['deletemembersselection'] = 'Remove selected members';
$string['deletegroupingsselection'] = 'Delete selected groupings';
$string['deletegroupsselection'] = 'Delete selected groups';
$string['deleteconfirmationtitle'] = 'Confirm deletion';
$string['detailcity'] = 'City';
$string['detailcountry'] = 'Country';
$string['detaildepartment'] = 'Department';
$string['detailidnumber'] = 'ID number';
$string['detailinstitution'] = 'Institution';
$string['detaillanguage'] = 'Language';
$string['detailusername'] = 'Username';
$string['draghintparticipant'] = 'Drag or copy';
$string['csvempty'] = 'The CSV file is empty.';
$string['csvemptyfiledetail'] = 'Empty file';
$string['csvimportlink'] = 'CSV import';
$string['csvinvalidrowmissing'] = 'Invalid line: missing useridentifier or groupname.';
$string['csvloaderror'] = 'Error while reading the CSV file: {$a}';
$string['csvmissingcolumns'] = 'The CSV is missing one or more required columns: useridentifier, groupname (and optionally groupingname).';
$string['defaultuserfield'] = 'Default user identification field';
$string['defaultuserfield_desc'] = 'This field will be pre-selected in the import form. It must be one of the allowed fields defined above.';
$string['downloadtemplate'] = 'Download CSV template';
$string['easystudlabel'] = 'EasyStud';
$string['easystudmanager'] = 'Simplified student management';
$string['easystudmanager_desc'] = 'Manage enrolled course participants, groups and groupings from a single interactive view. Teachers can organise existing course users without enrolling new users.';
$string['emailsprocessed'] = '{} email matches processed.';
$string['errorheader'] = 'Lines with errors';
$string['groupcreated'] = 'Group created.';
$string['groupcreatefailed'] = 'Unable to create group \'{$a->groupname}\' for user \'{$a->identifier}\'.';
$string['groupimport'] = 'Group import (CSV)';
$string['groupingcreated'] = 'Grouping created.';
$string['groupingcreatefailed'] = 'Unable to create grouping \'{$a->groupingname}\' for group \'{$a->groupname}\'.';
$string['groupingsaved'] = 'Grouping saved.';
$string['groupingsdeleted'] = '{} groupings deleted.';
$string['groupsprocessed'] = '{} groups matched and moved.';
$string['groupmovedtogrouping'] = 'Group moved to grouping "{$a}".';
$string['groupremovedfromgroupings'] = 'Group removed from groupings.';
$string['groupsaved'] = 'Group saved.';
$string['groupsdeleted'] = '{} groups deleted.';
$string['groupscount'] = '{$a} group(s)';
$string['groupslabel'] = 'Groups';
$string['groupstructure'] = 'Groupings, groups and students';
$string['groupstructuresummary'] = '{$a->groupings} grouping(s), {$a->groups} group(s)';
$string['groupswithoutgrouping'] = 'Groups without grouping';
$string['confirmdeletegroups'] = 'Some selected groups still contain students. Confirm deletion?';
$string['confirmdeletegroupings'] = 'Some selected groupings still contain groups. Confirm deletion?';
$string['importfile'] = 'Import file (CSV)';
$string['importfile_help'] = 'Upload a CSV file with the columns: useridentifier;groupname;groupingname (groupingname is optional). The separator may be ";" or ",". The "useridentifier" column is interpreted according to the user identification field chosen in the import form (username, email, idnumber or a custom profile field).';
$string['importresults'] = 'Import results';
$string['importsummary'] = 'Import summary';
$string['memberscount'] = '{$a} member(s)';
$string['membersremoved'] = '{} members removed from their groups.';
$string['nativeparticipants'] = 'Native participants view';
$string['newgroupingplaceholder'] = 'New grouping name';
$string['newgroupplaceholder'] = 'New group name';
$string['nogroup'] = 'No group';
$string['nogroupmembers'] = 'No students in this group yet.';
$string['nogroupstructurestate'] = 'No groups or groupings are available in this course yet.';
$string['noresults'] = 'No results to display yet. Upload a CSV file to begin the import.';
$string['noparticipantsstate'] = 'No enrolled participants are available for the current view.';
$string['norole'] = 'No role';
$string['participants'] = 'Participants';
$string['participantscount'] = '{$a} participant(s)';
$string['participantdetails'] = 'Participant details';
$string['opennativeprofile'] = 'Open native Moodle profile';
$string['pasteemailsplaceholder'] = 'Example email: name@example.com';
$string['pastegroupsplaceholder'] = 'Paste group names or group IDs here...';
$string['pluginname'] = 'Group import (CSV)';
$string['privacy:metadata'] = 'The Local Group Import plugin does not store any personal data. It only processes existing course enrolment information.';
$string['removeuserfromgroup'] = 'Remove {} from this group';
$string['removegroupfromgrouping'] = 'Remove this group from its grouping';
$string['removefromcoursefuture'] = 'Future course removal';
$string['rename'] = 'Rename';
$string['roleslabel'] = 'Roles';
$string['searchparticipants'] = 'Search name, email, role or group';
$string['showless'] = 'less';
$string['confirm'] = 'Confirm';
$string['submitimport'] = 'Run import';
$string['successheader'] = 'Successfully processed lines';
$string['templatename'] = 'groupimport_template.csv';
$string['tour_groupimport_coursehome_desc'] = 'On the course home page, shows where to find the group import entry.';
$string['tour_groupimport_coursehome_name'] = 'Tip: Find Group import in the More menu';
$string['tour_groupimport_coursehome_step1_content'] = 'In the navigation at the top of the course, open the "More" menu. You will find "Group import" there to access the tool.';
$string['tour_groupimport_coursehome_step1_title'] = 'Where is Group import?';
$string['tour_groupimport_step1_content'] = 'This page allows you to create groups and enrol students from a CSV file. Users who do not exist or are not enrolled in the course will not be added, and the import continues even if errors occur.';
$string['tour_groupimport_step1_title'] = 'Import groups from a CSV';
$string['tour_groupimport_step2_content'] = 'Start by downloading the template to ensure the expected columns are respected (useridentifier, groupname and optionally groupingname).';
$string['tour_groupimport_step2_title'] = 'Download the CSV template';
$string['tour_groupimport_step3_content'] = 'Then select your CSV file. Both ";" and "," separators are supported.';
$string['tour_groupimport_step3_title'] = 'Upload your CSV file';
$string['tour_groupimport_step4_content'] = 'Choose how users should be identified (username, email, idnumber or a custom profile field).';
$string['tour_groupimport_step4_title'] = 'Choose the identification field';
$string['tour_groupimport_step5_content'] = 'Click the button to start the import. Successful enrolments and errors will be listed in the report.';
$string['tour_groupimport_step5_title'] = 'Start the import';
$string['tour_groupimport_step6_content'] = 'The report details completed enrolments and errors (user not found, not enrolled in the course, already a group member, etc.).';
$string['tour_groupimport_step6_title'] = 'Review the report';
$string['tour_groupimport_teacher_desc'] = 'Guided tour to import groups and enrolments from a CSV file, with checks on user existence and course enrolment.';
$string['tour_groupimport_teacher_name'] = 'Guide: Group import (teachers)';
$string['useraddedtogroup'] = 'User \'{$a->identifier}\' added to group \'{$a->groupname}\'.';
$string['useraddedtogroupwithgrouping'] = 'User \'{$a->identifier}\' added to group \'{$a->groupname}\' (grouping \'{$a->groupingname}\').';
$string['useralreadyingroup'] = 'User \'{$a->identifier}\' is already a member of group \'{$a->groupname}\'.';
$string['userfield'] = 'User identification field';
$string['userfield_help'] = 'This option specifies how the "useridentifier" column of the CSV file should be interpreted, for example as a username, an email address, an ID number, or as the value of a custom profile field.';
$string['usermultiplematches'] = 'Multiple users match \'{$a->identifier}\' for field \'{$a->field}\'.';
$string['usernotenrolled'] = 'User \'{$a}\' is not enrolled in this course.';
$string['usernotfound'] = 'User \'{$a}\' not found.';
$string['userremovedfromgroup'] = 'User removed from the group.';
$string['usersaddedtogroup'] = '{} users added to the group.';
$string['viewparticipantdetails'] = 'View details';
