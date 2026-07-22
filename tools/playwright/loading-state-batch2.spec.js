const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const managerUrl = process.env.EASYEDU_LOADING_DIAGNOSTIC_URL || '';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const artifactRoot = process.env.EASYEDU_LOADING_BATCH2_ARTIFACT_ROOT || '';
const rootId = 'local-groupimport-easystud';
const diagnosticParameter = 'easystudloadingdiagnostics';
const diagnosticGlobalName = '__easyStudLoadingDiagnostics';
const repositoryRoot = path.resolve(__dirname, '..', '..');
const viewports = [
    {width: 390, height: 844},
    {width: 520, height: 900},
    {width: 768, height: 1024},
    {width: 1024, height: 768},
    {width: 1440, height: 1000},
];

test.setTimeout(120000);
test.skip(!managerUrl, 'Missing EASYEDU_LOADING_DIAGNOSTIC_URL for the local authenticated fixture.');
test.skip(!password, 'Missing EASYEDU_MOODLE_PASSWORD for the local authenticated fixture.');

const withDiagnostics = url => {
    const value = new URL(url);
    value.searchParams.set(diagnosticParameter, '1');
    return value.toString();
};

const isAmdCandidate = request => {
    const pathname = new URL(request.url()).pathname;
    return /\/lib\/requirejs\.php\/.*\/(?:core\/first|local_groupimport\/course_manager)(?:\.min)?\.js$/i.test(pathname);
};

const isCourseManagerBundle = body => /define\(["']local_groupimport\/course_manager["']/.test(body);

const routeCourseManagerBundle = async(page, handler) => {
    let interceptionCount = 0;
    await page.route('**/*', async route => {
        if (!isAmdCandidate(route.request())) {
            await route.continue();
            return;
        }
        const response = await route.fetch();
        const body = await response.text();
        if (!isCourseManagerBundle(body)) {
            await route.fulfill({response, body});
            return;
        }
        interceptionCount += 1;
        await handler(route, response, body);
    });
    return () => interceptionCount;
};

const installPageObservers = async page => {
    const observations = {
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        httpErrors: [],
    };
    await page.addInitScript(() => {
        window.__easyStudUnhandledRejections = 0;
        window.addEventListener('unhandledrejection', () => {
            window.__easyStudUnhandledRejections += 1;
        });
    });
    page.on('console', message => {
        if (message.type() === 'error') {
            observations.consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', error => observations.pageErrors.push(error.message));
    page.on('requestfailed', request => observations.failedRequests.push({
        resourceType: request.resourceType(),
        url: request.url(),
    }));
    page.on('response', response => {
        const request = response.request();
        if (response.status() >= 400 && /^(document|script|xhr|fetch)$/.test(request.resourceType())) {
            observations.httpErrors.push({
                resourceType: request.resourceType(),
                status: response.status(),
                url: response.url(),
            });
        }
    });
    return observations;
};

const beginObservedManagerScenario = async page => {
    await page.goto('about:blank');
    return installPageObservers(page);
};

const authenticate = async page => {
    const loginUrl = new URL('/login/index.php', managerUrl).toString();
    await page.goto(loginUrl, {waitUntil: 'domcontentloaded'});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await Promise.all([
            page.waitForLoadState('domcontentloaded'),
            page.locator('#loginbtn').click(),
        ]);
    }
};

const navigateToManager = async(page, {diagnostics = true} = {}) => {
    const url = diagnostics ? withDiagnostics(managerUrl) : managerUrl;
    await page.goto(url, {waitUntil: 'commit'});
    const root = page.locator('#' + rootId);
    await root.waitFor({state: 'attached', timeout: 60000});
    return root;
};

const snapshot = page => page.evaluate(({globalName, id}) => {
    const registry = window[globalName];
    const diagnostics = registry && registry[id];
    return diagnostics ? diagnostics.snapshot() : null;
}, {globalName: diagnosticGlobalName, id: rootId});

const terminalEvents = events => events.filter(event => (
    event.name === 'manager-ready' || event.name === 'manager-degraded'
));

const visibleFocusableCount = root => root.evaluate(node => Array.from(node.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
)).filter(target => {
    const style = getComputedStyle(target);
    const rect = target.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}).length);

const interactionRegionsInert = root => root.evaluate(node => [
    node.querySelector('[data-easystud-real-content]'),
    node.querySelector('.local-groupimport-easystud__layout'),
    node.querySelector('.local-groupimport-easystud__layout-toggles'),
    node.querySelector('[data-easystud-mobile-view-switcher]'),
].filter(Boolean).some(target => target.inert));

const overflowMetrics = page => page.evaluate(() => {
    const root = document.querySelector('#local-groupimport-easystud');
    const content = document.querySelector('[data-easystud-real-content]');
    return {
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        rootClientWidth: root.clientWidth,
        rootScrollWidth: root.scrollWidth,
        contentClientWidth: content.clientWidth,
        contentScrollWidth: content.scrollWidth,
    };
});

const assertOverflow = async page => {
    const metrics = await overflowMetrics(page);
    expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth + 2);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 2);
    expect(metrics.rootScrollWidth).toBeLessThanOrEqual(metrics.rootClientWidth + 1);
    expect(metrics.contentScrollWidth).toBeLessThanOrEqual(metrics.contentClientWidth + 1);
    return metrics;
};

const assertLoading = async root => {
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'loading');
    await expect(root).toHaveAttribute('aria-busy', 'true');
    await expect(root.locator('[data-easystud-loading-skeleton]')).toBeVisible();
    await expect(root.locator('[data-easystud-real-content]')).toBeHidden();
    expect(await interactionRegionsInert(root)).toBe(true);
    expect(await visibleFocusableCount(root)).toBe(0);
};

