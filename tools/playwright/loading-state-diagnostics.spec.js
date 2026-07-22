const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const diagnosticUrl = process.env.EASYEDU_LOADING_DIAGNOSTIC_URL || '';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const artifactRoot = process.env.EASYEDU_LOADING_DIAGNOSTIC_ARTIFACT_ROOT || '';
const disposable = process.env.EASYEDU_LOADING_DIAGNOSTIC_DISPOSABLE === '1';
const fixtureCourseId = Number(process.env.EASYEDU_LOADING_DIAGNOSTIC_COURSE_ID || 0);
const fixtureShortname = process.env.EASYEDU_LOADING_DIAGNOSTIC_COURSE_SHORTNAME || '';
const expectedTitle = process.env.EASYEDU_LOADING_DIAGNOSTIC_EXPECTED_TITLE || '';
const mutationGroupId = Number(process.env.EASYEDU_LOADING_DIAGNOSTIC_GROUP_ID || 0);
const originalGroupName = process.env.EASYEDU_LOADING_DIAGNOSTIC_ORIGINAL_GROUP_NAME || '';
const temporaryGroupName = process.env.EASYEDU_LOADING_DIAGNOSTIC_TEMPORARY_GROUP_NAME || '';
const mutationEnabled = process.env.EASYEDU_LOADING_DIAGNOSTIC_MUTATION_ENABLED === '1';
const diagnosticParameter = 'easystudloadingdiagnostics';
const diagnosticGlobalName = '__easyStudLoadingDiagnostics';
const rootId = 'local-groupimport-easystud';
const repositoryRoot = path.resolve(__dirname, '..', '..');
const viewports = [
    {name: 'phone', width: 390, height: 844},
    {name: 'compact', width: 520, height: 900},
    {name: 'tablet-portrait', width: 768, height: 1024},
    {name: 'tablet-landscape', width: 1024, height: 768},
    {name: 'desktop', width: 1440, height: 1000},
];

test.setTimeout(120000);
test.skip(!diagnosticUrl, 'Missing EASYEDU_LOADING_DIAGNOSTIC_URL for a disposable authenticated EasyStud fixture.');
test.skip(!password, 'Missing EASYEDU_MOODLE_PASSWORD for the local diagnostic fixture.');
if (artifactRoot) {
    const resolvedArtifactRoot = path.resolve(artifactRoot);
    if (resolvedArtifactRoot === repositoryRoot || resolvedArtifactRoot.startsWith(`${repositoryRoot}${path.sep}`)) {
        throw new Error('EASYEDU_LOADING_DIAGNOSTIC_ARTIFACT_ROOT must stay outside the repository.');
    }
}

const browserErrors = new WeakMap();

test.beforeEach(({page}) => {
    const errors = [];
    browserErrors.set(page, errors);
    page.on('console', message => {
        if (message.type() === 'error') {
            errors.push(`console: ${message.text()}`);
        }
    });
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
});

test.afterEach(({page}) => {
    const errors = browserErrors.get(page) || [];
    if (page.__easyStudExpectedAmdFailure) {
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.every(error => /ERR_FAILED|core\/first|requirejs\.org\/docs\/errors/i.test(error))).toBe(true);
        return;
    }
    expect(errors, 'EasyStud diagnostics page emitted browser errors').toEqual([]);
});

const withDiagnostics = value => {
    const url = new URL(value);
    url.searchParams.set(diagnosticParameter, '1');
    return url.toString();
};

const login = async(page, url) => {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
    }
    const root = page.locator(`#${rootId}`);
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
    return root;
};

const installLoadingProbes = async page => {
    await page.addInitScript(() => {
        window.__easyStudLoadingProbe = {
            focusTargetFound: false,
            focusPreserved: false,
            readySeen: false,
        };
        document.addEventListener('DOMContentLoaded', () => {
            const root = document.querySelector('#local-groupimport-easystud');
            if (!root) {
                return;
            }
            const target = Array.from(root.querySelectorAll('a[href], button:not([disabled])'))
                .find(node => node.getClientRects().length > 0);
            if (!target) {
                return;
            }
            target.setAttribute('data-easystud-loading-probe-focus', '1');
            window.__easyStudLoadingProbe.focusTargetFound = true;
            target.focus();
        }, {once: true});
        document.addEventListener('easyedu:loading-diagnostic', event => {
            if (!event.detail || event.detail.name !== 'manager-ready') {
                return;
            }
            window.__easyStudLoadingProbe.readySeen = true;
            window.__easyStudLoadingProbe.focusPreserved = !!(
                document.activeElement &&
                document.activeElement.hasAttribute('data-easystud-loading-probe-focus')
            );
        });
    });
};

