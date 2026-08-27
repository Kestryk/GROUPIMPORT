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
        expectedCues: 51,
        animatedPseudo: '::after',
    },
    {
        id: 'mass-import',
        url: massImportUrl,
        rootSelector: '#local-groupimport-import',
        cueSelector: '.local-groupimport-import__loading-surface',
        frameSelector: '.local-groupimport-import__loading-card',
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

// QA diagnostics only: these bounded phase guards identify a stalled browser
// operation without changing the Playwright test's 900-second global watchdog.
const diagnosticPhaseTimeoutMs = 45000;
const diagnosticLaunchTimeoutMs = 60000;

const phaseMilestone = label => {
    process.stdout.write(`[navigation-skeleton-zoom] ${new Date().toISOString()} ${label}\n`);
};

const runDiagnosticPhase = async(label, operation, timeoutMs = diagnosticPhaseTimeoutMs) => {
    const startedAt = Date.now();
    phaseMilestone(`${label}:start`);
    let timer;
    let outcome = 'complete';
    try {
        const timeout = new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error(
                `diagnostic timeout after ${timeoutMs}ms`
            )), timeoutMs);
        });
        return await Promise.race([
            Promise.resolve().then(operation),
            timeout,
        ]);
    } catch (error) {
        outcome = 'failed';
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${label}: ${message}`);
    } finally {
        clearTimeout(timer);
        phaseMilestone(`${label}:${outcome} (${Date.now() - startedAt}ms)`);
    }
};

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

const login = async(page, phasePrefix = 'login') => {
    await runDiagnosticPhase(`${phasePrefix}:goto`, () => page.goto(massImportUrl, {
        waitUntil: 'domcontentloaded',
        timeout: diagnosticPhaseTimeoutMs,
    }));
    if (!page.url().includes('/login/')) {
        return;
    }
    if (!password) {
        throw new Error('The supervised runner did not supply a Moodle password.');
    }
    await runDiagnosticPhase(`${phasePrefix}:fill-username`, () => page.locator('#username').fill(username));
    await runDiagnosticPhase(`${phasePrefix}:fill-password`, () => page.locator('#password').fill(password));
    await runDiagnosticPhase(`${phasePrefix}:submit`, () => page.locator('#loginbtn').click());
    await runDiagnosticPhase(`${phasePrefix}:wait-after-login`, () => page.waitForURL(
        url => !url.pathname.includes('/login/'),
        {waitUntil: 'domcontentloaded', timeout: diagnosticPhaseTimeoutMs}
    ));
};

const revealSkeleton = async(page, surface, direction, showBusyIndicator = false, phasePrefix = surface.id) => {
    await runDiagnosticPhase(`${phasePrefix}:goto`, () => page.goto(surface.url, {
        waitUntil: 'domcontentloaded',
        timeout: diagnosticPhaseTimeoutMs,
    }));
    if (page.url().includes('/login/')) {
        await login(page, `${phasePrefix}:login`);
        await runDiagnosticPhase(`${phasePrefix}:goto-after-login`, () => page.goto(surface.url, {
            waitUntil: 'domcontentloaded',
            timeout: diagnosticPhaseTimeoutMs,
        }));
    }
    await runDiagnosticPhase(`${phasePrefix}:root-visible`, () => expect(
        page.locator(surface.rootSelector)
    ).toBeVisible({timeout: diagnosticPhaseTimeoutMs}));

    await runDiagnosticPhase(`${phasePrefix}:emulate-media`, () => page.emulateMedia({
        reducedMotion: 'no-preference',
        forcedColors: 'none',
    }));
    await runDiagnosticPhase(`${phasePrefix}:force-skeleton`, () => page.evaluate(({rootSelector, direction, showBusyIndicator}) => {
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
    }, {rootSelector: surface.rootSelector, direction, showBusyIndicator}));

    const skeleton = page.locator(
        `${surface.rootSelector} [data-easystud-loading-skeleton]`
    );
    await runDiagnosticPhase(`${phasePrefix}:skeleton-visible`, () => expect(skeleton).toBeVisible({
        timeout: diagnosticPhaseTimeoutMs,
    }));
    return skeleton;
};

const inspectSkeleton = async(page, surface) => page.evaluate(({surface}) => {
    const root = document.querySelector(surface.rootSelector);
    const skeleton = root?.querySelector('[data-easystud-loading-skeleton]');
    const cueNodes = Array.from(skeleton?.querySelectorAll(surface.cueSelector) || []);
    const frameNodes = Array.from(skeleton?.querySelectorAll(surface.frameSelector) || []);
    const animatedName = node => getComputedStyle(node, surface.animatedPseudo).animationName;
    const animatedDirection = node => getComputedStyle(node, surface.animatedPseudo).animationDirection;
    const readPixels = value => Number.parseFloat(value) || 0;
    const busySpinner = root ? getComputedStyle(root, '::after') : null;
    const busyLabel = root ? getComputedStyle(root, '::before') : null;
    const bounds = skeleton?.getBoundingClientRect();
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

test('Navigation Skeleton stays contained at 320/390 with isolated native 100/200 zoom', async({}, testInfo) => {
    test.setTimeout(900000);
    phaseMilestone('test:started global-timeout=900000ms');
    const profileRoot = process.env.PLAYWRIGHT_PROFILE_DIR;
    if (!profileRoot) {
        throw new Error('The supervised runner must provide an external browser profile directory.');
    }

    const evidence = [];
    for (const zoom of [200, 100]) {
        phaseMilestone(`zoom-${zoom}:started`);
        const zoomProfile = path.join(profileRoot, `native-zoom-${zoom}`);
        await runDiagnosticPhase(`zoom-${zoom}:prepare-profile`, () =>
            prepareIsolatedZoomProfile(zoomProfile, massImportUrl, zoom));
        const context = await runDiagnosticPhase(`zoom-${zoom}:launch-persistent-context`, () =>
            chromium.launchPersistentContext(zoomProfile, {
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
            }), diagnosticLaunchTimeoutMs);

        try {
            const authenticationPage = await runDiagnosticPhase(
                `zoom-${zoom}:authentication-new-page`,
                () => context.newPage()
            );
            await login(authenticationPage, `zoom-${zoom}:authentication`);
            await runDiagnosticPhase(`zoom-${zoom}:authentication-close`, () => authenticationPage.close());

            for (const cell of cells) {
                for (const surface of surfaces) {
                    const cellId = `${surface.id}-${cell.viewport.width}-${cell.direction}-${zoom}`;
                    phaseMilestone(`${cellId}:started`);
                    const page = await runDiagnosticPhase(`${cellId}:new-page`, () => context.newPage());
                    await runDiagnosticPhase(`${cellId}:set-viewport`, () => page.setViewportSize(cell.viewport));
                    const showBusyIndicator = surface.id === 'mass-import';
                    const skeleton = await revealSkeleton(
                        page, surface, cell.direction, showBusyIndicator, cellId
                    );
                    const inspection = await runDiagnosticPhase(
                        `${cellId}:inspect-skeleton`,
                        () => inspectSkeleton(page, surface)
                    );

                    // Preserve the exact native-zoom visual evidence even if a
                    // subsequent containment assertion diagnoses a regression.
                    await runDiagnosticPhase(`${cellId}:skeleton-capture`, () => skeleton.screenshot({
                        path: testInfo.outputPath(`navigation-skeleton-${cellId}.png`),
                    }));
                    if (showBusyIndicator && cell.viewport.width === 320 &&
                        cell.direction === 'ltr' && zoom === 200) {
                        await runDiagnosticPhase(`${cellId}:window-capture`, () => page.screenshot({
                            path: testInfo.outputPath(`navigation-skeleton-${cellId}-window.png`),
                        }));
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

                    await runDiagnosticPhase(`${cellId}:close-page`, () => page.close());
                    phaseMilestone(`${cellId}:completed`);
                }
            }
        } finally {
            await runDiagnosticPhase(`zoom-${zoom}:close-context`, () => context.close(), diagnosticLaunchTimeoutMs);
            phaseMilestone(`zoom-${zoom}:completed`);
        }
    }

    await runDiagnosticPhase('test:write-summary', () => fs.writeFile(
        testInfo.outputPath('navigation-skeleton-native-zoom-summary.json'),
        JSON.stringify(evidence, null, 2),
        'utf8'
    ));
    phaseMilestone('test:completed');
});
