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
 * EasyStud course manager interactions.
 *
 * @module     local_groupimport/course_manager
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const selectedClass = 'is-selected';
const disabledSelectionClass = 'is-selection-disabled';
const draggingClass = 'is-dragging';
const dropTargetClass = 'is-drop-target';
const compactClass = 'local-groupimport-easystud--compact-users';
const hoverPopoverClass = 'local-groupimport-easystud-hover-popover';

const onReady = callback => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, {once: true});
        return;
    }
    callback();
};

// Normalise text for filtering.
const normalise = value => (value || '').toString().toLowerCase();

// Copy text to the clipboard when the browser allows it.
const copyText = text => {
    if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text);
    }
};

const getLabels = root => JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');

const getSelectedParticipantsForContext = (root, target) => {
    const selected = Array.from(root.querySelectorAll('[data-easystud-user].' + selectedClass));
    if (!selected.length) {
        return target ? [target] : [];
    }
    if (!target) {
        return selected;
    }
    return selected.indexOf(target) === -1 ? [target] : selected;
};

const getUserCopyFields = user => {
    if (!user) {
        return [];
    }
    try {
        return JSON.parse(user.getAttribute('data-user-copy-fields') || '[]');
    } catch (error) {
        return [];
    }
};

const getUserCopyFieldValue = (user, fieldkey) => {
    const fields = getUserCopyFields(user);
    const match = fields.find(field => field.key === fieldkey);
    return match && match.value ? match.value : '';
};

const showNotification = (root, message, type) => {
    const container = root.querySelector('[data-easystud-notifications]');
    if (!container || !message) {
        return;
    }

    const note = document.createElement('div');
    note.className = 'alert alert-' + (type || 'success') + ' local-groupimport-easystud__notification';
    note.setAttribute('role', 'status');
    note.textContent = message;
    container.appendChild(note);

    window.setTimeout(() => {
        note.classList.add('is-leaving');
        window.setTimeout(() => note.remove(), 220);
    }, 3200);
};

// Post an EasyStud action.
const postAction = data => {
    const root = document.getElementById('local-groupimport-easystud');
    const labels = root ? JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}') : {};
    const body = new URLSearchParams();
    Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
            value.forEach(item => body.append(key + '[]', item));
            return;
        }
        body.set(key, value);
    });
    body.set('sesskey', M.cfg.sesskey);

    return fetch(M.cfg.wwwroot + '/local/groupimport/ajax.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
    }).then(response => response.json()).then(result => {
        if (!result.success) {
            throw new Error(result.error || labels.ajaxerror || '');
        }
        return result;
    });
};

// Move an existing group element into a grouping section.
const moveGroupElementToGrouping = (root, groupid, groupingid) => {
    const group = root.querySelector('[data-easystud-group-id="' + groupid + '"]');
    const target = root.querySelector('[data-easystud-grouping-drop="' + groupingid + '"]');
    const children = target ? target.querySelector('.local-groupimport-easystud-tree__children') : null;
    if (!group || !children) {
        return;
    }
    const sourceSection = group.closest('[data-easystud-grouping-drop]');
    children.hidden = false;
    group.remove();
    children.appendChild(group);
    [sourceSection, target].forEach(section => {
        const badge = section ? section.querySelector('.local-groupimport-easystud-tree__toggle .badge') : null;
        const groupcount = section ? section.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length : 0;
        if (badge) {
            const template = badge.getAttribute('data-count-template') || '__count__';
            badge.textContent = template.replace('__count__', groupcount);
        }
    });
    updateStructureSummary(root);
    updateStructureEmptyState(root);
};

const deleteGroupElement = (root, groupid) => {
    const group = root.querySelector('[data-easystud-group-id="' + groupid + '"]');
    if (group) {
        const section = group.closest('[data-easystud-grouping-drop]');
        group.remove();
        updateGroupingBadge(section);
    }
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    updateSelectionActions(root);
};

const deleteGroupingElement = (root, groupingid) => {
    const grouping = root.querySelector('[data-easystud-grouping-id="' + groupingid + '"]');
    if (grouping) {
        const ungroupedchildren = root.querySelector('.local-groupimport-easystud-tree__section--ungrouped .local-groupimport-easystud-tree__children');
        if (ungroupedchildren) {
            grouping.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').forEach(group => {
                ungroupedchildren.appendChild(group);
            });
        }
        grouping.remove();
    }
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    updateSelectionActions(root);
};

// Remove a group member from the UI and Moodle.
const removeMemberFromGroup = (root, courseId, groupid, userid, memberItem) => {
    return postAction({
        courseid: courseId,
        action: 'removeuser',
        groupid,
        userid,
    }).then(response => {
        if (memberItem) {
            memberItem.remove();
        }
        const group = root.querySelector('[data-easystud-group-id="' + groupid + '"]');
        if (group) {
            syncGroupMembersState(group, getLabels(root));
        }
        const user = root.querySelector('[data-easystud-user][data-user-id="' + userid + '"]');
        if (user) {
            const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
            user.setAttribute('data-group-ids', groupids.filter(id => id !== groupid).join(','));
        }
        updateSelectionActions(root);
        return response;
    });
};

// Create a member row in a group.
const createMemberItem = (groupid, userid, fullname, removelabel, selectionlabel) => {
    const item = document.createElement('li');
    item.className = 'local-groupimport-easystud-member';
    item.setAttribute('data-easystud-member-id', userid);
    item.setAttribute('data-member-key', groupid + '-' + userid);
    item.setAttribute('data-selectable-type', 'member');
    item.setAttribute('data-selectable-id', groupid + '-' + userid);

    const selector = document.createElement('label');
    selector.className = 'local-groupimport-easystud-selector local-groupimport-easystud-selector--member';
    selector.setAttribute('aria-label', selectionlabel || '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('data-easystud-selector-input', '1');
    checkbox.tabIndex = -1;
    selector.appendChild(checkbox);

    const ui = document.createElement('span');
    ui.className = 'local-groupimport-easystud-selector__ui';
    ui.setAttribute('aria-hidden', 'true');
    selector.appendChild(ui);

    item.appendChild(selector);

    const name = document.createElement('span');
    name.className = 'local-groupimport-easystud-member__name';
    name.textContent = fullname;
    item.appendChild(name);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-link p-0 local-groupimport-easystud-member__remove';
    remove.setAttribute('data-easystud-remove-member', '1');
    remove.setAttribute('data-group-id', groupid);
    remove.setAttribute('data-user-id', userid);
    remove.setAttribute('aria-label', removelabel || fullname);
    remove.setAttribute('data-easystud-hover-help', removelabel || fullname);
    remove.innerHTML = '<span aria-hidden="true">&times;</span>';
    item.appendChild(remove);

    return item;
};

const normaliseMemberRemoveLabels = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-member-id]').forEach(member => {
        const button = member.querySelector('[data-easystud-remove-member]');
        const name = member.querySelector('.local-groupimport-easystud-member__name');
        if (!button || !name) {
            return;
        }

        const current = button.getAttribute('aria-label') || '';
        if (current && current.indexOf('{}') === -1 && current.indexOf('{name}') === -1) {
            return;
        }

        const label = (labels.removeuser || 'Remove {name} from this group').replace('{name}', name.textContent.trim());
        button.setAttribute('aria-label', label);
        button.setAttribute('title', label);
        button.setAttribute('data-easystud-hover-help', label);
    });
};

