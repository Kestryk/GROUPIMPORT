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

namespace local_groupimport;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/../lib.php');

/**
 * Tests for legacy-safe EasyStud feature configuration.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class lib_test extends \advanced_testcase {

    /**
     * A missing feature flag must preserve the historical import-only flow.
     *
     * @return void
     */
    public function test_missing_feature_flag_keeps_simplified_view_disabled(): void {
        $this->resetAfterTest();

        unset_config('enablesimplifiedview', 'local_groupimport');
        set_config('defaultuserfield', 'username', 'local_groupimport');

        $this->assertFalse(local_groupimport_is_simplified_view_enabled());
    }

    /**
     * The simplified manager follows the explicit administrator setting.
     *
     * @return void
     */
    public function test_explicit_feature_flag_controls_simplified_view(): void {
        $this->resetAfterTest();

        set_config('enablesimplifiedview', 1, 'local_groupimport');
        $this->assertTrue(local_groupimport_is_simplified_view_enabled());

        set_config('enablesimplifiedview', 0, 'local_groupimport');
        $this->assertFalse(local_groupimport_is_simplified_view_enabled());
    }
}