const assertReady = async(root, page) => {
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready');
    await expect(root).toHaveAttribute('aria-busy', 'false');
    await expect(root.locator('[data-easystud-loading-skeleton]')).toBeHidden();
    await expect(root.locator('[data-easystud-real-content]')).toBeVisible();
    expect(await interactionRegionsInert(root)).toBe(false);
    return assertOverflow(page);
};

const assertDegraded = async(root, page) => {
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'degraded', {timeout: 12000});
    await expect(root).toHaveAttribute('aria-busy', 'false');
    await expect(root.locator('[data-easystud-loading-skeleton]')).toBeHidden();
    await expect(root.locator('[data-easystud-real-content]')).toBeVisible();
    expect(await interactionRegionsInert(root)).toBe(false);
    return assertOverflow(page);
};

const unhandledRejectionCount = page => page.evaluate(() => window.__easyStudUnhandledRejections || 0);

const expectedAmdError = value => /(?:core\/first|local_groupimport\/course_manager).*(?:ERR_FAILED|Script error)|(?:ERR_FAILED|Script error).*(?:core\/first|local_groupimport\/course_manager)|Failed to load resource: net::ERR_FAILED/i.test(value);

const assertCleanBrowser = async(page, observations, {allowAmdTransportFailures = false} = {}) => {
    const expectedTransportFailures = observations.failedRequests.filter(request => isAmdCandidate({
        url: () => request.url,
    }));
    const unexpectedTransportFailures = allowAmdTransportFailures ? observations.failedRequests.filter(request => (
        !expectedTransportFailures.includes(request)
    )) : observations.failedRequests;
    expect(observations.consoleErrors).toEqual([]);
    expect(observations.pageErrors).toEqual([]);
    expect(unexpectedTransportFailures).toEqual([]);
    expect(observations.httpErrors).toEqual([]);
    expect(await unhandledRejectionCount(page)).toBe(0);
    return expectedTransportFailures.length;
};

const assertExpectedAmdFailure = async(page, observations) => {
    expect(observations.failedRequests.length).toBeGreaterThanOrEqual(1);
    expect(observations.failedRequests.every(request => (
        request.resourceType === 'script' && isAmdCandidate({url: () => request.url})
    ))).toBe(true);
    expect(observations.httpErrors).toEqual([]);
    expect(observations.consoleErrors.concat(observations.pageErrors).every(expectedAmdError)).toBe(true);
    expect(await unhandledRejectionCount(page)).toBe(0);
    return observations.failedRequests.length;
};

const assertArtifactPrivacy = value => {
    const forbiddenKey = /^(?:courseid|course_id|contextid|context_id|userid|user_id|categoryid|category_id|groupid|group_id|coursename|course_name|shortname|course_shortname|groupname|group_name|accountname|account_name|password|cookie|cookies|sesskey|authorization|auth_header|access_token|auth_token|url|href|location)$/i;
    const forbiddenText = /(?:https?:\/\/|sesskey|authorization|bearer\s|cookie|password|course[_-]?id|group[_-]?id|shortname)/i;
    const visit = node => {
        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }
        if (!node || typeof node !== 'object') {
            return;
        }
        Object.entries(node).forEach(([key, child]) => {
            expect(forbiddenKey.test(key), 'forbidden public artifact key: ' + key).toBe(false);
            visit(child);
        });
    };
    visit(value);
    expect(forbiddenText.test(JSON.stringify(value))).toBe(false);
};