const snapshot = page => page.evaluate(({globalName, id}) => {
    const registry = window[globalName];
    const diagnostics = registry && registry[id];
    return diagnostics ? diagnostics.snapshot() : null;
}, {globalName: diagnosticGlobalName, id: rootId});

const eventNames = events => events.map(event => event.name);

const assertMonotonicSequences = events => {
    events.forEach((event, index) => {
        expect(event.sequence).toBe(index + 1);
        expect(event.rootId).toBe(rootId);
        expect(event.regionId).toBeTruthy();
        expect(event.elapsedMs).toBeGreaterThanOrEqual(0);
    });
};

const forbiddenDiagnosticKey = /^(?:courseid|course_id|contextid|context_id|userid|user_id|categoryid|category_id|groupid|group_id|coursename|course_name|shortname|course_shortname|groupname|group_name|accountname|account_name|title|password|cookie|cookies|sesskey|authorization|auth_header|access_token|auth_token|url|href|location)$/i;
const forbiddenDiagnosticText = [
    /\b(?:https?|ftp):\/\/[^\s"']+/i,
    /\b(?:course[_-]?id|context[_-]?id|user[_-]?id|category[_-]?id|group[_-]?id|course[_-]?name|shortname|group[_-]?name|account[_-]?name)\b/i,
    /\b(?:password|sesskey|cookie|cookies|authorization|bearer|access[_-]?token)\b/i,
];

const assertDiagnosticPrivacy = (value, label) => {
    const keyViolations = [];
    const visit = (node, location) => {
        if (Array.isArray(node)) {
            node.forEach((child, index) => visit(child, `${location}[${index}]`));
            return;
        }
        if (!node || typeof node !== 'object') {
            return;
        }
        Object.entries(node).forEach(([key, child]) => {
            if (forbiddenDiagnosticKey.test(key)) {
                keyViolations.push(`${location}.${key}`);
            }
            visit(child, `${location}.${key}`);
        });
    };
    visit(value, '$');
    const serialised = JSON.stringify(value);
    expect(serialised.length, `${label}: diagnostic artifact must remain bounded`).toBeLessThan(2000000);
    const textViolations = forbiddenDiagnosticText
        .filter(pattern => pattern.test(serialised))
        .map(pattern => pattern.source);
    expect(keyViolations, `${label}: forbidden diagnostic keys`).toEqual([]);
    expect(textViolations, `${label}: forbidden diagnostic serialization`).toEqual([]);
};

const writeArtifact = async(testInfo, label, value) => {
    assertDiagnosticPrivacy(value, label);
    const output = artifactRoot ? path.join(path.resolve(artifactRoot), label) : testInfo.outputPath(label);
    await fs.promises.mkdir(path.dirname(output), {recursive: true});
    await fs.promises.writeFile(output, JSON.stringify(value, null, 2));
};

const mutationConfigurationMissing = () => {
    const missing = [];
    if (!disposable) {
        missing.push('EASYEDU_LOADING_DIAGNOSTIC_DISPOSABLE=1');
    }
    if (!fixtureCourseId || !fixtureShortname || !expectedTitle) {
        missing.push('fixture identity');
    }
    if (!mutationGroupId || !originalGroupName || !temporaryGroupName) {
        missing.push('reversible group identity');
    }
    if (originalGroupName === temporaryGroupName) {
        missing.push('distinct temporary group name');
    }
    return missing;
};

const ungroupedGroup = (root, groupId) => root.locator(
    `[data-easystud-grouping-drop="0"] [data-easystud-group-id="${groupId}"]`
).first();

const ensureGroupVisible = async(root, groupId) => {
    const group = ungroupedGroup(root, groupId);
    if (!await group.isVisible()) {
        await root.locator('[data-easystud-grouping-drop="0"] [data-easystud-collapse-toggle]').click();
    }
    await expect(group).toBeVisible();
    return group;
};

const groupName = (root, groupId) => ungroupedGroup(root, groupId).locator(
    '.local-groupimport-easystud-group__name'
).first();

const renameGroup = async(page, root, groupId, name) => {
    const group = await ensureGroupVisible(root, groupId);
    await group.locator('[data-easystud-rename-toggle]').click();
    const form = group.locator('[data-easystud-rename-form]');
    const input = form.locator('input[name="name"]');
    await expect(input).toBeVisible();
    const before = await snapshot(page);
    await input.fill(name);
    const response = page.waitForResponse(candidate => {
        const url = new URL(candidate.url());
        return url.pathname.endsWith('/local/groupimport/ajax.php') && candidate.request().method() === 'POST';
    }, {timeout: 30000});
    await form.locator('button[type="submit"]').click();
    await expect((await response).status()).toBe(200);
    await expect.poll(
        async() => eventNames((await snapshot(page)).slice(before.length)),
        {timeout: 30000}
    ).toContain('ajax-request-completed');
    await expect(groupName(root, groupId)).toHaveText(name);
    return (await snapshot(page)).slice(before.length);
};

for (const viewport of viewports) {
    test(`records deterministic boot baseline at ${viewport.width}px`, async({page}, testInfo) => {
        await page.setViewportSize({width: viewport.width, height: viewport.height});
        await installLoadingProbes(page);
        const root = await login(page, withDiagnostics(diagnosticUrl));
        const events = await snapshot(page);

        expect(events).not.toBeNull();
        assertMonotonicSequences(events);
        expect(eventNames(events)).toContain('manager-init-started');
        expect(eventNames(events)).toContain('boot-visibility-observed');
        expect(eventNames(events)).toContain('manager-ready');
        const bootVisibility = events.find(event => event.name === 'boot-visibility-observed');
        expect(typeof bootVisibility.details.rootVisible).toBe('boolean');
        expect(typeof bootVisibility.details.realContentVisible).toBe('boolean');
        expect(bootVisibility.details.realContentVisible).toBe(false);
        expect(bootVisibility.details.loadingSurfaceVisible).toBe(true);
        expect(bootVisibility.details.loadingState).toBe('loading');
        expect(bootVisibility.details.ariaBusy).toBe(true);
        expect(bootVisibility.details.interactionRegionsInert).toBe(true);
        const ready = events.find(event => event.name === 'manager-ready');
        expect(ready.details.booting).toBe(false);
        expect(ready.details.realContentVisible).toBe(true);
        expect(ready.details.loadingSurfaceVisible).toBe(false);
        expect(ready.details.loadingState).toBe('ready');
        expect(ready.details.ariaBusy).toBe(false);
        expect(ready.details.interactionRegionsInert).toBe(false);
        expect(ready.elapsedMs).toBeLessThan(1000);
        await expect(root).toHaveAttribute('data-easystud-loading-diagnostics', 'enabled');
        await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready');
        await expect(root).toHaveAttribute('aria-busy', 'false');
        const loadingStatus = root.locator('[data-easystud-loading-status]');
        const readyLabel = await loadingStatus.getAttribute('data-easystud-ready-label');
        expect(readyLabel).toBeTruthy();
        await expect(loadingStatus.locator('[data-easystud-loading-text]')).toHaveText(readyLabel);

        const focusProbe = await page.evaluate(() => window.__easyStudLoadingProbe);
        expect(focusProbe.readySeen).toBe(true);
        if (focusProbe.focusTargetFound) {
            expect(focusProbe.focusPreserved).toBe(true);
        }

        const accessibilityMetrics = await page.evaluate(viewportWidth => {
            const root = document.querySelector('#local-groupimport-easystud');
            const isVisible = node => {
                const style = getComputedStyle(node);
                const rect = node.getBoundingClientRect();
                return style.display !== 'none' && style.visibility !== 'hidden' &&
                    rect.width > 0 && rect.height > 0;
            };
            const accessibleName = node => (
                node.getAttribute('aria-label') ||
                node.getAttribute('title') ||
                node.textContent ||
                ''
            ).replace(/\s+/g, ' ').trim();
            const actions = Array.from(root.querySelectorAll('button, [role="button"], a[href]'))
                .filter(node => isVisible(node) && !node.disabled);
            const missingNames = actions.filter(node => !accessibleName(node)).length;
            const focusAnchor = actions.find(node => node.matches(
                '[data-easystud-mobile-nav-open], [data-easystud-mobile-view-switcher] button'
            )) || actions[0];
            if (focusAnchor) {
                focusAnchor.focus();
            }
            const touchTargets = viewportWidth <= 520 ? Array.from(root.querySelectorAll(
                '[data-easystud-mobile-nav-open], ' +
                '[data-easystud-mobile-view-switcher] button, ' +
                '[data-easystud-card-menu]'
            )).filter(isVisible).map(node => {
                const rect = node.getBoundingClientRect();
                return {width: rect.width, height: rect.height};
            }) : [];
            return {
                actionCount: actions.length,
                missingNames,
                keyboardAnchorPresent: !!focusAnchor,
                touchTargetCount: touchTargets.length,
                minTouchWidth: touchTargets.length ? Math.min(...touchTargets.map(target => target.width)) : null,
                minTouchHeight: touchTargets.length ? Math.min(...touchTargets.map(target => target.height)) : null,
            };
        }, viewport.width);
        expect(accessibilityMetrics.actionCount).toBeGreaterThan(0);
        expect(accessibilityMetrics.missingNames).toBe(0);
        expect(accessibilityMetrics.keyboardAnchorPresent).toBe(true);
        if (viewport.width <= 520) {
            expect(accessibilityMetrics.touchTargetCount).toBeGreaterThan(0);
            expect(accessibilityMetrics.minTouchWidth).toBeGreaterThanOrEqual(44);
            expect(accessibilityMetrics.minTouchHeight).toBeGreaterThanOrEqual(44);
        }
        await page.keyboard.press('Tab');
        await expect.poll(() => page.evaluate(() => {
            const root = document.querySelector('#local-groupimport-easystud');
            const active = document.activeElement;
            if (!active || !root.contains(active) || !active.matches(':focus-visible')) {
                return false;
            }
            const style = getComputedStyle(active);
            return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
        })).toBe(true);

        const geometry = await root.evaluate(node => {
            const box = node.getBoundingClientRect();
            return {width: Math.round(box.width), height: Math.round(box.height)};
        });
        const layoutMetrics = await page.evaluate(() => ({
            viewportWidth: window.innerWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            bodyScrollWidth: document.body.scrollWidth,
            rootClientWidth: document.querySelector('#local-groupimport-easystud').clientWidth,
            rootScrollWidth: document.querySelector('#local-groupimport-easystud').scrollWidth,
            contentClientWidth: document.querySelector('[data-easystud-real-content]').clientWidth,
            contentScrollWidth: document.querySelector('[data-easystud-real-content]').scrollWidth,
        }));
        expect(layoutMetrics.rootScrollWidth).toBeLessThanOrEqual(layoutMetrics.rootClientWidth + 1);
        expect(layoutMetrics.contentScrollWidth).toBeLessThanOrEqual(layoutMetrics.contentClientWidth + 1);
        await writeArtifact(testInfo, `${viewport.width}/loading-state-baseline-${viewport.width}.json`, {
            viewport,
            geometry,
            layoutMetrics,
            focusProbe,
            accessibilityMetrics,
            events,
        });
    });
}

test('keeps diagnostics disabled on a normal URL', async({page}) => {
    const root = await login(page, diagnosticUrl);
    await expect(root).not.toHaveAttribute('data-easystud-loading-diagnostics');
    const registry = await page.evaluate(globalName => window[globalName] || null, diagnosticGlobalName);
    expect(registry).toBeNull();
});

test('records a DOM-only filter lifecycle without an AJAX request', async({page}) => {
    const root = await login(page, withDiagnostics(diagnosticUrl));
    const before = await snapshot(page);
    const search = page.locator('[data-easystud-search]');
    await expect(search).toBeVisible();
    await search.fill('__easystud_loading_diagnostic_no_match__');
    const after = await snapshot(page);
    const newEvents = after.slice(before.length);

    expect(eventNames(newEvents)).toContain('local-filter-completed');
    expect(eventNames(newEvents)).not.toContain('ajax-request-started');
    const filter = newEvents.find(event => event.name === 'local-filter-completed');
    expect(filter.details.source).toBe('search');
    expect(filter.details.queryLength).toBeGreaterThan(0);
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready');
    await expect(root).toHaveAttribute('aria-busy', 'false');
});

test('records a local pagination lifecycle when the fixture has multiple pages', async({page}) => {
    const root = await login(page, withDiagnostics(diagnosticUrl));
    const next = page.locator('[data-easystud-page-next]:visible').first();
    if (await next.count() === 0 || await next.isDisabled()) {
        test.skip(true, 'Fixture has no second EasyStud page; provide more than one participant page for pagination evidence.');
    }
    const before = await snapshot(page);
    await next.click();
    await expect.poll(async() => eventNames((await snapshot(page)).slice(before.length))).toContain('local-pagination-completed');
    const after = await snapshot(page);
    const newEvents = after.slice(before.length);

    expect(eventNames(newEvents)).toContain('local-pagination-requested');
    expect(eventNames(newEvents)).not.toContain('ajax-request-started');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready');
    await expect(root).toHaveAttribute('aria-busy', 'false');
});

test('fails open to a usable degraded state when the manager AMD is unavailable', async({page}) => {
    page.__easyStudExpectedAmdFailure = true;
    await page.route('**/lib/requirejs.php/*/core/first.js*', route => route.abort());
    const root = await login(page, withDiagnostics(diagnosticUrl));
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'degraded', {timeout: 12000});
    await expect(root).toHaveAttribute('aria-busy', 'false');
    await expect(root.locator('[data-easystud-real-content]')).toBeVisible();
    await expect(root.locator('[data-easystud-loading-skeleton]')).toBeHidden();
    const interactionRegionsInert = await root.evaluate(node => [
        node.querySelector('[data-easystud-real-content]'),
        node.querySelector('.local-groupimport-easystud__layout'),
        node.querySelector('.local-groupimport-easystud__layout-toggles'),
        node.querySelector('[data-easystud-mobile-view-switcher]'),
    ].filter(Boolean).some(target => target.inert));
    expect(interactionRegionsInert).toBe(false);
    const events = await snapshot(page);
    expect(eventNames(events)).toContain('manager-degraded');
});

