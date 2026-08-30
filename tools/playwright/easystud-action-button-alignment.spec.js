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

const assertButtonGeometry = async button => {
    const geometry = await button.evaluate(node => {
        const icon = node.querySelector(':scope > .fa');
        const text = Array.from(node.children).find(child => !child.classList.contains('fa'));
        const buttonBox = node.getBoundingClientRect();
        const iconBox = icon && icon.getBoundingClientRect();
        const textBox = text && text.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
            alignItems: style.alignItems,
            justifyContent: style.justifyContent,
            gap: parseFloat(style.columnGap || style.gap || '0'),
            centreDelta: iconBox && textBox ? Math.abs(
                (iconBox.top + iconBox.height / 2) - (textBox.top + textBox.height / 2)
            ) : null,
            iconTextGap: iconBox && textBox ? textBox.left - iconBox.right : null,
            visible: buttonBox.width > 0 && buttonBox.height > 0,
        };
    });
    expect(geometry.visible).toBeTruthy();
    expect(geometry.alignItems).toBe('center');
    expect(geometry.justifyContent).toBe('center');
    if (geometry.centreDelta !== null) {
        expect(geometry.centreDelta).toBeLessThanOrEqual(2);
        expect(geometry.iconTextGap).toBeGreaterThan(0);
        expect(geometry.gap).toBeGreaterThan(0);
    }
};

test('EasyStud action controls keep shared alignment and restrained typography', async({page}, testInfo) => {
    test.setTimeout(120000);
    const root = await login(page);

    for (const viewport of [{name: 'desktop', width: 1440, height: 1000},
        {name: 'compact', width: 768, height: 900}]) {
        await page.setViewportSize({width: viewport.width, height: viewport.height});
        await page.waitForTimeout(150);

        const visibleActions = root.locator(
            '.local-groupimport-easystud__panel-actions:visible > .btn:visible, ' +
            '[data-easystud-panel-actions-menu]:not([hidden]) .btn:visible, ' +
            '[data-easystud-open-user]:visible, ' +
            '.local-groupimport-easystud-rename__edit:not([hidden]) .btn:visible'
        );
        const actionCount = await visibleActions.count();
        expect(actionCount).toBeGreaterThan(0);
        for (let index = 0; index < actionCount; index++) {
            await assertButtonGeometry(visibleActions.nth(index));
            await expect(visibleActions.nth(index)).not.toHaveCSS('text-decoration-line', 'underline');
        }

        // Exercise the existing full-details/native-profile path once, without
        // navigating away or changing Moodle data.
        if (viewport.name === 'desktop') {
            const details = root.locator('[data-easystud-open-user]:visible').first();
            if (await details.count()) {
                await details.click();
                const modal = root.locator('[data-easystud-user-modal]:visible');
                await expect(modal).toBeVisible();
                const nativeProfile = modal.locator('.local-groupimport-easystud-settings-modal__native a:visible');
                if (await nativeProfile.count()) {
                    await assertButtonGeometry(nativeProfile);
                }
                await modal.locator('[data-easystud-close-user-modal]').click();
                await expect(modal).toBeHidden();
            }

            const density = root.locator('[data-easystud-density-toggle]:visible').first();
            if (await density.count()) {
                await density.click();
                await expect(root).toHaveClass(/local-groupimport-easystud--compact-users/);
                await density.click();
            }

            const rename = root.locator('[data-easystud-rename-toggle]:visible').first();
            if (await rename.count()) {
                await rename.click();
                const edit = root.locator('.local-groupimport-easystud-rename__edit:not([hidden])').first();
                await expect(edit).toBeVisible();
                for (let index = 0; index < await edit.locator('.btn:visible').count(); index++) {
                    await assertButtonGeometry(edit.locator('.btn:visible').nth(index));
                }
                await edit.locator('[data-easystud-rename-cancel]').click();
            }
        }

        const filters = root.locator('[data-easystud-advanced-filters-toggle]:visible').first();
        await expect(filters).toBeVisible();
        await expect(filters).toHaveCSS('font-weight', '400');
        const sortToggle = root.locator('[data-easystud-list-sort-toggle]:visible').first();
        await expect(sortToggle).toBeVisible();
        await expect(sortToggle).toHaveCSS('font-weight', '400');

        const menuItems = root.locator(
            '[data-easystud-panel-actions-menu] .btn, [data-easystud-group-actions-menu] .btn'
        );
        for (let index = 0; index < await menuItems.count(); index++) {
            await expect(menuItems.nth(index)).not.toHaveCSS('text-decoration-line', 'underline');
        }
        const menuToggle = root.locator('[data-easystud-panel-actions-toggle]:visible').first();
        if (await menuToggle.count()) {
            await menuToggle.click();
            const openItems = root.locator('[data-easystud-panel-actions-menu]:not([hidden]) .btn:visible');
            for (let index = 0; index < await openItems.count(); index++) {
                await openItems.nth(index).hover();
                await expect(openItems.nth(index)).not.toHaveCSS('text-decoration-line', 'underline');
            }
            await page.keyboard.press('Escape');
        }

        const counts = root.locator('.local-groupimport-easystud-pagination__count:visible');
        if (await counts.count()) {
            const weight = await counts.first().evaluate(node => parseInt(getComputedStyle(node).fontWeight, 10));
            expect(weight).toBeGreaterThanOrEqual(600);
        }
        await page.screenshot({path: testInfo.outputPath(`action-button-alignment-${viewport.name}.png`)});
    }
});