const updateGroupingBadge = section => {
    if (!section) {
        return;
    }
    const badge = section.querySelector('.local-groupimport-easystud-tree__toggle .badge');
    if (!badge) {
        return;
    }
    const count = section.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length;
    const template = badge.getAttribute('data-count-template') || '__count__';
    badge.textContent = template.replace('__count__', count);
};

const syncGroupMembersState = (group, labels) => {
    const list = group ? group.querySelector('[data-easystud-group-members]') : null;
    const badge = group ? group.querySelector('.local-groupimport-easystud-group__header .badge') : null;
    if (!list || !badge) {
        return;
    }

    const members = list.querySelectorAll('[data-easystud-member-id]');
    list.querySelectorAll(':scope > .text-muted').forEach(item => item.remove());
    if (!members.length) {
        const empty = document.createElement('li');
        empty.className = 'text-muted';
        empty.textContent = labels.nogroupmembers || '';
        list.appendChild(empty);
    }

    const template = labels.memberscounttemplate || '__count__ member(s)';
    badge.textContent = template.replace('__count__', members.length);
};

const updateStructureSummary = root => {
    const labels = getLabels(root);
    const badge = root.querySelector('.local-groupimport-easystud__panel--structure .local-groupimport-easystud__panel-badge--accent');
    if (!badge) {
        return;
    }

    const groupings = root.querySelectorAll('[data-easystud-grouping-id]').length;
    const groups = root.querySelectorAll('[data-easystud-group-id]').length;
    const template = labels.groupstructuresummarytemplate || '__groupings__ groupings, __groups__ groups';
    badge.textContent = template
        .replace('__groupings__', groupings)
        .replace('__groups__', groups);
};

const updateStructureEmptyState = root => {
    const tree = root.querySelector('[data-easystud-tree]');
    if (!tree) {
        return;
    }

    const state = tree.querySelector('.local-groupimport-easystud__empty-state--structure');
    if (!state) {
        return;
    }

    const hasgroups = root.querySelectorAll('[data-easystud-group-id]').length > 0;
    const hasgroupings = root.querySelectorAll('[data-easystud-grouping-id]').length > 0;
    state.hidden = hasgroups || hasgroupings;
};

const createGroupElement = (root, groupdata) => {
    const labels = getLabels(root);
    const group = document.createElement('div');
    group.className = 'local-groupimport-easystud-group';
    group.setAttribute('data-easystud-group-id', groupdata.id);
    group.setAttribute('data-easystud-user-drop', groupdata.id);
    group.setAttribute('data-selectable-type', 'group');
    group.setAttribute('data-selectable-id', groupdata.id);
    group.setAttribute('draggable', 'true');

    group.innerHTML =
        '<label class="local-groupimport-easystud-selector local-groupimport-easystud-selector--group" aria-label="' + (labels.selectionmode || '') + '">' +
            '<input type="checkbox" data-easystud-selector-input="1" tabindex="-1">' +
            '<span class="local-groupimport-easystud-selector__ui" aria-hidden="true"></span>' +
        '</label>' +
        '<div class="local-groupimport-easystud-group__header">' +
            '<span class="local-groupimport-easystud-group__drag-handle" aria-hidden="true"><span class="fa fa-arrows" aria-hidden="true"></span></span>' +
            '<span class="local-groupimport-easystud-group__name"></span>' +
            '<span class="badge bg-light text-dark"></span>' +
            '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-group__mail-button" data-easystud-toggle-group-email="' + groupdata.id + '" aria-label="' + (labels.addemailstogroup || '') + '" data-easystud-hover-help="' + (labels.addemailstogroup || '') + '">' +
                '<span class="fa fa-at" aria-hidden="true"></span>' +
            '</button>' +
        '</div>' +
        '<form method="post" action="" class="local-groupimport-easystud-rename">' +
            '<input type="hidden" name="sesskey" value="' + M.cfg.sesskey + '">' +
            '<input type="hidden" name="action" value="renamegroup">' +
            '<input type="hidden" name="groupid" value="' + groupdata.id + '">' +
            '<input type="text" name="name" class="form-control form-control-sm" aria-label="' + (labels.rename || '') + '">' +
            '<button type="submit" class="btn btn-sm btn-outline-secondary">' + (labels.save || 'Save') + '</button>' +
        '</form>' +
        '<ul class="local-groupimport-easystud-group__members" data-easystud-group-members="' + groupdata.id + '"></ul>' +
        '<div class="local-groupimport-easystud-group-email" data-easystud-group-email-panel="' + groupdata.id + '" hidden>' +
            '<textarea class="form-control form-control-sm" rows="3" placeholder="' + (labels.pasteemailsplaceholder || '') + '" data-easystud-group-email-box="' + groupdata.id + '"></textarea>' +
            '<button type="button" class="btn btn-sm btn-primary mt-2" data-easystud-add-group-emails="' + groupdata.id + '">' +
                '<span class="fa fa-plus me-1" aria-hidden="true"></span><span>' + (labels.addemails || '') + '</span>' +
            '</button>' +
            '<div class="local-groupimport-easystud-group-email__result" data-easystud-group-email-result="' + groupdata.id + '" aria-live="polite"></div>' +
        '</div>';

    const name = group.querySelector('.local-groupimport-easystud-group__name');
    const input = group.querySelector('input[name="name"]');
    if (name) {
        name.textContent = groupdata.name || '';
    }
    if (input) {
        input.value = groupdata.rawname || groupdata.name || '';
    }
    syncGroupMembersState(group, labels);
    return group;
};

const createGroupingElement = (root, groupingdata) => {
    const labels = getLabels(root);
    const section = document.createElement('div');
    section.className = 'local-groupimport-easystud-tree__section';
    section.setAttribute('data-easystud-grouping-id', groupingdata.id);
    section.setAttribute('data-easystud-grouping-drop', groupingdata.id);
    section.setAttribute('data-selectable-type', 'grouping');
    section.setAttribute('data-selectable-id', groupingdata.id);

    section.innerHTML =
        '<label class="local-groupimport-easystud-selector local-groupimport-easystud-selector--section" aria-label="' + (labels.selectionmode || '') + '">' +
            '<input type="checkbox" data-easystud-selector-input="1" tabindex="-1">' +
            '<span class="local-groupimport-easystud-selector__ui" aria-hidden="true"></span>' +
        '</label>' +
        '<div class="local-groupimport-easystud-grouping__header">' +
            '<button type="button" class="local-groupimport-easystud-tree__toggle" data-easystud-collapse-toggle="1" aria-expanded="true">' +
                '<span class="fa fa-chevron-down" aria-hidden="true"></span>' +
                '<span class="local-groupimport-easystud-grouping__name"></span>' +
                '<span class="badge bg-secondary text-white" data-count-template="' + (labels.groupscounttemplate || '__count__') + '"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-group__mail-button" data-easystud-toggle-grouping-groups="' + groupingdata.id + '" aria-label="' + (labels.addgroupstogrouping || '') + '" data-easystud-hover-help="' + (labels.addgroupstogrouping || '') + '">' +
                '<span class="fa fa-layer-group" aria-hidden="true"></span>' +
            '</button>' +
        '</div>' +
        '<form method="post" action="" class="local-groupimport-easystud-rename">' +
            '<input type="hidden" name="sesskey" value="' + M.cfg.sesskey + '">' +
            '<input type="hidden" name="action" value="renamegrouping">' +
            '<input type="hidden" name="groupingid" value="' + groupingdata.id + '">' +
            '<input type="text" name="name" class="form-control form-control-sm" aria-label="' + (labels.rename || '') + '">' +
            '<button type="submit" class="btn btn-sm btn-outline-secondary">' + (labels.save || 'Save') + '</button>' +
        '</form>' +
        '<div class="local-groupimport-easystud-group-email" data-easystud-grouping-groups-panel="' + groupingdata.id + '" hidden>' +
            '<textarea class="form-control form-control-sm" rows="3" placeholder="' + (labels.pastegroupsplaceholder || '') + '" data-easystud-grouping-groups-box="' + groupingdata.id + '"></textarea>' +
            '<button type="button" class="btn btn-sm btn-outline-primary mt-2" data-easystud-add-grouping-groups="' + groupingdata.id + '">' +
                '<span class="fa fa-plus me-1" aria-hidden="true"></span><span>' + (labels.addgroups || '') + '</span>' +
            '</button>' +
            '<div class="local-groupimport-easystud-group-email__result" data-easystud-grouping-groups-result="' + groupingdata.id + '" aria-live="polite"></div>' +
        '</div>' +
        '<div class="local-groupimport-easystud-tree__children"></div>';

    const name = section.querySelector('.local-groupimport-easystud-grouping__name');
    const input = section.querySelector('input[name="name"]');
    if (name) {
        name.textContent = groupingdata.name || '';
    }
    if (input) {
        input.value = groupingdata.rawname || groupingdata.name || '';
    }
    updateGroupingBadge(section);
    return section;
};

