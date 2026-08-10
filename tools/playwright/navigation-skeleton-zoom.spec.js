const {test, expect, chromium} = require('@playwright/test');
const fs = require('fs/promises');
const path = require('path');

const massImportUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const chromiumExecutable = process.env.EASYEDU_CHROMIUM_EXECUTABLE || undefined;

const surfaces = [
    {
        id: 'student-management',
        url: new URL('/local/groupimport/manage.php?id=5', massImportUrl).toString(),
        rootSelector: '#local-groupimport-easystud',
        cueSelector: '.local-groupimport-easystud__loading-surface',
        frameSelector: [
            '.local-groupimport-easystud__loading-panel',
            '.local-groupimport-easystud__loading-search-filter-region',
            '.local-groupimport-easystud__loading-participant-card',
            '.local-groupimport-easystud__loading-structure-card',
            '.local-groupimport-easystud__loading-view-toggle',
        ].join(', '),
        expectedCues: 48,
        animatedPseudo: '::after',
    },
    {
        id: 'mass-import',
        url: massImportUrl,
        rootSelector: '#local-groupimport-import',
        cueSelector: '.local-groupimport-import__loading-surface',
        frameSelector: '.local-groupimport-import__loading-card',
        expectedCues: 19,
        animatedPseudo: '',
    },
];

const cells = [
    {viewport: {width: 320, height: 844}, direction: 'ltr'},
    {viewport: {width: 320, height: 844}, direction: 'rtl'},
    {viewport: {width: 390, height: 844}, direction: 'ltr'},
    {viewport: {width: 390, height: 844}, direction: 'rtl'},
];

const nativeZoomLevel = percentage => Math.log(percentage / 100) / Math.log(1.2);

const prepareIsolatedZoomProfile = async(profileRoot, baseUrl, zoom) => {
    const endpoint = new URL(baseUrl);
    const defaultProfile = path.join(profileRoot, 'Default');
    const preferences = {
        partition: {
            per_host_zoom_levels: {
                [endpoint.host]: {
                    last_modified: String((Date.now() + 11644473600000) * 1000),
                    zoom_level: nativeZoomLevel(zoom),
                },
            },
        },
    };

    await fs.mkdir(defaultProfile, {recursive: true});
    await fs.writeFile(
        path.join(defaultProfile, 'Preferences'),
        JSON.stringify(preferences, null, 2),
        'utf8'
    );
};

const login = async page => {
    await page.goto(massImportUrl, {waitUntil: 'domcontentloaded'});
    if (!page.url().includes('/login/')) {
        return;
    }
    if (!password) {
        throw new Error('The supervised runner did not supply a Moodle password.');
    }
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.locator('#loginbtn').click();
    await page.waitForURL(url => !url.pathname.includes('/login/'), {
        waitUntil: 'domcontentloaded',
    });
};

const revealSkeleton = async(page, surface, direction) => {
    await page.goto(surface.url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await login(page);
        await page.goto(surface.url, {waitUntil: 'domcontentloaded'});
    }
    await expect(page.locator(surface.rootSelector)).toBeVisible({timeout: 30000});

    await page.emulateMedia({reducedMotion: 'no-preference', forcedColors: 'none'});
    await page.evaluate(({rootSelector, direction}) => {
        const root = document.querySelector(rootSelector);
        const skeleton = root?.querySelector('[data-easystud-loading-skeleton]');
        if (!root || !skeleton) {
            throw new Error('Expected EasyStud loading skeleton is absent.');
        }
        document.documentElement.dir = direction;
        root.classList.remove('is-easystud-loading-skeleton-exiting');
        root.dataset.easystudLoadingState = 'loading';
        root.setAttribute('aria-busy', 'true');
        skeleton.hidden = false;
    }, {rootSelector: surface.rootSelector, direction});

    const skeleton = page.locator(
        `${surface.rootSelector} [data-easystud-loading-skeleton]`
    );
    await expect(skeleton).toBeVisible();
    return skeleton;
};

