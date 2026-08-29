const {test, expect} = require('@playwright/test');

const manageUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const massImportUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const adminUrl = new URL('/admin/settings.php?section=local_groupimport', manageUrl).toString();
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

test.describe.configure({timeout: 180000});

const login = async(page, url) => {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Saved credentials are required for the Platform wave validation bundle.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(urlValue => !urlValue.pathname.includes('/login/'), {
            timeout: 60000,
            waitUntil: 'domcontentloaded',
        });
        await page.goto(url, {waitUntil: 'domcontentloaded'});
    }
};

const assertNoScriptFallback = async(page, url, rootSelector) => {
    await login(page, url);
    const root = page.locator(rootSelector);
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root.locator('[data-easystud-loading-skeleton]')).toBeHidden();
    await expect(root.locator('[data-easystud-real-content], [data-local-groupimport-admin-features]')
        .first()).toBeVisible();
    await expect(root).not.toHaveAttribute('aria-busy', 'true');
};

test('EED-UI-2026-0030-0033 Platform wave: global controls plus Mass Import and Administration no-script lifecycle', async({browser, page}, testInfo) => {
    await page.setViewportSize({width: 1440, height: 1000});
    await login(page, manageUrl);
    const manageRoot = page.locator('#local-groupimport-easystud');
    await expect(manageRoot).toBeVisible({timeout: 60000});
    await expect(manageRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(manageRoot.locator('.local-groupimport-easystud__panel-actions:visible button:disabled'))
        .toHaveCount(1);
    await expect(manageRoot.locator('.local-groupimport-easystud-tree__section--ungrouped')).toBeVisible();
    await expect(manageRoot.locator('[data-easystud-pagination="bottom"]:visible').first()).toBeVisible();
    await page.screenshot({path: testInfo.outputPath('0030-global-controls-desktop.png'), fullPage: true});

    await page.setViewportSize({width: 390, height: 844});
    await page.locator('[data-easystud-mobile-view="groups"]').click();
    await expect(manageRoot).toHaveAttribute('data-easystud-mobile-view-active', 'groups');
    const next = manageRoot.locator('[data-easystud-page-next]:visible').first();
    await next.focus();
    await expect(next).toBeFocused();
    await page.screenshot({path: testInfo.outputPath('0030-global-controls-mobile.png'), fullPage: true});

    await page.goto(massImportUrl, {waitUntil: 'domcontentloaded'});
    const massRoot = page.locator('#local-groupimport-import');
    await expect(massRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(massRoot.locator('[data-easystud-real-content]')).toBeVisible();
    await page.screenshot({path: testInfo.outputPath('0032-mass-import-normal-lifecycle.png'), fullPage: true});

    await page.goto(adminUrl, {waitUntil: 'domcontentloaded'});
    const adminRoot = page.locator('#page-admin-setting-local_groupimport');
    await expect(adminRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(adminRoot.locator('[data-local-groupimport-admin-features]')).toBeVisible();
    await page.screenshot({path: testInfo.outputPath('0033-admin-normal-lifecycle.png'), fullPage: true});

    const noScriptContext = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}});
    try {
        const noScriptPage = await noScriptContext.newPage();
        await assertNoScriptFallback(noScriptPage, massImportUrl, '#local-groupimport-import');
        await noScriptPage.screenshot({path: testInfo.outputPath('0032-mass-import-no-script.png'), fullPage: true});
        await assertNoScriptFallback(noScriptPage, adminUrl, '#page-admin-setting-local_groupimport');
        await noScriptPage.screenshot({path: testInfo.outputPath('0033-admin-no-script.png'), fullPage: true});
    } finally {
        await noScriptContext.close();
    }
});