// Apply participant filters.
const applyFilters = root => {
    const searchControl = root.querySelector('[data-easystud-search]');
    const roleControl = root.querySelector('[data-easystud-role-filter]');
    const groupControl = root.querySelector('[data-easystud-group-filter]');
    const query = normalise(searchControl ? searchControl.value : '');
    const role = normalise(roleControl ? roleControl.value : '');
    const groupid = groupControl ? groupControl.value : '';

    root.querySelectorAll('[data-easystud-user]').forEach(user => {
        const text = normalise(user.getAttribute('data-search-text'));
        const roles = normalise(user.getAttribute('data-role-text'));
        const groups = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
        const matchesQuery = !query || text.indexOf(query) !== -1;
        const matchesRole = !role || roles.indexOf(role) !== -1;
        const matchesGroup = !groupid || groups.indexOf(groupid) !== -1;
        user.hidden = !(matchesQuery && matchesRole && matchesGroup);
    });
    updateParticipantEmptyState(root);
};

const getSelectedItems = (root, type) => {
    const selector = type ? '[data-selectable-type="' + type + '"].' + selectedClass : '[data-selectable-type].' + selectedClass;
    return Array.from(root.querySelectorAll(selector));
};

const openConfirmModal = (root, message, onconfirm) => {
    const modal = root.querySelector('[data-easystud-confirm-modal]');
    const messageNode = root.querySelector('[data-easystud-confirm-modal-message]');
    const confirmButton = root.querySelector('[data-easystud-confirm-modal-submit]');
    const closeButtons = root.querySelectorAll('[data-easystud-close-confirm-modal]');
    if (!modal || !messageNode || !confirmButton) {
        onconfirm();
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        confirmButton.onclick = null;
    };

    messageNode.textContent = message || '';
    modal.hidden = false;
    confirmButton.onclick = () => {
        closeModal();
        onconfirm();
    };

    closeButtons.forEach(button => {
        button.onclick = closeModal;
    });

    modal.onclick = event => {
        if (event.target === modal) {
            closeModal();
        }
    };
};

const setItemSelected = (item, selected) => {
    item.classList.toggle(selectedClass, selected);
    const input = item.querySelector('[data-easystud-selector-input]');
    if (input) {
        input.checked = selected;
    }
};

const clearSelectionForType = (root, type, except) => {
    root.querySelectorAll('[data-selectable-type="' + type + '"].' + selectedClass).forEach(entry => {
        if (entry !== except) {
            setItemSelected(entry, false);
        }
    });
};

const clearSelection = (root, type) => {
    const selector = type ? '[data-selectable-type="' + type + '"]' : '[data-selectable-type]';
    root.querySelectorAll(selector).forEach(item => setItemSelected(item, false));
};

const getActiveSelectionType = root => {
    const types = ['participant', 'grouping', 'group', 'member'];
    return types.find(type => getSelectedItems(root, type).length > 0) || '';
};

const updateSelectionAvailability = root => {
    const activetype = getActiveSelectionType(root);

    root.querySelectorAll('[data-selectable-type]').forEach(item => {
        const type = item.getAttribute('data-selectable-type');
        const disabled = !!activetype && type !== activetype;
        item.classList.toggle(disabledSelectionClass, disabled);
        item.setAttribute('aria-disabled', disabled ? 'true' : 'false');

        const input = item.querySelector('[data-easystud-selector-input]');
        if (input) {
            input.disabled = disabled;
        }
    });
};

const updateParticipantEmptyState = root => {
    const list = root.querySelector('[data-easystud-participant-list]');
    if (!list) {
        return;
    }

    const users = Array.from(list.querySelectorAll('[data-easystud-user]'));
    const visibleUsers = users.filter(user => !user.hidden);
    let state = list.querySelector('[data-easystud-empty-state="participants"]');

    if (!state) {
        state = document.createElement('div');
        state.className = 'local-groupimport-easystud__empty-state';
        state.setAttribute('data-easystud-empty-state', 'participants');
        state.hidden = true;
        state.innerHTML = '<span class="fa fa-users" aria-hidden="true"></span><p class="mb-0"></p>';
        list.appendChild(state);
    }

    const message = list.getAttribute('data-empty-filtered-label') || '';
    const messageNode = state.querySelector('p');
    if (messageNode) {
        messageNode.textContent = message;
    }
    state.hidden = visibleUsers.length > 0;
};

const updateSelectionActions = root => {
    const selectedUsers = getSelectedItems(root, 'participant');
    const selectedGroups = getSelectedItems(root, 'group');
    const selectedGroupings = getSelectedItems(root, 'grouping');
    const selectedMembers = getSelectedItems(root, 'member');

    const detailsButton = root.querySelector('[data-easystud-open-selected-user]');
    if (detailsButton) {
        detailsButton.disabled = selectedUsers.length !== 1;
    }

    const futureRemoveButton = root.querySelector('[data-easystud-remove-selected-users]');
    if (futureRemoveButton) {
        futureRemoveButton.disabled = true;
    }

    const deleteGroupsButton = root.querySelector('[data-easystud-delete-selected-groups]');
    if (deleteGroupsButton) {
        deleteGroupsButton.disabled = selectedGroups.length === 0;
    }

    const deleteGroupingsButton = root.querySelector('[data-easystud-delete-selected-groupings]');
    if (deleteGroupingsButton) {
        deleteGroupingsButton.disabled = selectedGroupings.length === 0;
    }

    const deleteMembersButton = root.querySelector('[data-easystud-delete-selected-members]');
    if (deleteMembersButton) {
        deleteMembersButton.disabled = selectedMembers.length === 0;
    }

    const moveParticipantsButton = root.querySelector('[data-easystud-move-selected-participants]');
    if (moveParticipantsButton) {
        moveParticipantsButton.disabled = selectedUsers.length === 0;
    }

    const moveGroupsButton = root.querySelector('[data-easystud-move-selected-groups]');
    if (moveGroupsButton) {
        moveGroupsButton.disabled = selectedGroups.length === 0;
    }

    updateSelectionAvailability(root);
};

