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
        navigationFrameSelector: '.local-groupimport-easystud__loading-navigation-frame',
        navigationCueStackSelector: '.local-groupimport-easystud__loading-navigation-cues',
        navigationCueSelector: '.local-groupimport-easystud__loading-navigation-cue',
        navigationGuideSelector: '.local-groupimport-easystud__loading-navigation-guide',
        realNavigationSelector: '.local-groupimport-easystud__navigation',
        realNavigationVariantSelector: '[data-easyedu-navigation-desktop]',
        mainFrameSelector: [
            '.local-groupimport-easystud__loading-panel--participants',
            '.local-groupimport-easystud__loading-panel--structure',
        ].join(', '),
        cardSelector: [
            '.local-groupimport-easystud__loading-participant-card',
            '.local-groupimport-easystud__loading-structure-card',
        ].join(', '),
        toggleSelector: '.local-groupimport-easystud__loading-view-toggle',
        expectedCues: 51,
        animatedPseudo: '::after',
    },
    {
        id: 'mass-import',
        url: massImportUrl,
        rootSelector: '#local-groupimport-import',
        cueSelector: '.local-groupimport-import__loading-surface',
        frameSelector: '.local-groupimport-import__loading-card',
        navigationFrameSelector: '.local-groupimport-import__loading-navigation-frame',
        navigationCueStackSelector: '.local-groupimport-import__loading-navigation-cues',
        navigationCueSelector: '.local-groupimport-import__loading-navigation-cue',
        navigationGuideSelector: '.local-groupimport-import__loading-navigation-guide',
        realNavigationSelector: '.local-groupimport-import-navigation',
        realNavigationVariantSelector: '[data-easyedu-navigation-desktop]',
        mainFrameSelector: '.local-groupimport-import__loading-card',
        cardSelector: '',
        toggleSelector: '',
        expectedCues: 22,
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
                x: {
                    [endpoint.host]: {
                        last_modified: String((Date.now() + 11644473600000) * 1000),
                        zoom_level: nativeZoomLevel(zoom),
                    },
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

const revealSkeleton = async(page, surface, direction, showBusyIndicator = false) => {
    await page.goto(surface.url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await login(page);
        await page.goto(surface.url, {waitUntil: 'domcontentloaded'});
    }
    await expect(page.locator(surface.rootSelector)).toBeVisible({timeout: 30000});

    await page.emulateMedia({reducedMotion: 'no-preference', forcedColors: 'none'});
    await page.evaluate(({rootSelector, direction, showBusyIndicator}) => {
        const root = document.querySelector(rootSelector);
        const skeleton = root?.querySelector('[data-easystud-loading-skeleton]');
        if (!root || !skeleton) {
            throw new Error('Expected EasyStud loading skeleton is absent.');
        }
        document.documentElement.dir = direction;
        root.classList.remove('is-easystud-loading-skeleton-exiting');
        root.classList.toggle('is-action-busy', showBusyIndicator);
        root.dataset.easystudLoadingState = 'loading';
        root.setAttribute('aria-busy', 'true');
        skeleton.hidden = false;
    }, {rootSelector: surface.rootSelector, direction, showBusyIndicator});

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
    const navigationFrame = skeleton?.querySelector(surface.navigationFrameSelector);
    const navigationCueStack = skeleton?.querySelector(surface.navigationCueStackSelector);
    const navigationCueNodes = Array.from(
        navigationCueStack?.querySelectorAll(surface.navigationCueSelector) || []
    );
    const navigationGuide = skeleton?.querySelector(surface.navigationGuideSelector);
    const realNavigation = root?.querySelector(surface.realNavigationSelector);
    const realNavigationVariant = realNavigation?.querySelector(surface.realNavigationVariantSelector);
    const animatedName = node => getComputedStyle(node, surface.animatedPseudo).animationName;
    const animatedDirection = node => getComputedStyle(node, surface.animatedPseudo).animationDirection;
    const readPixels = value => Number.parseFloat(value) || 0;
    const borderMetrics = node => {
        if (!node) {
            return null;
        }
        const style = getComputedStyle(node);
        return {
            blockStart: readPixels(style.borderBlockStartWidth),
            inlineStart: readPixels(style.borderInlineStartWidth),
            border: readPixels(style.borderTopWidth),
        };
    };
    const measureNavigationReference = node => {
        if (!node) {
            return 0;
        }
        const clone = node.cloneNode(true);
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(idNode => idNode.removeAttribute('id'));
        clone.style.cssText = [
            'display: flex !important',
            'position: absolute',
            'visibility: hidden',
            'inset: -10000px auto auto -10000px',
            'inline-size: 100%',
            'max-inline-size: 100%',
        ].join(';');
        document.body.appendChild(clone);
        const height = clone.getBoundingClientRect().height;
        clone.remove();
        return height;
    };
    const busySpinner = root ? getComputedStyle(root, '::after') : null;
    const busyLabel = root ? getComputedStyle(root, '::before') : null;
    const bounds = skeleton?.getBoundingClientRect();
    const navigationCueRects = navigationCueNodes.map(node => {
        const box = node.getBoundingClientRect();
        return {height: box.height, top: box.top, width: box.width};
    });
    const navigationCueRows = [...new Set(navigationCueRects.map(box => Math.round(box.top * 10) / 10))];
    const navigationFrameStyle = navigationFrame ? getComputedStyle(navigationFrame) : null;
    const navigationFrameHeight = navigationFrame?.getBoundingClientRect().height || 0;
    const navigationGuideRect = navigationGuide?.getBoundingClientRect();
    const focusableCount = skeleton?.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).length || 0;
    const realNavigationHeight = measureNavigationReference(realNavigationVariant);
    const mainFrames = Array.from(skeleton?.querySelectorAll(surface.mainFrameSelector || '') || []);
    const cards = surface.cardSelector ?
        Array.from(skeleton?.querySelectorAll(surface.cardSelector) || []) : [];
    const toggle = surface.toggleSelector ? skeleton?.querySelector(surface.toggleSelector) : null;
    const escapingNodes = Array.from(skeleton?.querySelectorAll(`${surface.cueSelector}, ${surface.frameSelector}`) || [])
        .filter(node => {
            const box = node.getBoundingClientRect();
            // Compact Student Management intentionally hides the Structure
            // panel. Its display:none descendants have a 0 x 0 rectangle and
            // cannot overflow, so only rendered frames participate here.
            if (box.width === 0 && box.height === 0) {
                return false;
            }
            return box.left < bounds.left - 1 || box.right > bounds.right + 1;
        })
        .map(node => {
            const box = node.getBoundingClientRect();
            return {
                className: node.className,
                left: box.left,
                right: box.right,
            };
        });

    return {
        cueCount: cueNodes.length,
        frameCount: frameNodes.length,
        animatedCues: cueNodes.filter(node => animatedName(node) !== 'none').length,
        animatedFrames: frameNodes.filter(node => getComputedStyle(node).animationName !== 'none').length,
        cueDirections: [...new Set(cueNodes.map(animatedDirection))],
        navigationCueRows,
        navigationCueRects,
        navigationGuideRect: navigationGuideRect ? {
            height: navigationGuideRect.height,
            width: navigationGuideRect.width,
        } : null,
        navigationGuideIsCircle: Boolean(
            navigationGuideRect && navigationGuideRect.width > 0 &&
            Math.abs(navigationGuideRect.width - navigationGuideRect.height) <= 1
        ),
        skeletonAriaHidden: skeleton?.getAttribute('aria-hidden') === 'true',
        skeletonFocusableCount: focusableCount,
        navigationFrameHeight,
        navigationFrameBorder: navigationFrameStyle ? {
            blockStart: readPixels(navigationFrameStyle.borderBlockStartWidth),
            inlineStart: readPixels(navigationFrameStyle.borderInlineStartWidth),
        } : null,
        navigationHeightDelta: Math.abs(navigationFrameHeight - realNavigationHeight),
        realNavigationHeight,
        mainFrameBorders: mainFrames.map(borderMetrics),
        cardBorders: cards.map(borderMetrics),
        toggleBorder: borderMetrics(toggle),
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        skeletonClientWidth: skeleton?.clientWidth || 0,
        skeletonScrollWidth: skeleton?.scrollWidth || 0,
        skeletonOverflow: Boolean(skeleton && skeleton.scrollWidth > skeleton.clientWidth + 1),
        skeletonBounds: bounds ? {left: bounds.left, right: bounds.right} : null,
        escapingNodes,
        innerWidth: window.innerWidth,
        rootFontSize: readPixels(getComputedStyle(document.documentElement).fontSize),
        visualViewportScale: window.visualViewport?.scale || 1,
        busyIndicator: busySpinner && busyLabel ? {
            enabled: root.classList.contains('is-action-busy'),
            spinnerBottom: readPixels(busySpinner.bottom),
            spinnerHeight: readPixels(busySpinner.height),
            spinnerRight: readPixels(busySpinner.right),
            spinnerWidth: readPixels(busySpinner.width),
            labelBottom: readPixels(busyLabel.bottom),
            labelRight: readPixels(busyLabel.right),
        } : null,
    };
}, {surface});

