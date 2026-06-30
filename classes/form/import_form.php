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

namespace local_groupimport\form;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->libdir . '/formslib.php');

/**
 * Import form for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class import_form extends \moodleform {

    /**
     * Defines the form elements.
     *
     * @return void
     */
    public function definition(): void {
        $mform = $this->_form;

        // Retrieve the course id passed via customdata.
        $courseid = (int)($this->_customdata['courseid'] ?? 0);

        // Hidden field to return the course id on submit.
        $mform->addElement('hidden', 'id', $courseid);
        $mform->setType('id', PARAM_INT);

        // Import file.
        $mform->addElement(
            'filepicker',
            'importfile',
            get_string('importfile', 'local_groupimport'),
            null,
            ['accepted_types' => ['.csv', '.xls', '.xlsx']]
        );
        $mform->addRule('importfile', null, 'required', null, 'client');

        $submitlabel = $this->_customdata['submitlabel'] ?? get_string('previewimport', 'local_groupimport');

        // Submit button. The import is only executed after the preview confirmation.
        $this->add_action_buttons(false, $submitlabel);
    }
}
