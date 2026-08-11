const {test, expect} = require('@playwright/test');

const managementUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';

const openManagementPage = async page => {
    await page.goto(managementUrl, {waitUntil: 'domcontentloaded', timeout: 60000});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME || '');
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD || '');
        await page.locator('#loginbtn').click();
    }

    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
};

test('collapsed group members exclude hidden actions from keyboard focus', async({page}, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({width: 1440, height: 1000});

    const consoleErrors = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', error => consoleErrors.push(error.message));

    await openManagementPage(page);

    const groups = page.locator('[data-easystud-group-id]');
    const groupIndex = await groups.evaluateAll(nodes => nodes.findIndex(group =>
        Array.from(group.querySelectorAll('[data-easystud-member-id]'))
            .filter(member => !member.hidden).length > 2
    ));
    expect(groupIndex).toBeGreaterThanOrEqual(0);

    const group = groups.nth(groupIndex);
    const toggle = group.locator('[data-easystud-group-members-toggle]');
    const members = group.locator('[data-easystud-member-id]');
    const extraMember = members.nth(2);
    const extraAction = extraMember.locator('button, a[href], input, select, textarea').first();
    await expect(toggle).toBeVisible();
    await expect(extraAction).toHaveCount(1);

    if (await toggle.getAttribute('aria-expanded') === 'true') {
        await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(extraMember).toHaveAttribute('inert', '');
    await expect(extraAction).toHaveAttribute('tabindex', '-1');

    await toggle.focus();
    await page.keyboard.press('Tab');
    const collapsedFocus = await group.evaluate(node => {
        const active = document.activeElement;
        const extra = node.querySelectorAll('[data-easystud-member-id]')[2];
        return {
            activeTag: active ? active.tagName : null,
            reachesExtraMember: !!(active && extra && extra.contains(active)),
        };
    });
    expect(collapsedFocus.reachesExtraMember).toBe(false);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(extraMember).not.toHaveAttribute('inert', '');
    await expect.poll(() => extraAction.evaluate(action => action.tabIndex)).toBe(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(extraAction).toHaveAttribute('tabindex', '-1');

    const diagnostics = await group.evaluate(node => {
        const toggleControl = node.querySelector('[data-easystud-group-members-toggle]');
        const extra = node.querySelectorAll('[data-easystud-member-id]')[2];
        const action = extra.querySelector('button, a[href], input, select, textarea');
        return {
            groupId: node.getAttribute('data-easystud-group-id'),
            expanded: toggleControl.getAttribute('aria-expanded'),
            extraMemberInert: extra.hasAttribute('inert'),
            extraActionTabIndex: action.tabIndex,
            focusReturnedToToggle: document.activeElement === toggleControl,
        };
    });
    await testInfo.attach('group-member-collapsible-focus-diagnostics.json', {
        body: JSON.stringify({diagnostics, collapsedFocus, consoleErrors}, null, 2),
        contentType: 'application/json',
    });
    await page.screenshot({
        path: testInfo.outputPath('group-member-collapsible-focus.png'),
        fullPage: false,
    });

    expect(diagnostics.extraMemberInert).toBe(true);
    expect(diagnostics.extraActionTabIndex).toBe(-1);
    expect(diagnostics.focusReturnedToToggle).toBe(true);
    expect(consoleErrors).toEqual([]);
});
