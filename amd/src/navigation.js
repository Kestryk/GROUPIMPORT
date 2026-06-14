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
 * EasyStud navigation integration for Moodle course participant menus.
 *
 * @module     local_groupimport/navigation
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Parse a URL safely.
const parseUrl = value => {
    try {
        return new URL(value, window.location.origin);
    } catch (error) {
        return null;
    }
};

// Check whether the URL is the native participants page for the current course.
const isNativeParticipantsUrl = (url, courseId) => {
    if (!url) {
        return false;
    }
    return url.pathname.endsWith('/user/index.php') &&
        url.searchParams.get('id') === courseId.toString() &&
        url.searchParams.get('local_groupimport_native') !== '1';
};

// Redirect old/native participant entry points to EasyStud unless the native view was explicitly requested.
const redirectNativeParticipantsPage = (courseId, managerUrl) => {
    const current = parseUrl(window.location.href);
    if (isNativeParticipantsUrl(current, courseId)) {
        window.location.replace(managerUrl);
    }
};

// Replace the visible course Participants tab/link with the EasyStud manager URL.
const replaceSecondaryParticipantsLinks = (courseId, managerUrl) => {
    document.querySelectorAll('.secondary-navigation a[href], .moremenu a[href], a[data-key="participants"][href]').forEach(link => {
        const url = parseUrl(link.getAttribute('href'));
        if (isNativeParticipantsUrl(url, courseId)) {
            link.setAttribute('href', managerUrl);
        }
    });
};

// Add EasyStud as the first option in Moodle's participant tertiary menu.
const enhanceParticipantsDropdown = (courseId, managerUrl, nativeParticipantsUrl, managerLabel) => {
    const input = document.querySelector('input[name="participantsnavigation"]');
    if (!input) {
        return;
    }

    const menu = input.closest('.dropdown.select-menu');
    const listbox = menu ? menu.querySelector('[role="listbox"]') : null;
    const firstGroup = listbox ? listbox.querySelector('ul[role="group"]') : null;
    if (!menu || !firstGroup || firstGroup.querySelector('[data-local-groupimport-easystud-option]')) {
        return;
    }

    firstGroup.querySelectorAll('[role="option"][data-value]').forEach(option => {
        const url = parseUrl(option.getAttribute('data-value'));
        if (isNativeParticipantsUrl(url, courseId)) {
            option.setAttribute('data-value', nativeParticipantsUrl);
        }
    });

if (isNativeParticipantsUrl(parseUrl(input.value), courseId)) {
    input.value = nativeParticipantsUrl;
}

    const option = document.createElement('li');
    option.className = 'dropdown-item';
    option.setAttribute('role', 'option');
    option.setAttribute('data-value', managerUrl);
    option.setAttribute('data-local-groupimport-easystud-option', '1');
    option.textContent = managerLabel;
    option.addEventListener('click', event => {
        event.preventDefault();
        window.location.href = managerUrl;
    });

    const groupLabel = firstGroup.querySelector('li[role="presentation"]');
    const insertBeforeNode = groupLabel ? groupLabel.nextSibling : null;
    firstGroup.insertBefore(option, insertBeforeNode);
};

// Navigate when a participant navigation select_menu option is chosen.
const bindParticipantsNavigationSelector = () => {
    document.addEventListener('click', event => {
        const option = event.target.closest('.select-menu [role="option"][data-value]');
        if (!option) {
            return;
        }

        const menu = option.closest('.select-menu');
        const input = menu ? menu.querySelector('input[name="participantsnavigation"]') : null;
        if (!input) {
            return;
        }

        const value = option.getAttribute('data-value');
        if (!value || value === input.value) {
            return;
        }

        event.preventDefault();
        window.location.href = value;
    });
};

// Initialise EasyStud navigation integration.
export const init = (courseId, managerUrl, nativeParticipantsUrl, managerLabel) => {
    redirectNativeParticipantsPage(courseId, managerUrl);

    const enhance = () => {
        replaceSecondaryParticipantsLinks(courseId, managerUrl);
        enhanceParticipantsDropdown(courseId, managerUrl, nativeParticipantsUrl, managerLabel);
    };

    enhance();
    bindParticipantsNavigationSelector();
    window.setTimeout(enhance, 250);
    window.setTimeout(enhance, 1000);
};
