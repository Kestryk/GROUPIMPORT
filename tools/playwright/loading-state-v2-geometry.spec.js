const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const managerUrl = process.env.EASYEDU_LOADING_DIAGNOSTIC_URL || '';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const artifactRoot = process.env.EASYEDU_LOADING_V2_ARTIFACT_ROOT || '';
const assertGeometry = process.env.EASYEDU_LOADING_V2_ASSERT === '1';
const rootId = 'local-groupimport-easystud';
const repositoryRoot = path.resolve(__dirname, '..', '..');
const viewports = [
    {width: 390, height: 844, displacement: 48},
    {width: 520, height: 900, displacement: 48},
    {width: 768, height: 1024, displacement: 48},
    {width: 1024, height: 768, displacement: 64},
    {width: 1440, height: 1000, displacement: 64},
];

test.setTimeout(180000);
test.skip(!managerUrl, 'Missing EASYEDU_LOADING_DIAGNOSTIC_URL for the local authenticated V2 fixture.');
test.skip(!password, 'Missing EASYEDU_MOODLE_PASSWORD for the local authenticated V2 fixture.');
test.skip(!artifactRoot, 'Missing EASYEDU_LOADING_V2_ARTIFACT_ROOT for external V2 geometry evidence.');

const round = value => Math.round(value * 10) / 10;
const abs = value => Math.abs(value || 0);

const withDiagnostics = (url, viewport) => {
    const value = new URL(url);
    value.searchParams.set('easystudloadingdiagnostics', '1');
    value.searchParams.set('easystudv2geometry', String(Date.now()) + '-' + viewport.width);
    return value.toString();
};

const isAmdCandidate = request => /\/lib\/requirejs\.php\/.*\/(?:core\/first|local_groupimport\/course_manager)(?:\.min)?\.js$/i.test(
    new URL(request.url()).pathname
);