// Bind multi-selection across participant, group, grouping and member items.
const bindSelection = root => {
    const lastSelectedByType = new Map();

    root.addEventListener('click', event => {
        if (event.target.closest('button, a, input, textarea, select, form, .local-groupimport-easystud-selector')) {
            return;
        }

        const item = event.target.closest('[data-selectable-type]');
        if (!item || !root.contains(item)) {
            return;
        }

        const type = item.getAttribute('data-selectable-type');
        const activetype = getActiveSelectionType(root);
        if (activetype && activetype !== type) {
            return;
        }
        const items = Array.from(root.querySelectorAll('[data-selectable-type="' + type + '"]:not([hidden])'));
        const lastSelected = lastSelectedByType.get(type);

        if (event.shiftKey && lastSelected) {
            const start = items.indexOf(lastSelected);
            const end = items.indexOf(item);
            if (start !== -1 && end !== -1) {
                const [from, to] = start < end ? [start, end] : [end, start];
                items.slice(from, to + 1).forEach(entry => setItemSelected(entry, true));
            }
        } else if (event.ctrlKey || event.metaKey) {
            setItemSelected(item, !item.classList.contains(selectedClass));
        } else {
            clearSelectionForType(root, type, item);
            setItemSelected(item, true);
        }

        lastSelectedByType.set(type, item);
        updateSelectionActions(root);
    });

    root.addEventListener('change', event => {
        const input = event.target.closest('[data-easystud-selector-input]');
        if (!input || !root.contains(input)) {
            return;
        }

        const item = input.closest('[data-selectable-type]');
        if (!item) {
            return;
        }

        const type = item.getAttribute('data-selectable-type');
        const activetype = getActiveSelectionType(root);
        if (activetype && activetype !== type && !item.classList.contains(selectedClass)) {
            input.checked = false;
            return;
        }
        setItemSelected(item, input.checked);
        lastSelectedByType.set(type, item);
        updateSelectionActions(root);
    });

    root.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
            const selected = getSelectedItems(root, 'participant');
            if (!selected.length || !navigator.clipboard) {
                return;
            }
            event.preventDefault();
            const emails = selected.map(user => user.getAttribute('data-user-email')).filter(Boolean).join('\n');
            navigator.clipboard.writeText(emails);
        }
    });

    updateSelectionActions(root);
};

// Bind collapsible tree sections.
const bindTree = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-collapse-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        const section = toggle.closest('.local-groupimport-easystud-tree__section');
        const children = section ? section.querySelector('.local-groupimport-easystud-tree__children') : null;
        if (!children) {
            return;
        }
        const expanded = toggle.getAttribute('aria-expanded') !== 'false';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        children.hidden = expanded;
        const icon = toggle.querySelector('.fa');
        if (icon) {
            icon.classList.toggle('fa-chevron-right', expanded);
            icon.classList.toggle('fa-chevron-down', !expanded);
        }
    });
};

// Return selected users, defaulting to the dragged user when needed.
const getSelectedUsersForDrag = (root, draggedUser) => {
    const selected = getSelectedItems(root, 'participant');
    if (selected.indexOf(draggedUser) === -1) {
        return [draggedUser];
    }
    return selected;
};

// Return selected groups, defaulting to the dragged group when needed.
const getSelectedGroupsForDrag = (root, draggedGroup) => {
    const selected = getSelectedItems(root, 'group');
    if (selected.indexOf(draggedGroup) === -1) {
        return [draggedGroup];
    }
    return selected;
};

