define([], function() {
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
};

const deleteGroupElement = (root, groupid) => {
    const group = root.querySelector('[data-easystud-group-id="' + groupid + '"]');
    if (group) {
        group.remove();
    }
    updateSelectionActions(root);
};

const deleteGroupingElement = (root, groupingid) => {
    const grouping = root.querySelector('[data-easystud-grouping-id="' + groupingid + '"]');
    if (grouping) {
        grouping.remove();
    }
    updateSelectionActions(root);
};

// Remove a group member from the UI and Moodle.
const removeMemberFromGroup = (root, courseId, groupid, userid, memberItem) => {
    return postAction({
        courseid: courseId,
        action: 'removeuser',
        groupid,
        userid,
    }).then(() => {
        if (memberItem) {
            memberItem.remove();
        }
        const user = root.querySelector('[data-easystud-user][data-user-id="' + userid + '"]');
        if (user) {
            const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
            user.setAttribute('data-group-ids', groupids.filter(id => id !== groupid).join(','));
        }
        updateSelectionActions(root);
    });
};

// Create a member row in a group.
const createMemberItem = (groupid, userid, fullname, removelabel) => {
    const item = document.createElement('li');
    item.className = 'local-groupimport-easystud-member';
    item.setAttribute('data-easystud-member-id', userid);

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
};

const getSelectedItems = (root, type) => {
    const selector = type ? '[data-selectable-type="' + type + '"].' + selectedClass : '[data-selectable-type].' + selectedClass;
    return Array.from(root.querySelectorAll(selector));
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
};

// Bind multi-selection across participant, group, grouping and member items.
const bindSelection = root => {
    const lastSelectedByType = new Map();

    root.addEventListener('click', event => {
        if (event.target.closest('button, a, input, textarea, select, form')) {
            return;
        }

        const item = event.target.closest('[data-selectable-type]');
        if (!item || !root.contains(item)) {
            return;
        }

        const type = item.getAttribute('data-selectable-type');
        const items = Array.from(root.querySelectorAll('[data-selectable-type="' + type + '"]:not([hidden])'));
        const lastSelected = lastSelectedByType.get(type);

        if (event.shiftKey && lastSelected) {
            const start = items.indexOf(lastSelected);
            const end = items.indexOf(item);
            if (start !== -1 && end !== -1) {
                const [from, to] = start < end ? [start, end] : [end, start];
                items.slice(from, to + 1).forEach(entry => entry.classList.add(selectedClass));
            }
        } else if (event.ctrlKey || event.metaKey) {
            item.classList.toggle(selectedClass);
        } else {
            root.querySelectorAll('[data-selectable-type="' + type + '"].' + selectedClass).forEach(entry => {
                if (entry !== item) {
                    entry.classList.remove(selectedClass);
                }
            });
            item.classList.add(selectedClass);
        }

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
        }).then(() => {
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
                    list.appendChild(createMemberItem(groupid, userid, fullname, removelabel));
                    const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                    const groupid = dropTarget.getAttribute('data-easystud-user-drop');
                    if (groupids.indexOf(groupid) === -1) {
                        groupids.push(groupid);
                        user.setAttribute('data-group-ids', groupids.join(','));
                    }
                });
            }
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
        addUsersToGroup(draggedUsers, dropTarget).catch(() => {
            window.location.reload();
        });
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
                    list.querySelectorAll('.text-muted').forEach(empty => empty.remove());
                    (response.users || []).forEach(user => {
                        if (!list.querySelector('[data-easystud-member-id="' + user.id + '"]')) {
                            const removelabel = (labels.removeuser || 'Remove {name} from this group')
                                .replace('{name}', user.fullname);
                            list.appendChild(createMemberItem(groupid, user.id, user.fullname, removelabel));
                        }
                    });
                }
                if (result) {
                    const missing = response.missing && response.missing.length ? ' - ' + response.missing.join(', ') : '';
                    result.textContent = (response.message || '') + missing;
                    result.classList.toggle('text-danger', !!missing);
                }
                box.value = '';
            }).catch(() => window.location.reload());
            return;
        }

        const removeButton = event.target.closest('[data-easystud-remove-member]');
        if (removeButton && root.contains(removeButton)) {
            const groupid = removeButton.getAttribute('data-group-id');
            const userid = removeButton.getAttribute('data-user-id');
            const item = removeButton.closest('[data-easystud-member-id]');
            removeMemberFromGroup(root, courseId, groupid, userid, item).catch(() => window.location.reload());
        }
    });
};

// Bind direct grouping group paste actions.
const bindGroupingGroupActions = (root, courseId) => {
    root.addEventListener('click', event => {
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

            postAction({
                courseid: courseId,
                action: 'deletegroups',
                groupids,
            }).then(() => {
                groupids.forEach(groupid => deleteGroupElement(root, groupid));
            }).catch(() => window.location.reload());
        });
    }

    if (deleteGroupingsButton) {
        deleteGroupingsButton.addEventListener('click', () => {
            const selectedGroupings = getSelectedItems(root, 'grouping');
            const groupingids = selectedGroupings.map(grouping => grouping.getAttribute('data-selectable-id'));
            if (!groupingids.length) {
                return;
            }

            postAction({
                courseid: courseId,
                action: 'deletegroupings',
                groupingids,
            }).then(() => {
                groupingids.forEach(groupingid => deleteGroupingElement(root, groupingid));
            }).catch(() => window.location.reload());
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
            }).then(() => {
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
                });
                updateSelectionActions(root);
            }).catch(() => window.location.reload());
        });
    }
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
                root.querySelectorAll('[data-easystud-user].' + selectedClass).forEach(item => {
                    item.classList.remove(selectedClass);
                });
                user.classList.add(selectedClass);
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

        if (action === 'copy-email') {
            copyText(target.getAttribute('data-user-email') || '');
        } else if (action === 'participant-open-details') {
            const button = root.querySelector('[data-easystud-open-user="' + target.getAttribute('data-user-id') + '"]');
            if (button) {
                button.click();
            }
        } else if (action === 'copy-selected-emails') {
            const selected = Array.from(root.querySelectorAll('[data-easystud-user].' + selectedClass));
            const users = selected.length ? selected : [target];
            copyText(users.map(user => user.getAttribute('data-user-email')).filter(Boolean).join('\n'));
        } else if (action === 'clear-selection') {
            root.querySelectorAll('[data-easystud-user].' + selectedClass).forEach(user => {
                user.classList.remove(selectedClass);
            });
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
            removeMemberFromGroup(root, courseId, groupid, userid, target).catch(() => window.location.reload());
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
const init = (rootId, courseId) => {
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
        bindGroupMemberActions(root, courseId);
        bindGroupingGroupActions(root, courseId);
        bindBulkActions(root, courseId);
        bindContextMenu(root, courseId);
        bindTagToggles(root);
        bindParticipantModal(root);
        bindOptionalTools(root);
        bindPastePreview(root);
        bindHoverPopovers(root);
    });
};

return {init: init};
});