test('K3.1 Navigation Skeleton stays single-row and contained at 320/390 with isolated native 100/200 zoom', async({}, testInfo) => {
    test.setTimeout(900000);
    const profileRoot = process.env.PLAYWRIGHT_PROFILE_DIR;
    if (!profileRoot) {
        throw new Error('The supervised runner must provide an external browser profile directory.');
    }

    const evidence = [];
    for (const zoom of [200, 100]) {
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
                    const showBusyIndicator = surface.id === 'mass-import';
                    const skeleton = await revealSkeleton(
                        page, surface, cell.direction, showBusyIndicator
                    );
                    const inspection = await inspectSkeleton(page, surface);
                    const cellId = `${surface.id}-${cell.viewport.width}-${cell.direction}-${zoom}`;

                    // Preserve the exact native-zoom visual evidence even if a
                    // subsequent containment assertion diagnoses a regression.
                    await skeleton.screenshot({
                        path: testInfo.outputPath(`navigation-skeleton-${cellId}.png`),
                    });
                    if (showBusyIndicator && cell.viewport.width === 320 &&
                        cell.direction === 'ltr' && zoom === 200) {
                        await page.screenshot({
                            path: testInfo.outputPath(`navigation-skeleton-${cellId}-window.png`),
                        });
                    }
                    evidence.push({cellId, ...inspection});

                    expect(inspection.cueCount, `${cellId}: internal cue count`).toBe(surface.expectedCues);
                    expect(inspection.frameCount, `${cellId}: static frame count`).toBeGreaterThan(0);
                    expect(inspection.animatedCues, `${cellId}: animated internal cues`).toBe(surface.expectedCues);
                    expect(inspection.animatedFrames, `${cellId}: animated outer frames`).toBe(0);
                    expect(inspection.documentOverflow, `${cellId}: document horizontal overflow`).toBe(false);
                    expect(inspection.documentScrollWidth, `${cellId}: document width`).toBeLessThanOrEqual(
                        inspection.documentClientWidth + 1
                    );
                    expect(inspection.skeletonScrollWidth, `${cellId}: skeleton width`).toBeLessThanOrEqual(
                        inspection.skeletonClientWidth + 1
                    );
                    expect(inspection.skeletonOverflow, `${cellId}: skeleton horizontal overflow`).toBe(false);
                    expect(inspection.navigationCueRows, `${cellId}: Navigation Skeleton cue rows`).toHaveLength(1);
                    expect(inspection.navigationCueRects, `${cellId}: Navigation Skeleton cue count`).toHaveLength(2);
                    expect(inspection.navigationGuideIsCircle, `${cellId}: Guide cue circle`).toBe(true);
                    expect(inspection.skeletonAriaHidden, `${cellId}: Skeleton aria-hidden`).toBe(true);
                    expect(inspection.skeletonFocusableCount, `${cellId}: Skeleton focusable nodes`).toBe(0);
                    expect(inspection.navigationFrameHeight, `${cellId}: Navigation Skeleton frame height`).toBeGreaterThan(0);
                    expect(inspection.realNavigationHeight, `${cellId}: real Navigation reference height`).toBeGreaterThan(0);
                    expect(
                        inspection.navigationHeightDelta,
                        `${cellId}: Navigation Skeleton height close to real Navigation`
                    ).toBeLessThanOrEqual(Math.max(inspection.rootFontSize * 1.25, 20));
                    expect(
                        inspection.navigationFrameBorder.inlineStart,
                        `${cellId}: Navigation Skeleton frame has no lateral accent`
                    ).toBeLessThanOrEqual(2);
                    for (const border of inspection.mainFrameBorders) {
                        expect(border.blockStart, `${cellId}: principal frame top accent`).toBeGreaterThanOrEqual(
                            inspection.rootFontSize * 0.2
                        );
                        expect(border.inlineStart, `${cellId}: principal frame lateral edge is neutral`).toBeLessThanOrEqual(2);
                    }
                    for (const border of inspection.cardBorders) {
                        expect(border.inlineStart, `${cellId}: card lateral accent`).toBeGreaterThanOrEqual(
                            inspection.rootFontSize * 0.2
                        );
                        expect(border.blockStart, `${cellId}: card top edge is neutral`).toBeLessThanOrEqual(2);
                    }
                    if (inspection.toggleBorder) {
                        expect(inspection.toggleBorder.border, `${cellId}: view toggle has no border`).toBe(0);
                        expect(inspection.toggleBorder.blockStart, `${cellId}: view toggle top edge has no border`).toBe(0);
                        expect(inspection.toggleBorder.inlineStart, `${cellId}: view toggle lateral edge has no border`).toBe(0);
                    }
                    if (showBusyIndicator && cell.viewport.width === 320 && zoom === 200) {
                        const busy = inspection.busyIndicator;
                        expect(busy.enabled, `${cellId}: busy indicator enabled`).toBe(true);
                        expect(busy.spinnerWidth, `${cellId}: compact busy spinner width`).toBeLessThanOrEqual(
                            inspection.rootFontSize * 1.61
                        );
                        expect(busy.spinnerHeight, `${cellId}: compact busy spinner height`).toBeLessThanOrEqual(
                            inspection.rootFontSize * 1.61
                        );
                        expect(busy.spinnerBottom - busy.labelBottom,
                            `${cellId}: busy spinner lower-edge clearance`).toBeCloseTo(
                            inspection.rootFontSize * 0.5, 1
                        );
                        expect(busy.spinnerRight - busy.labelRight,
                            `${cellId}: busy spinner end-edge clearance`).toBeCloseTo(
                            inspection.rootFontSize * 0.65, 1
                        );
                    }
                    expect(
                        inspection.escapingNodes,
                        `${cellId}: skeleton nodes escaping its root ${JSON.stringify(inspection.skeletonBounds)}`
                    ).toEqual([]);
                    if (cell.direction === 'rtl') {
                        expect(inspection.cueDirections, `${cellId}: RTL shimmer direction`).toEqual(['reverse']);
                    }
                    if (zoom === 200) {
                        const nativeZoomProven =
                            cell.viewport.width / Math.max(inspection.innerWidth, 1) >= 1.8 ||
                            inspection.visualViewportScale >= 1.8;
                        expect(nativeZoomProven, `${cellId}: genuine native 200% zoom`).toBe(true);
                    }

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