test('records AJAX lifecycle evidence with a reversible disposable group rename', async({page}, testInfo) => {
    if (!mutationEnabled) {
        test.skip(true, 'Set EASYEDU_LOADING_DIAGNOSTIC_MUTATION_ENABLED=1 only after approving a disposable rename/restore fixture.');
    }
    const missing = mutationConfigurationMissing();
    if (missing.length) {
        test.skip(true, `Missing approved AJAX fixture configuration: ${missing.join(', ')}.`);
    }

    let root = await login(page, withDiagnostics(diagnosticUrl));
    await expect(root).toHaveAttribute('data-easystud-course-id', String(fixtureCourseId));
    await ensureGroupVisible(root, mutationGroupId);
    await expect(groupName(root, mutationGroupId)).toHaveText(originalGroupName);

    let temporaryStateVerified = false;
    let restorationVerified = false;
    let mutationEvents = [];
    try {
        mutationEvents = await renameGroup(page, root, mutationGroupId, temporaryGroupName);
        expect(eventNames(mutationEvents)).toContain('ajax-request-started');
        expect(eventNames(mutationEvents)).toContain('ajax-request-completed');
        expect(mutationEvents.some(event => event.name === 'ajax-request-completed' && event.details.outcome === 'success')).toBe(true);

        root = await login(page, withDiagnostics(diagnosticUrl));
        await expect(root).toHaveAttribute('data-easystud-course-id', String(fixtureCourseId));
        await expect(groupName(root, mutationGroupId)).toHaveText(temporaryGroupName);
        temporaryStateVerified = true;
    } finally {
        root = await login(page, withDiagnostics(diagnosticUrl));
        await ensureGroupVisible(root, mutationGroupId);
        const currentName = await groupName(root, mutationGroupId).innerText();
        if (currentName === temporaryGroupName) {
            await renameGroup(page, root, mutationGroupId, originalGroupName);
        }
        root = await login(page, withDiagnostics(diagnosticUrl));
        await expect(root).toHaveAttribute('data-easystud-course-id', String(fixtureCourseId));
        await expect(groupName(root, mutationGroupId)).toHaveText(originalGroupName);
        restorationVerified = true;
    }

    expect(restorationVerified).toBe(true);
    await writeArtifact(testInfo, 'dry-run/ajax-rename-restoration.json', {
        fixture: {alias: 'approved-disposable-fixture'},
        mutation: {scenario: 'group-rename', temporaryStateVerified, restorationVerified},
        events: mutationEvents,
    });
});