const writeArtifact = async(label, value) => {
    if (!artifactRoot) {
        return;
    }
    assertArtifactPrivacy(value);
    const root = path.resolve(artifactRoot);
    if (root === repositoryRoot || root.startsWith(repositoryRoot + path.sep)) {
        throw new Error('EASYEDU_LOADING_BATCH2_ARTIFACT_ROOT must stay outside the repository.');
    }
    const target = path.resolve(root, label);
    const relative = path.relative(root, target);
    if (!relative || path.isAbsolute(relative) || relative.startsWith('..' + path.sep) || relative === '..') {
        throw new Error('Batch 2 artifact label escaped its external root.');
    }
    await fs.promises.mkdir(path.dirname(target), {recursive: true});
    await fs.promises.access(target).then(
        () => Promise.reject(new Error('Refusing to overwrite Batch 2 artifact ' + label + '.')),
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

for (const viewport of viewports) {
    test('keeps delayed AMD loading terminal at ' + viewport.width + 'px', async({page}) => {
        await page.setViewportSize(viewport);
        await authenticate(page);
        const observations = await beginObservedManagerScenario(page);
        let releaseAmd;
        const delayed = new Promise(resolve => {
            releaseAmd = resolve;
        });
        const interceptionCount = await routeCourseManagerBundle(page, async(route, response, body) => {
            await delayed;
            await route.fulfill({response, body});
        });
        const root = await navigateToManager(page);
        await expect.poll(interceptionCount).toBe(1);
        await assertLoading(root);
        const loadingOverflow = await assertOverflow(page);
        const loadingEvents = await snapshot(page);
        expect(terminalEvents(loadingEvents)).toEqual([]);
        await page.waitForTimeout(1500);
        await assertLoading(root);
        releaseAmd();
        const readyOverflow = await assertReady(root, page);
        const events = await snapshot(page);
        expect(terminalEvents(events).map(event => event.name)).toEqual(['manager-ready']);
        const expectedTransportFailureCount = await assertCleanBrowser(page, observations, {
            allowAmdTransportFailures: true,
        });
        await writeArtifact('delayed-amd/' + viewport.width + '.json', {
            schemaVersion: 'easystud-loading-evidence/v1',
            scenario: 'delayed-amd',
            fixture: {alias: 'local-disposable-fixture'},
            viewport: {width: viewport.width, height: viewport.height},
            lifecycle: {initialState: 'loading', finalState: 'ready', readyCount: 1, degradedCount: 0},
            overflow: {loading: loadingOverflow, ready: readyOverflow},
            browser: {consoleErrorCount: 0, pageErrorCount: 0, unhandledRejectionCount: 0, relevantNetworkFailureCount: 0, expectedTransportFailureCount, relevantHttpErrorCount: 0},
        });
    });

    test('fails open once without resurrection at ' + viewport.width + 'px', async({page}) => {
        await page.setViewportSize(viewport);
        await authenticate(page);
        const observations = await beginObservedManagerScenario(page);
        const interceptionCount = await routeCourseManagerBundle(page, async route => {
            await route.abort('failed');
        });
        const root = await navigateToManager(page);
        await expect.poll(interceptionCount).toBe(1);
        await assertLoading(root);
        const overflow = await assertDegraded(root, page);
        await page.waitForTimeout(750);
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'degraded');
        const events = await snapshot(page);
        expect(terminalEvents(events).map(event => event.name)).toEqual(['manager-degraded']);
        const expectedTransportFailureCount = await assertExpectedAmdFailure(page, observations);
        await writeArtifact('degraded/' + viewport.width + '.json', {
            schemaVersion: 'easystud-loading-evidence/v1',
            scenario: 'degraded',
            fixture: {alias: 'local-disposable-fixture'},
            viewport: {width: viewport.width, height: viewport.height},
            lifecycle: {initialState: 'loading', finalState: 'degraded', readyCount: 0, degradedCount: 1},
            overflow,
            browser: {consoleErrorCount: observations.consoleErrors.length, pageErrorCount: observations.pageErrors.length, unhandledRejectionCount: 0, relevantNetworkFailureCount: 0, expectedTransportFailureCount, relevantHttpErrorCount: 0},
        });
    });

    test('keeps server-rendered content usable without JavaScript at ' + viewport.width + 'px', async({browser}) => {
        const context = await browser.newContext({javaScriptEnabled: false, viewport});
        const page = await context.newPage();
        try {
            await authenticate(page);
            const root = await navigateToManager(page, {diagnostics: false});
            await expect(root.locator('[data-easystud-loading-skeleton]')).toBeHidden();
            await expect(root.locator('[data-easystud-real-content]')).toBeVisible();
            await expect(root).not.toHaveAttribute('aria-busy', 'true');
            expect(await interactionRegionsInert(root)).toBe(false);
            const usableServerControl = await root.locator('[data-easystud-real-content]').evaluate(node => Array.from(node.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
            )).some(target => {
                const style = getComputedStyle(target);
                const rect = target.getBoundingClientRect();
                return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 &&
                    !target.closest('[inert]');
            }));
            expect(usableServerControl).toBe(true);
            const overflow = await assertOverflow(page);
            await writeArtifact('no-javascript/' + viewport.width + '.json', {
                schemaVersion: 'easystud-loading-evidence/v1',
                scenario: 'no-javascript',
                fixture: {alias: 'local-disposable-fixture'},
                viewport: {width: viewport.width, height: viewport.height},
                lifecycle: {initialState: 'server-rendered', finalState: 'server-rendered'},
                overflow,
            });
        } finally {
            await context.close();
        }
    });
}

