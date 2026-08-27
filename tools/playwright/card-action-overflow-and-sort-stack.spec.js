const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const login = async page => {
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running this scenario.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForLoadState('domcontentloaded');
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
    return root;
};

test('Sort and responsive card actions keep one visible menu owner', async({page}, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({width: 768, height: 900});
    const root = await login(page);

    const groupsView = root.locator('[data-easystud-mobile-view="groups"]');
    await expect(groupsView).toBeVisible();
    await groupsView.click();
    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groups');
    await expect(root.locator('[data-easystud-group-id]:visible').first()).toBeVisible();

    // Sort belongs to the Groups view toolbar, not to an individual Group
    // card. Validate its own stacking independently from card action menus.
    const sortDropdown = root.locator(
        '[data-easystud-mobile-entity-region="groups"]:visible [data-easystud-list-sort-dropdown]:visible'
    ).first();
    const sortToggle = sortDropdown.locator('[data-easystud-list-sort-toggle]');
    const sortMenu = sortDropdown.locator('[data-easystud-list-sort-menu]');
    await expect(sortToggle).toBeVisible();
    await sortToggle.click();
    await expect(sortMenu).toBeVisible();
    await expect(sortDropdown).toHaveClass(/is-open/);

    const sortPaintOwner = await sortMenu.evaluate(menu => {
        const bounds = menu.getBoundingClientRect();
        const x = Math.min(bounds.right - 2, Math.max(bounds.left + 2, bounds.left + bounds.width / 2));
        const y = Math.min(bounds.bottom - 2, Math.max(bounds.top + 2, bounds.top + bounds.height / 2));
        const top = document.elementFromPoint(x, y);
        return Boolean(top && (top === menu || menu.contains(top)));
    });
    expect(sortPaintOwner, 'the global Sort menu owns its painted area above the card list').toBe(true);
    await page.screenshot({path: testInfo.outputPath('global-sort-menu-above-group-cards.png')});
    await sortToggle.click();

    const actionGroup = root.locator(
        '[data-easystud-group-id]:visible:has([data-easystud-group-actions-toggle]:visible)'
    ).first();
    const actionToggle = actionGroup.locator('[data-easystud-group-actions-toggle]:visible').first();
    const localMenu = actionGroup.locator('[data-easystud-group-actions-menu]').first();
    await actionToggle.click();
    await expect(localMenu).toBeVisible();
    await expect(root.locator('[data-easystud-context-menu]:not([hidden])')).toHaveCount(0);

    const overflowState = await actionGroup.evaluate(node => ({
        sources: node.querySelectorAll('.is-easystud-card-action-overflow').length,
        menuItems: node.querySelectorAll('[data-easystud-group-actions-menu] ' +
            '.local-groupimport-easystud-group__actions-menu-item').length,
    }));
    expect(overflowState.sources).toBeGreaterThan(0);
    expect(overflowState.menuItems).toBe(overflowState.sources);
    await page.screenshot({path: testInfo.outputPath('single-card-action-overflow-menu.png')});
});