// Bind group drag and drop between groupings.
const bindGroupDragDrop = (root, courseId) => {
    let draggedGroups = [];

    const moveGroups = (groups, dropTarget) => {
        const groupingid = dropTarget.getAttribute('data-easystud-grouping-drop') || '0';
        return Promise.all(groups.map(group => {
            const groupid = group.getAttribute('data-easystud-group-id');
            return postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid,
            }).then(() => {
                moveGroupElementToGrouping(root, groupid, groupingid);
            });
        }));
    };

    root.addEventListener('dragstart', event => {
        const group = event.target.closest('[data-easystud-group-id]');
        if (!group || !root.contains(group)) {
            return;
        }
        draggedGroups = getSelectedGroupsForDrag(root, group);
        draggedGroups.forEach(item => item.classList.add(draggingClass));
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedGroups.map(item => item.getAttribute('data-easystud-group-id')).join(','));
    });

    root.addEventListener('dragend', () => {
        draggedGroups.forEach(item => item.classList.remove(draggingClass));
        draggedGroups = [];
        root.querySelectorAll('.' + dropTargetClass).forEach(target => target.classList.remove(dropTargetClass));
    });

    root.addEventListener('dragover', event => {
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (!draggedGroups.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        dropTarget.classList.add(dropTargetClass);
    });

    root.addEventListener('dragleave', event => {
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (dropTarget && !dropTarget.contains(event.relatedTarget)) {
            dropTarget.classList.remove(dropTargetClass);
        }
    });

    root.addEventListener('drop', event => {
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (!draggedGroups.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        dropTarget.classList.remove(dropTargetClass);
        moveGroups(draggedGroups, dropTarget).catch(() => {
            window.location.reload();
        });
    });
};

// Bind participant drag and drop into groups.
const bindUserDragDrop = (root, courseId) => {
    let draggedUsers = [];
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');

    const addUsersToGroup = (users, dropTarget) => {
        const groupid = dropTarget.getAttribute('data-easystud-user-drop');
        return postAction({
            courseid: courseId,
            action: 'addusers',
            groupid,
            userids: users.map(user => user.getAttribute('data-user-id')),
        }).then(response => {
            const list = dropTarget.querySelector('[data-easystud-group-members]');
            if (list) {
                list.querySelectorAll('.text-muted').forEach(empty => empty.remove());
                users.forEach(user => {
                    const userid = user.getAttribute('data-user-id');
                    if (list.querySelector('[data-easystud-member-id="' + userid + '"]')) {
                        return;
                    }
                    const fullname = user.querySelector('strong') ? user.querySelector('strong').textContent : '';
                    const removelabel = (labels.removeuser || 'Remove {name} from this group').replace('{name}', fullname);
                    list.appendChild(createMemberItem(groupid, userid, fullname, removelabel, labels.selectionmode || ''));
                    const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                    const groupid = dropTarget.getAttribute('data-easystud-user-drop');
                    if (groupids.indexOf(groupid) === -1) {
                        groupids.push(groupid);
                        user.setAttribute('data-group-ids', groupids.join(','));
                    }
                });
                syncGroupMembersState(dropTarget, labels);
            }
            return response;
        });
    };

    root.addEventListener('dragstart', event => {
        const user = event.target.closest('[data-easystud-user]');
        if (!user || !root.contains(user)) {
            return;
        }
        draggedUsers = getSelectedUsersForDrag(root, user);
        draggedUsers.forEach(item => item.classList.add(draggingClass));
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', draggedUsers.map(item => item.getAttribute('data-user-id')).join(','));
    });

    root.addEventListener('dragend', () => {
        draggedUsers.forEach(item => item.classList.remove(draggingClass));
        draggedUsers = [];
        root.querySelectorAll('.' + dropTargetClass).forEach(target => target.classList.remove(dropTargetClass));
    });

    root.addEventListener('dragover', event => {
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        if (!draggedUsers.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        dropTarget.classList.add(dropTargetClass);
    });

    root.addEventListener('dragleave', event => {
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        if (dropTarget && !dropTarget.contains(event.relatedTarget)) {
            dropTarget.classList.remove(dropTargetClass);
        }
    });

    root.addEventListener('drop', event => {
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        if (!draggedUsers.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        dropTarget.classList.remove(dropTargetClass);
        addUsersToGroup(draggedUsers, dropTarget).then(response => {
            showNotification(root, response.message || '', 'success');
        }).catch(() => {
            window.location.reload();
        });
    });
};

const bindQuickCreate = (root, courseId) => {
    root.querySelectorAll('.local-groupimport-easystud-create').forEach(form => {
        form.addEventListener('submit', event => {
            event.preventDefault();

            const action = form.querySelector('input[name="action"]');
            const textinput = form.querySelector('input[type="text"]');
            if (!action || !textinput || !textinput.value.trim()) {
                return;
            }

            const payload = {
                courseid: courseId,
                action: action.value,
            };

            if (action.value === 'creategroup') {
                payload.groupname = textinput.value.trim();
            } else if (action.value === 'creategrouping') {
                payload.groupingname = textinput.value.trim();
            } else {
                return;
            }

            postAction(payload).then(response => {
                const tree = root.querySelector('[data-easystud-tree]');
                const ungroupedsection = tree ? tree.querySelector('.local-groupimport-easystud-tree__section--ungrouped') : null;

                if (response.group && tree && ungroupedsection) {
                    const children = ungroupedsection.querySelector('.local-groupimport-easystud-tree__children');
                    if (children) {
                        children.appendChild(createGroupElement(root, response.group));
                    }
                }

                if (response.grouping && tree) {
                    const grouping = createGroupingElement(root, response.grouping);
                    if (ungroupedsection) {
                        tree.insertBefore(grouping, ungroupedsection);
                    } else {
                        tree.appendChild(grouping);
                    }
                }

                textinput.value = '';
                updateStructureSummary(root);
                updateStructureEmptyState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
        });
    });
};

const bindRenameForms = (root, courseId) => {
    root.addEventListener('submit', event => {
        const form = event.target.closest('.local-groupimport-easystud-rename');
        if (!form || !root.contains(form)) {
            return;
        }

        event.preventDefault();
        const action = form.querySelector('input[name="action"]');
        const nameinput = form.querySelector('input[name="name"]');
        if (!action || !nameinput || !nameinput.value.trim()) {
            return;
        }

        const payload = {
            courseid: courseId,
            action: action.value,
            name: nameinput.value.trim(),
        };

        const groupid = form.querySelector('input[name="groupid"]');
        const groupingid = form.querySelector('input[name="groupingid"]');
        if (groupid) {
            payload.groupid = groupid.value;
        }
        if (groupingid) {
            payload.groupingid = groupingid.value;
        }

        postAction(payload).then(response => {
            if (response.group) {
                const group = root.querySelector('[data-easystud-group-id="' + response.group.id + '"]');
                if (group) {
                    const name = group.querySelector('.local-groupimport-easystud-group__name');
                    if (name) {
                        name.textContent = response.group.name || '';
                    }
                    nameinput.value = response.group.rawname || response.group.name || '';
                }
            }

            if (response.grouping) {
                const grouping = root.querySelector('[data-easystud-grouping-id="' + response.grouping.id + '"]');
                if (grouping) {
                    const name = grouping.querySelector('.local-groupimport-easystud-grouping__name');
                    if (name) {
                        name.textContent = response.grouping.name || '';
                    }
                    nameinput.value = response.grouping.rawname || response.grouping.name || '';
                }
            }

            showNotification(root, response.message || '', 'success');
        }).catch(() => window.location.reload());
    });
};

// Bind direct group email paste and member removal actions.
const bindGroupMemberActions = (root, courseId) => {
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');

    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-toggle-group-email]');
        if (toggle && root.contains(toggle)) {
            const groupid = toggle.getAttribute('data-easystud-toggle-group-email');
            const panel = root.querySelector('[data-easystud-group-email-panel="' + groupid + '"]');
            if (panel) {
                panel.hidden = !panel.hidden;
                const box = panel.querySelector('[data-easystud-group-email-box]');
                if (!panel.hidden && box) {
                    box.focus();
                }
            }
            return;
        }

        const addButton = event.target.closest('[data-easystud-add-group-emails]');
        if (addButton && root.contains(addButton)) {
            const groupid = addButton.getAttribute('data-easystud-add-group-emails');
            const group = root.querySelector('[data-easystud-user-drop="' + groupid + '"]');
            const box = root.querySelector('[data-easystud-group-email-box="' + groupid + '"]');
            const result = root.querySelector('[data-easystud-group-email-result="' + groupid + '"]');
            if (!group || !box) {
                return;
            }
            postAction({
                courseid: courseId,
                action: 'addemails',
                groupid,
                emails: box.value,
            }).then(response => {
                const list = group.querySelector('[data-easystud-group-members]');
                if (list) {
                    (response.users || []).forEach(user => {
                        if (!list.querySelector('[data-easystud-member-id="' + user.id + '"]')) {
                            const removelabel = (labels.removeuser || 'Remove {name} from this group')
                                .replace('{name}', user.fullname);
                            list.appendChild(createMemberItem(groupid, user.id, user.fullname, removelabel, labels.selectionmode || ''));
                        }
                    });
                    syncGroupMembersState(group, labels);
                }
                if (result) {
                    const missing = response.missing && response.missing.length ? ' - ' + response.missing.join(', ') : '';
                    result.textContent = (response.message || '') + missing;
                    result.classList.toggle('text-danger', !!missing);
                }
                box.value = '';
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
            return;
        }

        const removeButton = event.target.closest('[data-easystud-remove-member]');
        if (removeButton && root.contains(removeButton)) {
            const groupid = removeButton.getAttribute('data-group-id');
            const userid = removeButton.getAttribute('data-user-id');
            const item = removeButton.closest('[data-easystud-member-id]');
            removeMemberFromGroup(root, courseId, groupid, userid, item).then(response => {
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
        }
    });
};

// Bind direct grouping group paste actions.
const bindGroupingGroupActions = (root, courseId) => {
    root.addEventListener('click', event => {
        const removeButton = event.target.closest('[data-easystud-remove-from-grouping]');
        if (removeButton && root.contains(removeButton)) {
            const groupid = removeButton.getAttribute('data-easystud-remove-from-grouping');
            postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid: 0,
            }).then(response => {
                moveGroupElementToGrouping(root, groupid, 0);
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
            return;
        }

        const toggle = event.target.closest('[data-easystud-toggle-grouping-groups]');
        if (toggle && root.contains(toggle)) {
            const groupingid = toggle.getAttribute('data-easystud-toggle-grouping-groups');
            const panel = root.querySelector('[data-easystud-grouping-groups-panel="' + groupingid + '"]');
            if (panel) {
                panel.hidden = !panel.hidden;
                const box = panel.querySelector('[data-easystud-grouping-groups-box]');
                if (!panel.hidden && box) {
                    box.focus();
                }
            }
            return;
        }

        const addButton = event.target.closest('[data-easystud-add-grouping-groups]');
        if (addButton && root.contains(addButton)) {
            const groupingid = addButton.getAttribute('data-easystud-add-grouping-groups');
            const box = root.querySelector('[data-easystud-grouping-groups-box="' + groupingid + '"]');
            const result = root.querySelector('[data-easystud-grouping-groups-result="' + groupingid + '"]');
            if (!box) {
                return;
            }

            postAction({
                courseid: courseId,
                action: 'addgroups',
                groupingid,
                groups: box.value,
            }).then(response => {
                (response.groups || []).forEach(group => {
                    moveGroupElementToGrouping(root, group.id, groupingid);
                });
                if (result) {
                    let details = '';
                    if (response.missing && response.missing.length) {
                        details += ' - ' + response.missing.join(', ');
                    }
                    if (response.ambiguous && response.ambiguous.length) {
                        details += ' - ' + response.ambiguous.join(', ');
                    }
                    result.textContent = (response.message || '') + details;
                    result.classList.toggle('text-danger', !!details);
                }
                box.value = '';
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
        }
    });
};

const bindBulkActions = (root, courseId) => {
    const deleteGroupsButton = root.querySelector('[data-easystud-delete-selected-groups]');
    const deleteGroupingsButton = root.querySelector('[data-easystud-delete-selected-groupings]');
    const deleteMembersButton = root.querySelector('[data-easystud-delete-selected-members]');

    if (deleteGroupsButton) {
        deleteGroupsButton.addEventListener('click', () => {
            const selectedGroups = getSelectedItems(root, 'group');
            const groupids = selectedGroups.map(group => group.getAttribute('data-selectable-id'));
            if (!groupids.length) {
                return;
            }

            const hasmembers = selectedGroups.some(group => group.querySelector('[data-easystud-member-id]'));
            const runDelete = () => {
                postAction({
                    courseid: courseId,
                    action: 'deletegroups',
                    groupids,
                }).then(response => {
                    groupids.forEach(groupid => deleteGroupElement(root, groupid));
                    showNotification(root, response.message || '', 'success');
                }).catch(() => window.location.reload());
            };

            if (hasmembers) {
                openConfirmModal(root, getLabels(root).confirmdeletegroups || '', runDelete);
                return;
            }

            runDelete();
        });
    }

    if (deleteGroupingsButton) {
        deleteGroupingsButton.addEventListener('click', () => {
            const selectedGroupings = getSelectedItems(root, 'grouping');
            const groupingids = selectedGroupings.map(grouping => grouping.getAttribute('data-selectable-id'));
            if (!groupingids.length) {
                return;
            }

            const hasgroups = selectedGroupings.some(grouping => {
                return grouping.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length > 0;
            });
            const runDelete = () => {
                postAction({
                    courseid: courseId,
                    action: 'deletegroupings',
                    groupingids,
                }).then(response => {
                    groupingids.forEach(groupingid => deleteGroupingElement(root, groupingid));
                    showNotification(root, response.message || '', 'success');
                }).catch(() => window.location.reload());
            };

            if (hasgroups) {
                openConfirmModal(root, getLabels(root).confirmdeletegroupings || '', runDelete);
                return;
            }

            runDelete();
        });
    }

    if (deleteMembersButton) {
        deleteMembersButton.addEventListener('click', () => {
            const selectedMembers = getSelectedItems(root, 'member');
            if (!selectedMembers.length) {
                return;
            }
            const groupids = [];
            const userids = [];
            selectedMembers.forEach(member => {
                const group = member.closest('[data-easystud-group-id]');
                const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
                const userid = member.getAttribute('data-easystud-member-id');
                if (groupid && userid) {
                    groupids.push(groupid);
                    userids.push(userid);
                }
            });
            postAction({
                courseid: courseId,
                action: 'removemembers',
                groupids,
                userids,
            }).then(response => {
                selectedMembers.forEach(member => {
                    const group = member.closest('[data-easystud-group-id]');
                    const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
                    const userid = member.getAttribute('data-easystud-member-id');
                    const user = root.querySelector('[data-easystud-user][data-user-id="' + userid + '"]');
                    if (user) {
                        const current = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                        user.setAttribute('data-group-ids', current.filter(id => id !== groupid).join(','));
                    }
                    member.remove();
                    if (group) {
                        syncGroupMembersState(group, getLabels(root));
                    }
                });
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
        });
    }
};

const bindMoveModal = (root, courseId) => {
    const modal = root.querySelector('[data-easystud-move-modal]');
    const openParticipants = root.querySelector('[data-easystud-move-selected-participants]');
    const openGroups = root.querySelector('[data-easystud-move-selected-groups]');
    const closeButtons = root.querySelectorAll('[data-easystud-close-move-modal]');
    const confirmButton = root.querySelector('[data-easystud-confirm-move]');
    const destination = root.querySelector('[data-easystud-move-destination]');
    const help = root.querySelector('[data-easystud-move-modal-help]');
    const label = root.querySelector('[data-easystud-move-modal-label]');
    const body = modal ? modal.querySelector('.local-groupimport-easystud-modal__body') : null;
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');

    if (!modal || !confirmButton || !destination || !help || !label || !body) {
        return;
    }

    let contextType = '';

    const closeModal = () => {
        modal.hidden = true;
        contextType = '';
    };

    const getGroupName = group => {
        const node = group.querySelector('.local-groupimport-easystud-group__name');
        return node ? node.textContent.trim() : '';
    };

    const buildOptions = type => {
        destination.innerHTML = '';

        if (type === 'participant') {
            root.querySelectorAll('[data-easystud-group-id]').forEach(group => {
                const option = document.createElement('option');
                option.value = group.getAttribute('data-easystud-group-id') || '';
                option.textContent = getGroupName(group);
                destination.appendChild(option);
            });
            return;
        }

        const ungrouped = root.querySelector('.local-groupimport-easystud-tree__section--ungrouped .local-groupimport-easystud-tree__toggle');
        const ungroupedOption = document.createElement('option');
        ungroupedOption.value = '0';
        ungroupedOption.textContent = ungrouped ? ungrouped.textContent.trim() : (labels.groupswithoutgrouping || 'Without grouping');
        destination.appendChild(ungroupedOption);

        root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
            const option = document.createElement('option');
            option.value = grouping.getAttribute('data-easystud-grouping-id') || '';
            const name = grouping.querySelector('.local-groupimport-easystud-grouping__name');
            option.textContent = name ? name.textContent.trim() : '';
            destination.appendChild(option);
        });
    };

    const openModal = type => {
        contextType = type;
        help.textContent = body.getAttribute(type === 'participant' ? 'data-move-participants-help' : 'data-move-groups-help') || '';
        label.textContent = body.getAttribute(type === 'participant' ? 'data-move-participants-label' : 'data-move-groups-label') || '';
        buildOptions(type);
        confirmButton.disabled = destination.options.length === 0;
        modal.hidden = false;
        if (!confirmButton.disabled) {
            destination.focus();
        }
    };

    if (openParticipants) {
        openParticipants.addEventListener('click', () => openModal('participant'));
    }

    if (openGroups) {
        openGroups.addEventListener('click', () => openModal('group'));
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    confirmButton.addEventListener('click', () => {
        const value = destination.value;
        if (!contextType || !value) {
            return;
        }

        if (contextType === 'participant') {
            const users = getSelectedItems(root, 'participant');
            const group = root.querySelector('[data-easystud-user-drop="' + value + '"]');
            if (!users.length || !group) {
                return;
            }

            postAction({
                courseid: courseId,
                action: 'addusers',
                groupid: value,
                userids: users.map(user => user.getAttribute('data-user-id')),
            }).then(response => {
                const list = group.querySelector('[data-easystud-group-members]');
                if (list) {
                    list.querySelectorAll('.text-muted').forEach(empty => empty.remove());
                    users.forEach(user => {
                        const userid = user.getAttribute('data-user-id');
                        if (!list.querySelector('[data-easystud-member-id="' + userid + '"]')) {
                            const fullname = user.querySelector('strong') ? user.querySelector('strong').textContent : '';
                            const removelabel = (labels.removeuser || 'Remove {name} from this group').replace('{name}', fullname);
                            list.appendChild(createMemberItem(value, userid, fullname, removelabel, labels.selectionmode || ''));
                        }
                        const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                        if (groupids.indexOf(value) === -1) {
                            groupids.push(value);
                            user.setAttribute('data-group-ids', groupids.join(','));
                        }
                    });
                    syncGroupMembersState(group, labels);
                }
                closeModal();
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
            return;
        }

        const groups = getSelectedItems(root, 'group');
        if (!groups.length) {
            return;
        }

        Promise.all(groups.map(group => {
            const groupid = group.getAttribute('data-easystud-group-id');
            return postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid: value,
            }).then(() => {
                moveGroupElementToGrouping(root, groupid, value);
            });
        })).then(() => {
            closeModal();
        }).catch(() => window.location.reload());
    });
};

// Bind right-click menus for fast local actions.
const bindContextMenu = (root, courseId) => {
    const menu = root.querySelector('[data-easystud-context-menu]');
    if (!menu) {
        return;
    }

    let context = null;

    const hideMenu = () => {
        menu.hidden = true;
        context = null;
    };

    const setVisibleActions = type => {
        menu.querySelectorAll('[data-easystud-context-action]').forEach(button => {
            const contexts = (button.getAttribute('data-easystud-contexts') || '').split(' ');
            button.hidden = contexts.indexOf(type) === -1;
        });
    };

    const showMenu = (event, type, target) => {
        event.preventDefault();
        context = {type, target};
        setVisibleActions(type);
        menu.hidden = false;
        const rect = menu.getBoundingClientRect();
        const left = Math.min(event.clientX, window.innerWidth - rect.width - 8);
        const top = Math.min(event.clientY, window.innerHeight - rect.height - 8);
        menu.style.left = Math.max(8, left) + 'px';
        menu.style.top = Math.max(8, top) + 'px';
        const first = menu.querySelector('[data-easystud-context-action]:not([hidden])');
        if (first) {
            first.focus();
        }
    };

    root.addEventListener('contextmenu', event => {
        const member = event.target.closest('[data-easystud-member-id]');
        if (member && root.contains(member)) {
            showMenu(event, 'member', member);
            return;
        }

        const group = event.target.closest('[data-easystud-group-id]');
        if (group && root.contains(group)) {
            showMenu(event, 'group', group);
            return;
        }

        const grouping = event.target.closest('[data-easystud-grouping-id]');
        if (grouping && root.contains(grouping)) {
            showMenu(event, 'grouping', grouping);
            return;
        }

        const user = event.target.closest('[data-easystud-user]');
        if (user && root.contains(user)) {
            if (!user.classList.contains(selectedClass)) {
                clearSelectionForType(root, 'participant', user);
                setItemSelected(user, true);
            }
            showMenu(event, 'participant', user);
        }
    });

    menu.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-context-action]');
        if (!button || !context) {
            return;
        }

        const action = button.getAttribute('data-easystud-context-action');
        const target = context.target;
        hideMenu();

        if (action === 'copy-participant-field') {
            const fieldkey = button.getAttribute('data-easystud-context-field') || '';
            const users = getSelectedParticipantsForContext(root, target);
            const values = users.map(user => getUserCopyFieldValue(user, fieldkey)).filter(Boolean);
            copyText(values.join('\n'));
        } else if (action === 'participant-open-details') {
            const button = root.querySelector('[data-easystud-open-user="' + target.getAttribute('data-user-id') + '"]');
            if (button) {
                button.click();
            }
        } else if (action === 'clear-selection') {
            clearSelection(root, 'participant');
            updateSelectionActions(root);
        } else if (action === 'group-paste-emails') {
            const groupid = target.getAttribute('data-easystud-group-id');
            const panel = root.querySelector('[data-easystud-group-email-panel="' + groupid + '"]');
            if (panel) {
                panel.hidden = false;
                const box = panel.querySelector('[data-easystud-group-email-box]');
                if (box) {
                    box.focus();
                }
            }
        } else if (action === 'group-focus-rename') {
            const input = target.querySelector('.local-groupimport-easystud-rename input[name="name"]');
            if (input) {
                input.focus();
                input.select();
            }
        } else if (action === 'copy-group-name') {
            const name = target.querySelector('.local-groupimport-easystud-group__name');
            copyText(name ? name.textContent : '');
        } else if (action === 'grouping-focus-rename') {
            const input = target.querySelector('.local-groupimport-easystud-rename input[name="name"]');
            if (input) {
                input.focus();
                input.select();
            }
        } else if (action === 'grouping-paste-groups') {
            const groupingid = target.getAttribute('data-easystud-grouping-id');
            const panel = root.querySelector('[data-easystud-grouping-groups-panel="' + groupingid + '"]');
            if (panel) {
                panel.hidden = false;
                const box = panel.querySelector('[data-easystud-grouping-groups-box]');
                if (box) {
                    box.focus();
                }
            }
        } else if (action === 'copy-grouping-name') {
            const name = target.querySelector('.local-groupimport-easystud-grouping__name');
            copyText(name ? name.textContent : '');
        } else if (action === 'remove-member') {
            const group = target.closest('[data-easystud-group-id]');
            const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
            const userid = target.getAttribute('data-easystud-member-id');
            removeMemberFromGroup(root, courseId, groupid, userid, target).then(response => {
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
        } else if (action === 'copy-member-name') {
            const name = target.querySelector('.local-groupimport-easystud-member__name');
            copyText(name ? name.textContent : '');
        }
    });

    document.addEventListener('click', event => {
        if (!menu.hidden && !menu.contains(event.target)) {
            hideMenu();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideMenu();
        }
    });
    window.addEventListener('scroll', hideMenu, true);
};

const bindTagToggles = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-toggle-tags]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }

        const container = toggle.closest('.local-groupimport-easystud-user__meta-tags');
        if (!container) {
            return;
        }

        const hiddenTags = container.querySelectorAll('[data-easystud-extra-tag]');
        const expanded = toggle.getAttribute('data-expanded') === '1';
        hiddenTags.forEach(tag => {
            tag.hidden = expanded;
        });
        toggle.setAttribute('data-expanded', expanded ? '0' : '1');
        toggle.textContent = expanded ? (toggle.getAttribute('data-more-label') || '...') :
            (toggle.getAttribute('data-less-label') || '');
    });
};

const bindHoverPopovers = root => {
    let activeTip = null;

    const removeTip = () => {
        if (activeTip) {
            activeTip.remove();
            activeTip = null;
        }
    };

    const showTip = node => {
        removeTip();
        const content = node.getAttribute('data-easystud-hover-help') || '';
        if (!content) {
            return;
        }

        activeTip = document.createElement('div');
        activeTip.className = 'popover ' + hoverPopoverClass + ' ' + hoverPopoverClass + '--top show';
        activeTip.setAttribute('role', 'tooltip');
        activeTip.innerHTML = '<div class="popover-arrow"></div><div class="popover-body">' + content + '</div>';
        document.body.appendChild(activeTip);

        const rect = node.getBoundingClientRect();
        const tiprect = activeTip.getBoundingClientRect();
        const top = window.scrollY + rect.top - tiprect.height - 10;
        const left = window.scrollX + rect.left + ((rect.width - tiprect.width) / 2);

        activeTip.style.top = Math.max(window.scrollY + 8, top) + 'px';
        activeTip.style.left = Math.max(
            window.scrollX + 8,
            Math.min(window.scrollX + window.innerWidth - tiprect.width - 8, left)
        ) + 'px';
    };

    root.addEventListener('mouseenter', event => {
        const node = event.target.closest('[data-easystud-hover-help]');
        if (node && root.contains(node)) {
            showTip(node);
        }
    }, true);

    root.addEventListener('mouseleave', event => {
        const node = event.target.closest('[data-easystud-hover-help]');
        if (node && root.contains(node)) {
            removeTip();
        }
    }, true);

    root.addEventListener('focusin', event => {
        const node = event.target.closest('[data-easystud-hover-help]');
        if (node && root.contains(node)) {
            showTip(node);
        }
    });

    root.addEventListener('focusout', removeTip);
    root.addEventListener('click', removeTip);
    window.addEventListener('scroll', removeTip, true);
};

const bindParticipantModal = root => {
    const modal = root.querySelector('[data-easystud-user-modal]');
    const body = root.querySelector('[data-easystud-user-modal-body]');
    const close = root.querySelector('[data-easystud-close-user-modal]');
    const openSelected = root.querySelector('[data-easystud-open-selected-user]');
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');
    if (!modal || !body || !close) {
        return;
    }

    const renderField = (label, value) => {
        if (!value) {
            return '';
        }
        return '<div class="local-groupimport-easystud-detail__row"><strong>' + label + '</strong><span>' + value + '</span></div>';
    };

    const openForUser = user => {
        const detail = user.getAttribute('data-user-detail');
        if (!detail) {
            return;
        }
        const data = JSON.parse(detail);
        body.innerHTML =
            '<div class="local-groupimport-easystud-detail">' +
            '<div class="local-groupimport-easystud-detail__hero">' + (data.profileimage || '') +
            '<div><h4>' + (data.fullname || '') + '</h4><p>' + (data.email || '') + '</p></div></div>' +
            renderField(labels.username || '', data.username) +
            renderField(labels.idnumber || '', data.idnumber) +
            renderField(labels.institution || '', data.institution) +
            renderField(labels.department || '', data.department) +
            renderField(labels.city || '', data.city) +
            renderField(labels.country || '', data.country) +
            renderField(labels.language || '', data.lang) +
            renderField(labels.roles || '', (data.roles || []).join(', ')) +
            renderField(labels.groups || '', (data.groups || []).join(', ')) +
            (data.description ? '<div class="local-groupimport-easystud-detail__description">' + data.description + '</div>' : '') +
            (data.profileurl ? '<p class="mt-3 mb-0"><a class="btn btn-outline-primary btn-sm" href="' + data.profileurl + '">' +
                (labels.nativedetails || '') + '</a></p>' : '') +
            '</div>';
        modal.hidden = false;
    };

    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-open-user]');
        if (!button || !root.contains(button)) {
            return;
        }
        const user = root.querySelector('[data-easystud-user][data-user-id="' + button.getAttribute('data-easystud-open-user') + '"]');
        if (user) {
            openForUser(user);
        }
    });

    if (openSelected) {
        openSelected.addEventListener('click', () => {
            const selected = getSelectedItems(root, 'participant');
            if (selected.length === 1) {
                openForUser(selected[0]);
            }
        });
    }

    close.addEventListener('click', () => {
        modal.hidden = true;
    });
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            modal.hidden = true;
        }
    });
};