const inspectSkeleton = async(page, surface) => page.evaluate(({surface}) => {
    const root = document.querySelector(surface.rootSelector);
    const skeleton = root?.querySelector('[data-easystud-loading-skeleton]');
    const cueNodes = Array.from(skeleton?.querySelectorAll(surface.cueSelector) || []);
    const frameNodes = Array.from(skeleton?.querySelectorAll(surface.frameSelector) || []);
    const animatedName = node => getComputedStyle(node, surface.animatedPseudo).animationName;
    const animatedDirection = node => getComputedStyle(node, surface.animatedPseudo).animationDirection;
    const bounds = root?.getBoundingClientRect();
    const escapingNodes = Array.from(skeleton?.querySelectorAll(`${surface.cueSelector}, ${surface.frameSelector}`) || [])
        .filter(node => {
            const box = node.getBoundingClientRect();
            return box.left < bounds.left - 1 || box.right > bounds.right + 1;
        }).length;

    return {
        cueCount: cueNodes.length,
        frameCount: frameNodes.length,
        animatedCues: cueNodes.filter(node => animatedName(node) !== 'none').length,
        animatedFrames: frameNodes.filter(node => getComputedStyle(node).animationName !== 'none').length,
        cueDirections: [...new Set(cueNodes.map(animatedDirection))],
        documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        skeletonOverflow: Boolean(root && root.scrollWidth > root.clientWidth + 1),
        escapingNodes,
        innerWidth: window.innerWidth,
        visualViewportScale: window.visualViewport?.scale || 1,
    };
}, {surface});

test('Navigation Skeleton stays contained at 320/390 with isolated native 100/200 zoom', async({}, testInfo) => {
    const profileRoot = process.env.PLAYWRIGHT_PROFILE_DIR;
    if (!profileRoot) {
        throw new Error('The supervised runner must provide an external browser profile directory.');
    }

    const evidence = [];
    for (const zoom of [100, 200]) {
        const zoomProfile = path.join(profileRoot, `native-zoom-${zoom}`);
        await prepareIsolatedZoomProfile(zoomProfile, massImportUrl, zoom);
        const context = await chromium.launchPersistentContext(zoomProfile, {
            // The profile is created inside this run's external artifact directory.
            // No keypress or desktop-window automation is used, so an existing browser
            // profile and its zoom level cannot be changed by this scenario.
            headless: zoom === 100,
            viewport: {width: 390, height: 844},
            deviceScaleFactor: 1,
            executablePath: chromiumExecutable,
            args: zoom === 200 ? [
                '--force-device-scale-factor=1',
                '--window-position=-32000,-32000',
                '--window-size=390,844',
            ] : ['--force-device-scale-factor=1'],
        });

        try {
            const authenticationPage = await context.newPage();
            await login(authenticationPage);
            await authenticationPage.close();

            for (const cell of cells) {
                for (const surface of surfaces) {
                    const page = await context.newPage();
                    await page.setViewportSize(cell.viewport);
                    const skeleton = await revealSkeleton(page, surface, cell.direction);
                    const inspection = await inspectSkeleton(page, surface);
                    const cellId = `${surface.id}-${cell.viewport.width}-${cell.direction}-${zoom}`;

                    expect(inspection.cueCount, `${cellId}: internal cue count`).toBe(surface.expectedCues);
                    expect(inspection.frameCount, `${cellId}: static frame count`).toBeGreaterThan(0);
                    expect(inspection.animatedCues, `${cellId}: animated internal cues`).toBe(surface.expectedCues);
                    expect(inspection.animatedFrames, `${cellId}: animated outer frames`).toBe(0);
                    expect(inspection.documentOverflow, `${cellId}: document horizontal overflow`).toBe(false);
                    expect(inspection.skeletonOverflow, `${cellId}: skeleton horizontal overflow`).toBe(false);
                    expect(inspection.escapingNodes, `${cellId}: skeleton node escaping its root`).toBe(0);
                    if (cell.direction === 'rtl') {
                        expect(inspection.cueDirections, `${cellId}: RTL shimmer direction`).toEqual(['reverse']);
                    }
                    if (zoom === 200) {
                        const nativeZoomProven =
                            cell.viewport.width / Math.max(inspection.innerWidth, 1) >= 1.8 ||
                            inspection.visualViewportScale >= 1.8;
                        expect(nativeZoomProven, `${cellId}: genuine native 200% zoom`).toBe(true);
                    }

                    await skeleton.screenshot({
                        path: testInfo.outputPath(`navigation-skeleton-${cellId}.png`),
                    });
                    evidence.push({cellId, ...inspection});
                    await page.close();
                }
            }
        } finally {
            await context.close();
        }
    }

    await fs.writeFile(
        testInfo.outputPath('navigation-skeleton-native-zoom-summary.json'),
        JSON.stringify(evidence, null, 2),
        'utf8'
    );
});
