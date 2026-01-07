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

$plugin->component = 'local_groupimport';
$plugin->version   = 2026010503;      // YYYYMMDDHH (ajout user tour).
$plugin->requires = 2022112800; // Moodle 4.1 minimum
$plugin->maturity  = MATURITY_BETA;
$plugin->release   = '0.1';
$plugin->license = 'GPLv3';