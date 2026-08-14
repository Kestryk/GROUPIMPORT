const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const rootSelector = '#local-groupimport-easystud';

const login = async page => {
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running this geometry scenario.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForLoadState('domcontentloaded');
    }

    const root = page.locator(rootSelector);
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
    return root;
};

const rectangle = node => {
    const bounds = node.getBoundingClientRect();
    return {
        bottom: bounds.bottom,
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
    };
};

test('nested Group member count and compact actions remain separate at responsive widths', async({page}, testInfo) => {
    test.setTimeout(120000);
    const root = await login(page);

    for (const width of [320, 390, 768]) {
        await page.setViewportSize({width, height: 900});
        await page.locator('[data-easystud-mobile-view="groupings"]').click();
        await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groupings');

        const grouping = root.locator(
            '[data-easystud-tree] [data-easystud-grouping-id]:has(.local-groupimport-easystud-group):visible'
        ).first();
        await expect(grouping).toBeVisible();
        const groupingToggle = grouping.locator(
            ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
        );
        if ((await groupingToggle.getAttribute('aria-expanded')) !== 'true') {
            await groupingToggle.click();
        }

        const group = grouping.locator(
            ':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]:visible'
        ).first();
        const header = group.locator(':scope > .local-groupimport-easystud-group__header');
        const badge = header.locator(':scope > .badge');
        const actions = header.locator(':scope > [data-easystud-group-actions-toggle]:visible');
        await expect(group).toBeVisible();
        await expect(badge).toBeVisible();
        await expect(actions).toBeVisible();

        const geometry = await Promise.all([
            group.evaluate(rectangle),
            badge.evaluate(rectangle),
            actions.evaluate(rectangle),
            page.evaluate(() => ({
                documentWidth: document.documentElement.scrollWidth,
                viewportWidth: window.innerWidth,
            })),
        ]);
        const [card, count, action, pageGeometry] = geometry;
        console.log(`NESTED_GROUP_CARD_ACTION_COUNT_${width}:`, JSON.stringify({card, count, action, pageGeometry}));

        expect(count.right, `${width}px: member count stays before compact actions`).toBeLessThanOrEqual(action.left - 4);
        expect(action.left, `${width}px: compact actions stay inside the Group card`).toBeGreaterThanOrEqual(card.left - 1);
        expect(action.right, `${width}px: compact actions stay inside the Group card`).toBeLessThanOrEqual(card.right + 1);
        expect(pageGeometry.documentWidth, `${width}px: no horizontal document overflow`).toBeLessThanOrEqual(
            pageGeometry.viewportWidth + 2
        );

        await actions.click();
        await expect(actions).toHaveAttribute('aria-expanded', 'true');
        await expect(header.locator(':scope > [data-easystud-group-actions-menu]:not([hidden])')).toBeVisible();
        await page.screenshot({
            path: testInfo.outputPath(`nested-group-card-action-count-${width}.png`),
            fullPage: false,
        });
        await actions.click();
        await expect(actions).toHaveAttribute('aria-expanded', 'false');
    }
});