test('keeps diagnostics disabled without changing the ready lifecycle', async({page}) => {
    await page.setViewportSize({width: 1024, height: 768});
    await authenticate(page);
    const observations = await beginObservedManagerScenario(page);
    const root = await navigateToManager(page, {diagnostics: false});
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 30000});
    await expect(root).toHaveAttribute('aria-busy', 'false');
    await expect(root).not.toHaveAttribute('data-easystud-loading-diagnostics');
    expect(await page.evaluate(name => window[name] || null, diagnosticGlobalName)).toBeNull();
    await assertOverflow(page);
    await assertCleanBrowser(page, observations);
});

test('keeps the static skeleton reduced-motion safe', async({page}) => {
    await page.setViewportSize({width: 1024, height: 768});
    await page.emulateMedia({reducedMotion: 'reduce'});
    await authenticate(page);
    const observations = await beginObservedManagerScenario(page);
    let releaseAmd;
    const delayed = new Promise(resolve => {
        releaseAmd = resolve;
    });
    const interceptionCount = await routeCourseManagerBundle(page, async(route, response, body) => {
        await delayed;
        await route.fulfill({response, body});
    });
    const root = await navigateToManager(page);
    await expect.poll(interceptionCount).toBe(1);
    await assertLoading(root);
    const animation = await root.locator('[data-easystud-loading-skeleton]').evaluate(node => {
        const style = getComputedStyle(node.querySelector('.local-groupimport-easystud__loading-skeleton-line'));
        return {name: style.animationName, duration: style.animationDuration};
    });
    expect(animation.name === 'none' || animation.duration === '0s').toBe(true);
    releaseAmd();
    await assertReady(root, page);
    await assertCleanBrowser(page, observations);
});

test('keeps filter and pagination DOM-only when the fixture supports them', async({page}) => {
    await page.setViewportSize({width: 1024, height: 768});
    await authenticate(page);
    const observations = await beginObservedManagerScenario(page);
    const root = await navigateToManager(page);
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 30000});
    const beforeFilter = await snapshot(page);
    const search = page.locator('[data-easystud-search]');
    await expect(search).toBeVisible();
    await search.fill('__easystud_batch2_no_match__');
    const afterFilter = await snapshot(page);
    const filterEvents = afterFilter.slice(beforeFilter.length);
    expect(filterEvents.some(event => event.name === 'local-filter-completed')).toBe(true);
    expect(filterEvents.some(event => event.name === 'ajax-request-started')).toBe(false);
    await search.fill('');
    const next = page.locator('[data-easystud-page-next]:visible').first();
    if (await next.count() === 0 || await next.isDisabled()) {
        test.skip(true, 'Fixture has no second EasyStud page for non-mutating pagination evidence.');
    }
    const beforePagination = await snapshot(page);
    await next.click();
    await expect.poll(async() => {
        const events = await snapshot(page);
        return events.slice(beforePagination.length).some(event => event.name === 'local-pagination-completed');
    }).toBe(true);
    const paginationEvents = (await snapshot(page)).slice(beforePagination.length);
    expect(paginationEvents.some(event => event.name === 'ajax-request-started')).toBe(false);
    await assertReady(root, page);
    await assertCleanBrowser(page, observations);
});