const isCourseManagerBundle = body => /define\(["']local_groupimport\/course_manager["']/.test(body);

const authenticate = async page => {
    await page.goto(new URL('/login/index.php', managerUrl).toString(), {waitUntil: 'domcontentloaded'});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await Promise.all([
            page.waitForLoadState('domcontentloaded'),
            page.locator('#loginbtn').click(),
        ]);
    }
};

const observePage = page => {
    const origin = new URL(managerUrl).origin;
    const observations = {
        consoleErrorCount: 0,
        pageErrorCount: 0,
        unhandledRejectionCount: 0,
        relevantNetworkFailureCount: 0,
        expectedTransportFailureCount: 0,
        relevantHttpErrorCount: 0,
    };
    page.on('console', message => {
        if (message.type() === 'error') {
            observations.consoleErrorCount++;
        }
    });
    page.on('pageerror', () => observations.pageErrorCount++);
    page.on('requestfailed', request => {
        if (new URL(request.url()).origin !== origin || !/^(document|script|xhr|fetch)$/.test(request.resourceType())) {
            return;
        }
        if (isAmdCandidate({url: () => request.url()})) {
            observations.expectedTransportFailureCount++;
        } else {
            observations.relevantNetworkFailureCount++;
        }
    });
    page.on('response', response => {
        const request = response.request();
        if (response.status() >= 400 && new URL(response.url()).origin === origin && /^(document|script|xhr|fetch)$/.test(request.resourceType())) {
            observations.relevantHttpErrorCount++;
        }
    });
    return observations;
};

const installAmdGate = async page => {
    let release;
    let hitCount = 0;
    let jobs = [];
    const hold = new Promise(resolve => {
        release = resolve;
    });
    await page.route('**/*', route => {
        const job = (async() => {
            if (!isAmdCandidate(route.request())) {
                await route.continue();
                return;
            }
            try {
                const response = await route.fetch();
                const body = await response.text();
                if (!isCourseManagerBundle(body)) {
                    await route.fulfill({response, body});
                    return;
                }
                hitCount++;
                await hold;
                await route.fulfill({response, body});
            } catch {
                try {
                    await route.continue();
                } catch {
                    // The context may already be closing after a failed assertion.
                }
            }
        })();
        jobs.push(job);
        job.finally(() => {
            jobs = jobs.filter(candidate => candidate !== job);
        });
        return job;
    });
    return {
        count: () => hitCount,
        release: async() => {
            release();
            await Promise.allSettled(jobs);
        },
    };
};

const collectGeometry = page => page.evaluate(() => {
    const root = document.querySelector('#local-groupimport-easystud');
    const round = value => Math.round(value * 10) / 10;
    const isVisible = node => {
        if (!node) {
            return false;
        }
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const rect = node => {
        if (!isVisible(node)) {
            return null;
        }
        const box = node.getBoundingClientRect();
        return {x: Math.round(box.x * 10) / 10, y: Math.round(box.y * 10) / 10, width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10};
    };
    const first = (scope, selector) => scope ? Array.from(scope.querySelectorAll(selector)).find(isVisible) || null : null;
    const two = (scope, selector) => scope ? Array.from(scope.querySelectorAll(selector)).filter(isVisible).slice(0, 2) : [];
    const gap = nodes => nodes.length < 2 ? null : Math.round((nodes[1].getBoundingClientRect().y - nodes[0].getBoundingClientRect().y - nodes[0].getBoundingClientRect().height) * 10) / 10;
    const skeleton = root.querySelector('[data-easystud-loading-skeleton]');
    const real = root.querySelector('[data-easystud-real-content]');
    const loadingParticipants = two(skeleton, '.local-groupimport-easystud__loading-participant-card');
    const loadingStructure = two(skeleton, '.local-groupimport-easystud__loading-structure-card');
    const realParticipants = two(real, '.local-groupimport-easystud-user:not([hidden]):not([data-easystud-page-hidden])');
    const realStructure = two(real, '.local-groupimport-easystud-group:not([hidden]), .local-groupimport-easystud-grouping:not([hidden])');
    const loadingFingerprint = skeleton ? getComputedStyle(skeleton) : null;
    const computed = (scope, selector, property) => {
        const node = first(scope, selector);
        return node ? getComputedStyle(node)[property] : null;
    };
    return {
        global: {
            viewport: {width: window.innerWidth, height: window.innerHeight, visualWidth: window.visualViewport ? round(window.visualViewport.width) : window.innerWidth, visualHeight: window.visualViewport ? round(window.visualViewport.height) : window.innerHeight},
            document: {clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth},
            body: {clientWidth: document.body.clientWidth, scrollWidth: document.body.scrollWidth},
            root: rect(root),
            skeleton: rect(skeleton),
            real: rect(real),
        },
        loading: {
            state: root.getAttribute('data-easystud-loading-state'),
            ariaBusy: root.getAttribute('aria-busy'),
            visible: isVisible(skeleton),
            realHidden: !isVisible(real),
            fingerprint: skeleton ? {
                gap: loadingFingerprint.gap,
                panelGap: computed(skeleton, '.local-groupimport-easystud__loading-panel', 'gap'),
                participantCardMinHeight: computed(skeleton, '.local-groupimport-easystud__loading-participant-card', 'minHeight'),
            } : null,
            counts: {
                surfaces: skeleton ? skeleton.querySelectorAll('.local-groupimport-easystud__loading-surface').length : 0,
                participantCards: skeleton ? skeleton.querySelectorAll('.local-groupimport-easystud__loading-participant-card').length : 0,
                structureCards: skeleton ? skeleton.querySelectorAll('.local-groupimport-easystud__loading-structure-card').length : 0,
                visibleParticipantCards: loadingParticipants.length === 2 ? Array.from(skeleton.querySelectorAll('.local-groupimport-easystud__loading-participant-card')).filter(isVisible).length : 0,
                visibleStructureCards: skeleton ? Array.from(skeleton.querySelectorAll('.local-groupimport-easystud__loading-structure-card')).filter(isVisible).length : 0,
            },
            header: rect(first(skeleton, '.local-groupimport-easystud__loading-header')),
            mobileSwitcher: rect(first(skeleton, '.local-groupimport-easystud__loading-mobile-switcher')),
            desktopToggles: rect(first(skeleton, '.local-groupimport-easystud__loading-desktop-toggles')),
            layout: rect(first(skeleton, '.local-groupimport-easystud__loading-layout')),
            participants: {
                panel: rect(first(skeleton, '.local-groupimport-easystud__loading-panel--participants')),
                header: rect(first(skeleton, '.local-groupimport-easystud__loading-panel--participants .local-groupimport-easystud__loading-panel-header')),
                heading: rect(first(skeleton, '.local-groupimport-easystud__loading-panel--participants .local-groupimport-easystud__loading-panel-heading')),
                actions: rect(first(skeleton, '.local-groupimport-easystud__loading-panel--participants .local-groupimport-easystud__loading-panel-actions')),
                filters: rect(first(skeleton, '.local-groupimport-easystud__loading-search-filter-region')),
                pagination: rect(first(skeleton, '.local-groupimport-easystud__loading-pagination')),
                list: rect(first(skeleton, '.local-groupimport-easystud__loading-participant-list')),
                card: rect(loadingParticipants[0]),
                cardGap: gap(loadingParticipants),
            },
            structure: {
                panel: rect(first(skeleton, '.local-groupimport-easystud__loading-panel--structure')),
                header: rect(first(skeleton, '.local-groupimport-easystud__loading-panel--structure .local-groupimport-easystud__loading-panel-header')),
                tools: rect(first(skeleton, '.local-groupimport-easystud__loading-structure-tools')),
                list: rect(first(skeleton, '.local-groupimport-easystud__loading-structure-list')),
                card: rect(loadingStructure[0]),
                cardGap: gap(loadingStructure),
            },
        },
        ready: {
            state: root.getAttribute('data-easystud-loading-state'),
            ariaBusy: root.getAttribute('aria-busy'),
            skeletonHidden: !isVisible(skeleton),
            visible: isVisible(real),
            header: rect(first(real, '.local-groupimport-easystud__header')),
            mobileSwitcher: rect(first(real, '.local-groupimport-easystud-mobile-view')),
            desktopToggles: rect(first(real, '.local-groupimport-easystud__layout-toggles')),
            layout: rect(first(real, '.local-groupimport-easystud__layout')),
            participants: {
                panel: rect(first(real, '.local-groupimport-easystud__panel--participants')),
                header: rect(first(real, '.local-groupimport-easystud__panel--participants .local-groupimport-easystud__panel-heading')),
                heading: rect(first(real, '.local-groupimport-easystud__panel--participants .local-groupimport-easystud__panel-title-wrap')),
                actions: rect(first(real, '.local-groupimport-easystud__panel--participants .local-groupimport-easystud__panel-actions')),
                filters: rect(first(real, '.local-groupimport-easystud__panel--participants .local-groupimport-easystud__filters')),
                search: rect(first(real, '.local-groupimport-easystud__panel--participants .local-groupimport-easystud__search-row')),
                pagination: rect(first(real, '[data-easystud-pagination="top"]')),
                list: rect(first(real, '.local-groupimport-easystud__participant-list')),
                card: rect(realParticipants[0]),
                cardGap: gap(realParticipants),
                visibleCards: real ? Array.from(real.querySelectorAll('.local-groupimport-easystud-user:not([hidden]):not([data-easystud-page-hidden])')).filter(isVisible).length : 0,
            },
            structure: {
                panel: rect(first(real, '.local-groupimport-easystud__panel--structure')),
                header: rect(first(real, '.local-groupimport-easystud__panel--structure .local-groupimport-easystud__panel-heading')),
                tools: rect(first(real, '.local-groupimport-easystud__panel--structure .local-groupimport-easystud-create-row')),
                list: rect(first(real, '[data-easystud-tree]')),
                card: rect(realStructure[0]),
                cardGap: gap(realStructure),
                visibleCards: realStructure.length ? Array.from(real.querySelectorAll('.local-groupimport-easystud-group:not([hidden]), .local-groupimport-easystud-grouping:not([hidden])')).filter(isVisible).length : 0,
                emptyState: rect(first(real, '.local-groupimport-easystud-tree__empty')),
            },
        },
    };
});

const displacement = geometry => {
    const loading = geometry.loading;
    const ready = geometry.ready;
    const total = abs(geometry.global.real.height - geometry.global.skeleton.height);
    const rectDelta = (left, right) => !left || !right ? null : {x: round(right.x - left.x), y: round(right.y - left.y), width: round(right.width - left.width), height: round(right.height - left.height)};
    const participants = rectDelta(loading.participants.panel, ready.participants.panel);
    const structure = rectDelta(loading.structure.panel, ready.structure.panel);
    const regions = [
        rectDelta(loading.header, ready.header),
        rectDelta(loading.mobileSwitcher || loading.desktopToggles, ready.mobileSwitcher || ready.desktopToggles),
        participants,
        rectDelta(loading.participants.filters, ready.participants.filters),
        rectDelta(loading.participants.pagination, ready.participants.pagination),
        rectDelta(loading.participants.card, ready.participants.card),
        structure,
        rectDelta(loading.structure.card, ready.structure.card),
    ].filter(Boolean);
    const maximumSectionOffset = regions.reduce((maximum, region) => Math.max(maximum, abs(region.x), abs(region.y)), 0);
    const columnRatio = panel => !panel || !panel.width ? null : round(panel.width / (geometry.ready.layout ? geometry.ready.layout.width : panel.width));
    return {
        totalHeight: total,
        direction: geometry.global.real.height > geometry.global.skeleton.height ? 'downward' : geometry.global.real.height < geometry.global.skeleton.height ? 'upward' : 'none',
        maximumSectionOffset,
        root: rectDelta(geometry.global.skeleton, geometry.global.real),
        header: rectDelta(loading.header, ready.header),
        viewControl: rectDelta(loading.mobileSwitcher || loading.desktopToggles, ready.mobileSwitcher || ready.desktopToggles),
        participants,
        participantFilters: rectDelta(loading.participants.filters, ready.participants.filters),
        structure,
        participantsCard: rectDelta(loading.participants.card, ready.participants.card),
        structureCard: rectDelta(loading.structure.card, ready.structure.card),
        pagination: rectDelta(loading.participants.pagination, ready.participants.pagination),
        participantGap: loading.participants.cardGap === null || ready.participants.cardGap === null ? null : round(ready.participants.cardGap - loading.participants.cardGap),
        structureGap: loading.structure.cardGap === null || ready.structure.cardGap === null ? null : round(ready.structure.cardGap - loading.structure.cardGap),
        readyParticipantRatio: columnRatio(ready.participants.panel),
        readyStructureRatio: columnRatio(ready.structure.panel),
        loadingParticipantRatio: !loading.participants.panel || !loading.layout ? null : round(loading.participants.panel.width / loading.layout.width),
        loadingStructureRatio: !loading.structure.panel || !loading.layout ? null : round(loading.structure.panel.width / loading.layout.width),
    };
};

const assertNoOverflow = geometry => {
    expect(geometry.global.document.scrollWidth).toBeLessThanOrEqual(geometry.global.document.clientWidth + 2);
    expect(geometry.global.body.scrollWidth).toBeLessThanOrEqual(geometry.global.viewport.width + 2);
    expect(geometry.global.root.width).toBeGreaterThan(0);
};

const assertPrivacySafe = artifact => {
    const forbiddenKey = /^(?:courseid|course_id|contextid|context_id|userid|user_id|categoryid|category_id|groupid|group_id|coursename|course_name|shortname|course_shortname|groupname|group_name|accountname|account_name|password|cookie|cookies|sesskey|authorization|auth_header|access_token|auth_token|url|href|location)$/i;
    const forbiddenText = /(?:https?:\/\/|sesskey|authorization|bearer\s|cookie|password|course[_-]?id|group[_-]?id|shortname)/i;
    const visit = value => {
        if (!value || typeof value !== 'object') {
            return;
        }
        Object.entries(value).forEach(([key, child]) => {
            expect(forbiddenKey.test(key), 'forbidden V2 artifact key: ' + key).toBe(false);
            visit(child);
        });
    };
    visit(artifact);
    expect(forbiddenText.test(JSON.stringify(artifact))).toBe(false);
};

const prepareArtifactRoot = async() => {
    const root = path.resolve(artifactRoot);
    const allowed = path.resolve('D:\\EasyEduQAArtifacts');
    if (root === repositoryRoot || root.startsWith(repositoryRoot + path.sep) || !(root === allowed || root.startsWith(allowed + path.sep))) {
        throw new Error('EASYEDU_LOADING_V2_ARTIFACT_ROOT must be a new directory below D:\\EasyEduQAArtifacts and outside the repository.');
    }
    await fs.promises.access(root).then(
        () => Promise.reject(new Error('Refusing to overwrite V2 geometry evidence root.')),
        error => {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    );
    await fs.promises.mkdir(path.dirname(root), {recursive: true});
    await fs.promises.mkdir(root);
    return root;
};

const writeJson = async(root, relative, value) => {
    assertPrivacySafe(value);
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep)) {
        throw new Error('V2 geometry artifact escaped its external root.');
    }
    await fs.promises.access(target).then(
        () => Promise.reject(new Error('Refusing to overwrite V2 geometry artifact ' + relative + '.')),
        error => {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    );
    const temporary = target + '.' + process.pid + '.tmp';
    await fs.promises.writeFile(temporary, JSON.stringify(value, null, 2));
    await fs.promises.rename(temporary, target);
};

const redactReadyContent = async page => {
    await page.addStyleTag({content: `
        #${rootId} [data-easystud-real-content],
        #${rootId} [data-easystud-real-content] * {
            color: transparent !important;
            -webkit-text-fill-color: transparent !important;
            text-shadow: none !important;
        }
        #${rootId} [data-easystud-real-content] img,
        #${rootId} [data-easystud-real-content] svg,
        #${rootId} [data-easystud-real-content] picture {
            opacity: 0 !important;
        }
    `});
};

const assertAcceptedGeometry = (viewport, geometry, delta) => {
    expect(delta.totalHeight, 'reveal displacement at ' + viewport.width + 'px').toBeLessThanOrEqual(viewport.displacement);
    expect(abs(delta.root.width), 'root width difference at ' + viewport.width + 'px').toBeLessThanOrEqual(8);
    expect(abs(delta.participants.width), 'participant panel width difference at ' + viewport.width + 'px').toBeLessThanOrEqual(12);
    expect(abs(delta.participants.x), 'participant panel horizontal offset at ' + viewport.width + 'px').toBeLessThanOrEqual(8);
    expect(abs(delta.participants.y), 'participant panel vertical offset at ' + viewport.width + 'px').toBeLessThanOrEqual(8);
    expect(abs(delta.header.y), 'header vertical offset at ' + viewport.width + 'px').toBeLessThanOrEqual(8);
    expect(abs(delta.header.height), 'header height difference at ' + viewport.width + 'px').toBeLessThanOrEqual(12);
    expect(abs(delta.viewControl.y), 'view-control vertical offset at ' + viewport.width + 'px').toBeLessThanOrEqual(8);
    expect(abs(delta.viewControl.height), 'view-control height difference at ' + viewport.width + 'px').toBeLessThanOrEqual(12);
    expect(abs(delta.participantsCard.width), 'participant card width difference at ' + viewport.width + 'px').toBeLessThanOrEqual(12);
    expect(abs(delta.participantsCard.height), 'participant card height difference at ' + viewport.width + 'px').toBeLessThanOrEqual(viewport.width < 1024 ? 12 : 16);
    expect(abs(delta.participantsCard.y), 'participant card vertical offset at ' + viewport.width + 'px').toBeLessThanOrEqual(16);
    expect(abs(delta.participantGap), 'participant card gap difference at ' + viewport.width + 'px').toBeLessThanOrEqual(4);
    expect(abs(delta.participantFilters.y), 'filter region vertical offset at ' + viewport.width + 'px').toBeLessThanOrEqual(8);
    expect(abs(delta.pagination.y), 'pagination vertical offset at ' + viewport.width + 'px').toBeLessThanOrEqual(20);
    expect(abs(geometry.loading.participants.filters.height - geometry.ready.participants.filters.height), 'filter region height difference at ' + viewport.width + 'px').toBeLessThanOrEqual(12);
    expect(abs(geometry.loading.participants.header.height - geometry.ready.participants.header.height), 'toolbar height difference at ' + viewport.width + 'px').toBeLessThanOrEqual(12);
    if (viewport.width === 1440) {
        expect(abs(delta.structure.width), 'structure panel width difference at 1440px').toBeLessThanOrEqual(12);
        expect(abs(delta.structure.x), 'structure panel horizontal offset at 1440px').toBeLessThanOrEqual(8);
        expect(abs(delta.structure.y), 'structure panel vertical offset at 1440px').toBeLessThanOrEqual(8);
        expect(abs(delta.loadingParticipantRatio - delta.readyParticipantRatio), 'participant column ratio difference at 1440px').toBeLessThanOrEqual(0.03);
        expect(abs(delta.loadingStructureRatio - delta.readyStructureRatio), 'structure column ratio difference at 1440px').toBeLessThanOrEqual(0.03);
        if (geometry.ready.structure.card) {
            expect(abs(delta.structureCard.width), 'structure card width difference at 1440px').toBeLessThanOrEqual(12);
            expect(abs(delta.structureCard.height), 'structure card height difference at 1440px').toBeLessThanOrEqual(16);
            expect(abs(delta.structureGap), 'structure card gap difference at 1440px').toBeLessThanOrEqual(4);
        }
    }
};

test('records privacy-safe V2 skeleton and ready geometry at every supported viewport', async({browser}) => {
    const root = await prepareArtifactRoot();
    const summary = {
        schemaVersion: 'easystud-loading-v2-geometry/v1',
        fixture: {alias: 'local-disposable-fixture'},
        assertionMode: assertGeometry,
        viewports: [],
    };

    for (const viewport of viewports) {
        const context = await browser.newContext({
            viewport: {width: viewport.width, height: viewport.height},
            serviceWorkers: 'block',
            extraHTTPHeaders: {'Cache-Control': 'no-cache', Pragma: 'no-cache'},
        });
        const page = await context.newPage();
        let observations;
        let gate;
        try {
            await page.addInitScript(() => {
                window.__easyStudV2UnhandledRejections = 0;
                window.addEventListener('unhandledrejection', () => window.__easyStudV2UnhandledRejections++);
            });
            await authenticate(page);
            observations = observePage(page);
            gate = await installAmdGate(page);
            await page.goto(withDiagnostics(managerUrl, viewport), {waitUntil: 'commit'});
            const manager = page.locator('#' + rootId);
            await manager.waitFor({state: 'attached', timeout: 60000});
            await expect.poll(gate.count).toBeGreaterThan(0);
            await expect(manager).toHaveAttribute('data-easystud-loading-state', 'loading');
            const loadingGeometry = await collectGeometry(page);
            const loadingScroll = await page.evaluate(() => ({x: window.scrollX, y: window.scrollY}));
            expect(loadingGeometry.loading.visible).toBe(true);
            expect(loadingGeometry.loading.realHidden).toBe(true);
            expect(loadingGeometry.loading.counts.surfaces).toBe(126);
            expect(loadingGeometry.loading.counts.participantCards).toBe(20);
            expect(loadingGeometry.loading.counts.structureCards).toBe(10);
            assertNoOverflow(loadingGeometry);
            await manager.screenshot({path: path.join(root, 'viewport-' + viewport.width + '-skeleton.png')});
            await page.evaluate(position => window.scrollTo(position.x, position.y), loadingScroll);
            await gate.release();
            await expect(manager).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await page.evaluate(async() => {
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            });
            await page.evaluate(position => window.scrollTo(position.x, position.y), loadingScroll);
            const readyGeometry = await collectGeometry(page);
            expect(readyGeometry.ready.skeletonHidden).toBe(true);
            expect(readyGeometry.ready.visible).toBe(true);
            assertNoOverflow(readyGeometry);
            observations.unhandledRejectionCount = await page.evaluate(() => window.__easyStudV2UnhandledRejections || 0);
            expect(observations.consoleErrorCount).toBe(0);
            expect(observations.pageErrorCount).toBe(0);
            expect(observations.unhandledRejectionCount).toBe(0);
            expect(observations.relevantNetworkFailureCount).toBe(0);
            expect(observations.relevantHttpErrorCount).toBe(0);
            await redactReadyContent(page);
            await manager.screenshot({path: path.join(root, 'viewport-' + viewport.width + '-ready-redacted.png')});

            const geometry = {
                global: readyGeometry.global,
                loading: loadingGeometry.loading,
                ready: readyGeometry.ready,
            };
            geometry.global.skeleton = loadingGeometry.global.skeleton;
            geometry.global.real = readyGeometry.global.real;
            const delta = displacement(geometry);
            const result = {
                schemaVersion: 'easystud-loading-v2-geometry/v1',
                fixture: {alias: 'local-disposable-fixture'},
                viewport: {width: viewport.width, height: viewport.height},
                geometry,
                displacement: delta,
                dynamicContent: {
                    structureCardComparison: geometry.ready.structure.card ? 'available' : 'missing-structure-card-fixture',
                    structureEmptyState: Boolean(geometry.ready.structure.emptyState),
                },
                browser: observations,
                privacyScan: {passed: true},
            };
            await writeJson(root, 'viewport-' + viewport.width + '.geometry.json', result);
            summary.viewports.push({
                viewport: result.viewport,
                totalHeightDifference: delta.totalHeight,
                direction: delta.direction,
                structureCardComparison: result.dynamicContent.structureCardComparison,
                privacyScan: result.privacyScan,
            });
            if (assertGeometry) {
                assertAcceptedGeometry(viewport, geometry, delta);
            }
        } finally {
            if (gate) {
                await gate.release();
            }
            await page.unrouteAll({behavior: 'ignoreErrors'}).catch(() => {});
            await context.close();
        }
    }
    await writeJson(root, 'summary.json', summary);
});