// Bind optional tools that should not take permanent screen space.
const bindOptionalTools = root => {
    const densityToggle = root.querySelector('[data-easystud-density-toggle]');
    const modal = root.querySelector('[data-easystud-clipboard-modal]');
    const openClipboard = root.querySelector('[data-easystud-open-clipboard]');
    const closeClipboard = root.querySelector('[data-easystud-close-clipboard]');

    if (densityToggle) {
        densityToggle.addEventListener('click', () => {
            const compact = !root.classList.contains(compactClass);
            root.classList.toggle(compactClass, compact);
            densityToggle.setAttribute('aria-pressed', compact ? 'true' : 'false');
        });
    }

    if (modal && openClipboard && closeClipboard) {
        openClipboard.addEventListener('click', () => {
            modal.hidden = false;
            const textarea = modal.querySelector('[data-easystud-paste-box]');
            if (textarea) {
                textarea.focus();
            }
        });
        closeClipboard.addEventListener('click', () => {
            modal.hidden = true;
            openClipboard.focus();
        });
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                modal.hidden = true;
                openClipboard.focus();
            }
        });
    }
};

// Bind paste recognition preview.
const bindPastePreview = root => {
    const box = root.querySelector('[data-easystud-paste-box]');
    const results = root.querySelector('[data-easystud-paste-results]');
    if (!box || !results) {
        return;
    }

    const knownEmails = new Set(Array.from(root.querySelectorAll('[data-easystud-user]')).map(user => {
        return normalise(user.getAttribute('data-user-email'));
    }).filter(Boolean));

        const render = () => {
        const tokens = (box.value.match(/[^\s,;]+@[^\s,;]+/g) || []).map(normalise);
        results.innerHTML = '';
        tokens.forEach(email => {
            const badge = document.createElement('span');
            badge.className = 'local-groupimport-easystud-token ' +
                (knownEmails.has(email) ? 'local-groupimport-easystud-token--valid' : 'local-groupimport-easystud-token--invalid');
            badge.textContent = email;
            results.appendChild(badge);
        });
    };

    box.addEventListener('input', render);
    box.addEventListener('paste', () => window.setTimeout(render, 0));
};

// Initialise the manager.
export const init = (rootId, courseId) => {
    onReady(() => {
        const root = document.getElementById(rootId);
        if (!root) {
            return;
        }

        root.querySelectorAll('[data-easystud-search], [data-easystud-role-filter], [data-easystud-group-filter]').forEach(control => {
            control.addEventListener('input', () => applyFilters(root));
            control.addEventListener('change', () => applyFilters(root));
        });

        bindSelection(root);
        bindTree(root);
        bindGroupDragDrop(root, courseId);
        bindUserDragDrop(root, courseId);
        bindQuickCreate(root, courseId);
        bindRenameForms(root, courseId);
        bindGroupMemberActions(root, courseId);
        bindGroupingGroupActions(root, courseId);
        bindBulkActions(root, courseId);
        bindMoveModal(root, courseId);
        bindContextMenu(root, courseId);
        bindTagToggles(root);
        bindParticipantModal(root);
        bindOptionalTools(root);
        bindPastePreview(root);
        bindHoverPopovers(root);
        normaliseMemberRemoveLabels(root);
        applyFilters(root);
        updateParticipantEmptyState(root);
    });
};
