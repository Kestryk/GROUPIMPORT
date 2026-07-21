const {test, expect} = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const managementUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const massImportUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const wcagTags = [
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22a',
    'wcag22aa',
];

test.setTimeout(60000);

/**
 * Opens an authenticated plugin page and waits for its owned region.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @param {string} url Plugin URL.
 * @param {string} selector Plugin-owned region.
 * @returns {Promise<void>}
 */
const openPluginPage = async(page, url, selector) => {
    await page.goto(url);
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the accessibility smoke.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
    }

    const region = page.locator(selector);
    await expect(region).toBeVisible({timeout: 60000});
    if (selector === '#local-groupimport-easystud') {
        await expect(region).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
    }
};

/**
 * Runs axe against one plugin-owned region.
 *
 * Only critical and serious findings block this first smoke. The complete
 * result remains visible in the assertion message for progressive adoption.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @param {string} selector Plugin-owned region.
 * @returns {Promise<void>}
 */
const expectNoBlockingAxeViolations = async(page, selector) => {
    const result = await new AxeBuilder({page})
        .include(selector)
        .withTags(wcagTags)
        .analyze();
    const blocking = result.violations.filter(violation =>
        violation.impact === 'critical' || violation.impact === 'serious'
    );
    const summary = blocking.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.flatMap(node => node.target),
    }));

    expect(blocking, JSON.stringify(summary, null, 2)).toEqual([]);
};

test('simplified student management has no blocking axe violations', async({page}) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await openPluginPage(page, managementUrl, '#local-groupimport-easystud');
    await expectNoBlockingAxeViolations(page, '#local-groupimport-easystud');
});

test('responsive EasyStud workspace has no blocking axe violations', async({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await openPluginPage(page, managementUrl, '#local-groupimport-easystud');
    await expect(page.locator('[data-easystud-mobile-view-switcher]')).toBeVisible();
    await expectNoBlockingAxeViolations(page, '#local-groupimport-easystud');
});

test('mass import has no blocking axe violations', async({page}) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await openPluginPage(page, massImportUrl, '#local-groupimport-import');
    await expectNoBlockingAxeViolations(page, '#local-groupimport-import');
});
