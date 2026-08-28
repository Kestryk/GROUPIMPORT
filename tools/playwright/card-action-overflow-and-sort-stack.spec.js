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

const assertControlWeight = async(locator, expectedWeight, label) => {
    await expect(locator, label).toBeVisible();
    const typography = await locator.evaluate(node => {
        const style = window.getComputedStyle(node);
        return {family: style.fontFamily, weight: style.fontWeight};
    });
    expect(typography.family, `${label} inherits a visible Moodle font family`).not.toBe('');
    expect(typography.weight, label).toBe(expectedWeight);
};

const assertPlainMoreActionsTrigger = async trigger => {
    const appearance = await trigger.evaluate(node => {
        const style = window.getComputedStyle(node);
        return {
            borderWidths: [
                style.borderTopWidth,
                style.borderRightWidth,
                style.borderBottomWidth,
                style.borderLeftWidth,
            ].map(value => Number.parseFloat(value)),
            borderRadius: Number.parseFloat(style.borderTopLeftRadius),
            height: node.getBoundingClientRect().height,
        };
    });
    expect(appearance.borderWidths, 'More actions has no pill border').toEqual([0, 0, 0, 0]);
    expect(
        appearance.borderRadius * 2,
        'More actions uses a compact corner radius rather than a pill shape'
    ).toBeLessThan(appearance.height);
    await trigger.hover();
    await expect.poll(
        () => trigger.evaluate(node => window.getComputedStyle(node).textDecorationLine),
        {message: 'More actions trigger is not underlined on hover'}
    ).toBe('none');
};

const assertOneOverflowMenu = async(root, card) => {
    const actionToggle = card.locator('[data-easystud-group-actions-toggle]:visible').first();
    const localMenu = card.locator('[data-easystud-group-actions-menu]').first();
    await expect(actionToggle).toBeVisible();
    await assertPlainMoreActionsTrigger(actionToggle);
    await actionToggle.click();
    await expect(localMenu).toBeVisible();
    await expect(root.locator('[data-easystud-group-actions-menu]:visible')).toHaveCount(1);
    await expect(root.locator('[data-easystud-context-menu]:not([hidden])')).toHaveCount(0);

    const menuItem = localMenu.locator('.local-groupimport-easystud-group__actions-menu-item:visible').first();
    await expect(menuItem).toBeVisible();
    await menuItem.hover();
    await expect.poll(
        () => menuItem.evaluate(node => window.getComputedStyle(node).textDecorationLine),
        {message: 'More actions menu item is not underlined on hover'}
    ).toBe('none');

    const overflowState = await card.evaluate(node => ({
        sources: node.querySelectorAll('.is-easystud-card-action-overflow').length,
        menuItems: node.querySelectorAll('[data-easystud-group-actions-menu] ' +
            '.local-groupimport-easystud-group__actions-menu-item').length,
    }));
    expect(overflowState.sources).toBeGreaterThan(0);
    expect(overflowState.menuItems).toBe(overflowState.sources);
};

const assertGroupingLabelOrMoreActionsRecovery = async(root, card) => {
    const summary = card.locator(
        '.local-groupimport-easystud-group__groupings--inline ' +
        '.local-groupimport-easystud-token--grouping'
    ).first();

    if (await summary.isVisible()) {
        const label = await summary.evaluate(node => {
            const style = window.getComputedStyle(node);
            return {
                clientWidth: node.clientWidth,
                scrollWidth: node.scrollWidth,
                text: node.textContent.trim(),
                textOverflow: style.textOverflow,
            };
        });
        expect(label.text).not.toBe('');
        expect(label.textOverflow, 'a visible Grouping label is never ellipsized').not.toBe('ellipsis');
        expect(label.scrollWidth, 'a visible Grouping label fits its rendered token')
            .toBeLessThanOrEqual(label.clientWidth + 1);
        return;
    }

    const moreActions = card.locator('[data-easystud-card-menu]:visible').first();
    const contextMenu = root.locator('[data-easystud-context-menu]');
    const recoveredLabel = contextMenu.locator(
        '[data-easystud-masked-pill-action="grouping-summary-toggle"]'
    );
    await expect(moreActions).toBeVisible();
    await moreActions.click();
    await expect(recoveredLabel).toHaveCount(1);
    await expect(recoveredLabel).toBeVisible();
    await expect(recoveredLabel).toHaveAttribute('aria-label', /\S/);
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

    const filterToggle = root.locator('[data-easystud-advanced-filters-toggle]:visible').first();
    const resultCount = root.locator('.local-groupimport-easystud-pagination__count:visible').first();
    const sortDropdown = root.locator(
        '[data-easystud-mobile-entity-region="groups"]:visible [data-easystud-list-sort-dropdown]:visible'
    ).first();
    const sortCaption = sortDropdown.locator('xpath=preceding-sibling::span[1]');
    const sortToggle = sortDropdown.locator('[data-easystud-list-sort-toggle]');
    const sortMenu = sortDropdown.locator('[data-easystud-list-sort-menu]');
    await assertControlWeight(filterToggle, '400', 'More filters uses regular weight');
    await assertControlWeight(resultCount, '600', 'Result count uses semibold weight');
    if (await sortCaption.count()) {
        await assertControlWeight(sortCaption, '400', 'Sort caption uses regular weight');
    }
    await assertControlWeight(sortToggle, '400', 'Selected Sort value uses regular weight');
    await expect(sortToggle).toBeVisible();
    await sortToggle.click();
    await expect(sortMenu).toBeVisible();
    await expect(sortDropdown).toHaveClass(/is-open/);
    await page.screenshot({path: testInfo.outputPath('global-sort-menu-open-before-paint-assertion.png')});

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
    await assertOneOverflowMenu(root, actionGroup);
    await page.screenshot({path: testInfo.outputPath('single-card-action-overflow-menu.png')});

    const groupingsView = root.locator('[data-easystud-mobile-view="groupings"]');
    await expect(groupingsView).toBeVisible();
    await groupingsView.click();
    await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groupings');
    await expect(root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible').first()).toBeVisible();

    const groupingGroup = root.locator(
        '[data-easystud-tree] [data-easystud-group-id]:visible:has(' +
        '.local-groupimport-easystud-group__groupings--inline)'
    ).first();
    await expect(groupingGroup).toBeVisible();
    await assertGroupingLabelOrMoreActionsRecovery(root, groupingGroup);
    await page.screenshot({path: testInfo.outputPath('groupings-grouping-label-or-more-actions.png')});
});
