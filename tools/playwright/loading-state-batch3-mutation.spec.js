const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const rootId = 'local-groupimport-easystud';
const diagnosticParameter = 'easystudloadingdiagnostics';
const diagnosticGlobalName = '__easyStudLoadingDiagnostics';
const fixtureAlias = 'easystud-loading-batch3';
const scenarioId = 'reversible-group-rename';
const expectedCategoryId = 1;

const requiredEnvironment = [
    'EASYEDU_MOODLE_BASE_URL',
    'EASYEDU_MOODLE_USERNAME',
    'EASYEDU_MOODLE_PASSWORD',
    'EASYEDU_LOADING_DIAGNOSTIC_URL',
    'EASYEDU_LOADING_DIAGNOSTIC_DISPOSABLE',
    'EASYEDU_LOADING_DIAGNOSTIC_COURSE_ID',
    'EASYEDU_LOADING_DIAGNOSTIC_COURSE_SHORTNAME',
    'EASYEDU_LOADING_DIAGNOSTIC_EXPECTED_TITLE',
    'EASYEDU_LOADING_DIAGNOSTIC_GROUP_ID',
    'EASYEDU_LOADING_DIAGNOSTIC_ORIGINAL_GROUP_NAME',
    'EASYEDU_LOADING_DIAGNOSTIC_TEMPORARY_GROUP_NAME',
    'EASYEDU_LOADING_DIAGNOSTIC_MUTATION_ENABLED',
    'EASYEDU_LOADING_BATCH3_PUBLIC_ROOT',
    'EASYEDU_LOADING_BATCH3_PRIVATE_CHECKPOINT_ROOT',
    'EASYEDU_LOADING_BATCH3_FIXTURE_LOCK_PATH',
];

const baseUrl = process.env.EASYEDU_MOODLE_BASE_URL || '';
const username = process.env.EASYEDU_MOODLE_USERNAME || '';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const managerUrl = process.env.EASYEDU_LOADING_DIAGNOSTIC_URL || '';
const disposable = /^(1|true|yes)$/i.test(process.env.EASYEDU_LOADING_DIAGNOSTIC_DISPOSABLE || '');
const mutationEnabled = /^(1|true|yes)$/i.test(process.env.EASYEDU_LOADING_DIAGNOSTIC_MUTATION_ENABLED || '');
const courseId = Number(process.env.EASYEDU_LOADING_DIAGNOSTIC_COURSE_ID || 0);
const courseShortname = process.env.EASYEDU_LOADING_DIAGNOSTIC_COURSE_SHORTNAME || '';
const courseTitle = process.env.EASYEDU_LOADING_DIAGNOSTIC_EXPECTED_TITLE || '';
const groupId = Number(process.env.EASYEDU_LOADING_DIAGNOSTIC_GROUP_ID || 0);
const configuredOriginalName = process.env.EASYEDU_LOADING_DIAGNOSTIC_ORIGINAL_GROUP_NAME || '';
const temporaryName = process.env.EASYEDU_LOADING_DIAGNOSTIC_TEMPORARY_GROUP_NAME || '';
const publicRoot = process.env.EASYEDU_LOADING_BATCH3_PUBLIC_ROOT || '';
const privateRoot = process.env.EASYEDU_LOADING_BATCH3_PRIVATE_CHECKPOINT_ROOT || '';
const fixtureLockPath = process.env.EASYEDU_LOADING_BATCH3_FIXTURE_LOCK_PATH || '';

test.setTimeout(180000);
test.describe.configure({mode: 'serial'});

const missingConfiguration = () => {
    const missing = requiredEnvironment.filter(name => !process.env[name]);
    if (!disposable) {
        missing.push('EASYEDU_LOADING_DIAGNOSTIC_DISPOSABLE enabled flag');
    }
    if (!mutationEnabled) {
        missing.push('EASYEDU_LOADING_DIAGNOSTIC_MUTATION_ENABLED enabled flag');
    }
    if (!courseId || !groupId || !courseShortname || !courseTitle || !configuredOriginalName || !temporaryName) {
        missing.push('complete fixture identity');
    }
    if (configuredOriginalName === temporaryName) {
        missing.push('distinct temporary group name');
    }
    return missing;
};

const configurationProblems = missingConfiguration();
test.skip(configurationProblems.length > 0,
    'Missing Batch 3 mutation configuration: ' + configurationProblems.join(', ') + '.');

const isLocalUrl = value => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ?
            (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') : false;
    } catch (error) {
        return false;
    }
};

const safePathWithin = (parent, candidate) => {
    const relative = path.relative(path.resolve(parent), path.resolve(candidate));
    return relative && !path.isAbsolute(relative) && !relative.startsWith('..' + path.sep) && relative !== '..';
};

const managerUrlWithDiagnostics = () => {
    const url = new URL(managerUrl);
    url.searchParams.set(diagnosticParameter, '1');
    return url.toString();
};

const nativeCourseUrl = () => {
    const url = new URL('/course/edit.php', baseUrl);
    url.searchParams.set('id', String(courseId));
    return url.toString();
};

const nativeGroupUrl = () => {
    const url = new URL('/group/group.php', baseUrl);
    url.searchParams.set('courseid', String(courseId));
    url.searchParams.set('id', String(groupId));
    return url.toString();
};

const eventNames = events => events.map(event => event.name);

const snapshot = page => page.evaluate(({globalName, id}) => {
    const registry = window[globalName];
    const diagnostics = registry && registry[id];
    return diagnostics ? diagnostics.snapshot() : null;
}, {globalName: diagnosticGlobalName, id: rootId});

const createObservations = () => ({
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    ignoredBackgroundXhrFailureCount: 0,
    unhandledRejections: 0,
});

const observePage = async(page, observations) => {
    const relevantRequest = request => {
        if (!/^(xhr|fetch)$/.test(request.resourceType())) {
            return true;
        }
        return new URL(request.url()).pathname.endsWith('/local/groupimport/ajax.php');
    };
    await page.addInitScript(() => {
        window.__easyStudBatch3UnhandledRejections = 0;
        window.addEventListener('unhandledrejection', () => {
            window.__easyStudBatch3UnhandledRejections += 1;
        });
    });
    page.on('console', message => {
        if (message.type() === 'error') {
            observations.consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', error => observations.pageErrors.push(error.message));
    page.on('requestfailed', request => {
        if (relevantRequest(request)) {
            observations.failedRequests.push(request.resourceType());
        } else {
            observations.ignoredBackgroundXhrFailureCount += 1;
        }
    });
    page.on('response', response => {
        const request = response.request();
        if (response.status() >= 400 && /^(document|script|xhr|fetch)$/.test(request.resourceType()) &&
                relevantRequest(request)) {
            observations.httpErrors.push({resourceType: request.resourceType(), status: response.status()});
        }
    });
};

const collectUnhandledRejections = async(page, observations) => {
    observations.unhandledRejections += await page.evaluate(() => window.__easyStudBatch3UnhandledRejections || 0);
};

const authenticate = async page => {
    const loginUrl = new URL('/login/index.php', baseUrl).toString();
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

const openManager = async page => {
    await page.goto(managerUrlWithDiagnostics(), {waitUntil: 'domcontentloaded'});
    const root = page.locator('#' + rootId);
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 30000});
    await expect(root).toHaveAttribute('aria-busy', 'false');
    return root;
};

const groupCopies = root => root.locator('[data-easystud-group-id="' + groupId + '"]');

const visibleGroup = root => root.locator('[data-easystud-group-id="' + groupId + '"]:visible').first();

const ensureGroupVisible = async root => {
    const copies = groupCopies(root);
    await expect.poll(() => copies.count()).toBeGreaterThan(0);
    let group = visibleGroup(root);
    if (!await group.count()) {
        const mobileGroups = root.locator('[data-easystud-mobile-view="groups"]:visible').first();
        if (await mobileGroups.count()) {
            await mobileGroups.click();
            await expect(root).toHaveAttribute('data-easystud-mobile-view-active', 'groups');
        }
    }
    group = visibleGroup(root);
    if (!await group.count()) {
        const structureMode = root.locator('[data-easystud-layout-mode="structure"]:visible').first();
        if (await structureMode.count()) {
            await structureMode.click();
        }
    }
    group = visibleGroup(root);
    await expect(group).toBeVisible();
    return group;
};

const groupForm = async root => {
    const group = await ensureGroupVisible(root);
    const form = group.locator('[data-easystud-rename-form]').first();
    await expect(form).toHaveCount(1);
    await expect(form.locator('input[name="action"]')).toHaveValue('renamegroup');
    await expect(form.locator('input[name="groupid"]')).toHaveValue(String(groupId));
    return {group, form};
};

const groupName = async root => {
    const {form} = await groupForm(root);
    return form.locator('input[name="name"]').inputValue();
};

const verifyCourseFixture = async page => {
    await page.goto(nativeCourseUrl(), {waitUntil: 'domcontentloaded'});
    const shortname = page.locator('#id_shortname');
    const fullname = page.locator('#id_fullname');
    const category = page.locator('#id_category');
    await expect(shortname).toBeVisible();
    await expect(fullname).toBeVisible();
    await expect(category).toHaveCount(1);
    expect(await shortname.inputValue()).toBe(courseShortname);
    expect(await fullname.inputValue()).toBe(courseTitle);
    expect(await category.inputValue()).toBe(String(expectedCategoryId));
};

const verifyNativeGroupName = async(page, expectedName) => {
    await page.goto(nativeGroupUrl(), {waitUntil: 'domcontentloaded'});
    const name = page.locator('#id_name, input[name="name"]').first();
    await expect(name).toBeVisible();
    expect(await name.inputValue()).toBe(expectedName);
};

const beginRename = async(page, root, name) => {
    const {group, form} = await groupForm(root);
    await form.locator('[data-easystud-rename-toggle]').dispatchEvent('click');
    const input = form.locator('input[name="name"]');
    await expect(input).toBeVisible();
    const beforeEvents = await snapshot(page);
    const response = page.waitForResponse(candidate => {
        const url = new URL(candidate.url());
        return url.pathname.endsWith('/local/groupimport/ajax.php') && candidate.request().method() === 'POST';
    }, {timeout: 30000});
    await input.fill(name);
    const submitWasHandled = await form.evaluate(element => {
        const event = new Event('submit', {bubbles: true, cancelable: true});
        element.dispatchEvent(event);
        return event.defaultPrevented;
    });
    expect(submitWasHandled).toBe(true);
    return {beforeEvents, form, group, response};
};

const completeRename = async(page, root, rename, expectedName) => {
    const response = await rename.response;
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    await expect(rename.form.locator('input[name="name"]')).toHaveValue(expectedName);
    await expect(rename.group.locator('.local-groupimport-easystud-group__name').first()).toHaveText(expectedName);
    const events = await snapshot(page);
    const actionEvents = events.slice(rename.beforeEvents.length);
    const started = actionEvents.findIndex(event => event.name === 'ajax-request-started');
    const completed = actionEvents.findIndex(event => event.name === 'ajax-request-completed' && event.details.outcome === 'success');
    expect(started).toBeGreaterThanOrEqual(0);
    expect(completed).toBeGreaterThan(started);
    return actionEvents;
};

const assertActionBusyLifecycle = async(root, actionEvents) => {
    await expect(root).not.toHaveClass('is-action-busy');
    await expect(root.locator('[data-easystud-action-busy-status]')).toBeHidden();
    const busyEvents = actionEvents.filter(event => event.name === 'action-busy-changed');
    expect(busyEvents.some(event => event.details.busy === true)).toBe(true);
    expect(busyEvents.some(event => event.details.busy === false)).toBe(true);
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready');
    await expect(root).toHaveAttribute('aria-busy', 'false');
};

const writeJsonAtomic = async(target, value, {replace = false} = {}) => {
    const directory = path.dirname(target);
    await fs.promises.mkdir(directory, {recursive: true});
    if (!replace) {
        await fs.promises.access(target).then(
            () => Promise.reject(new Error('Refusing to overwrite Batch 3 artifact.')),
            error => {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
        );
    }
    const temporary = target + '.' + process.pid + '.tmp';
    await fs.promises.writeFile(temporary, JSON.stringify(value, null, 2), {encoding: 'utf8', mode: 0o600});
    await fs.promises.rename(temporary, target);
    const readback = await fs.promises.readFile(target, 'utf8');
    JSON.parse(readback);
};

const assertPublicValuePrivacy = value => {
    const forbiddenKey = /(?:course|group|name|title|url|username|password|cookie|sesskey|authorization|storage)/i;
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
    const serialised = JSON.stringify(value);
    expect(/(?:https?:\/\/|sesskey|cookie|authorization|storage[_-]?state|password)/i.test(serialised)).toBe(false);
};

const writePublicArtifact = async(label, value) => {
    assertPublicValuePrivacy(value);
    const target = path.resolve(publicRoot, label);
    expect(safePathWithin(publicRoot, target)).toBe(true);
    await writeJsonAtomic(target, value);
};

const privateCheckpoint = {
    schemaVersion: 'easystud-loading-batch3-private-checkpoint/v1',
    scenario: scenarioId,
    courseId,
    groupId,
    originalName: null,
    temporaryName,
    phase: null,
    phases: [],
    restorationResult: null,
    recoveryInstruction: 'If cleanup is incomplete, do not run another mutation. Use the supported Moodle group editor to restore the configured original value, then verify it through a fresh Moodle native group page.',
};

const checkpointPath = path.resolve(privateRoot, 'checkpoint.json');

const recordCheckpoint = async(phase, details = {}) => {
    privateCheckpoint.phase = phase;
    privateCheckpoint.phases.push({phase, timestamp: new Date().toISOString()});
    Object.assign(privateCheckpoint, details);
    await writeJsonAtomic(checkpointPath, privateCheckpoint, {replace: privateCheckpoint.phases.length > 1});
};

const publicEvidence = ({startedAt, mutationEvents, restorationEvents, observations, temporaryReloadVerified,
    freshReloadVerified, independentVerified}) => ({
    schemaVersion: 'easystud-loading-batch3-evidence/v1',
    fixture: {alias: fixtureAlias},
    scenario: 'reversible-rename',
    startedAt,
    durationMs: Date.now() - startedAt,
    ajax: {
        forwardRequestCount: 1,
        restorationRequestCount: restorationEvents ? 1 : 0,
        httpResult: '2xx',
        applicationSuccess: true,
        busyStateObserved: true,
        forwardLifecycle: eventNames(mutationEvents),
        restorationLifecycle: restorationEvents ? eventNames(restorationEvents) : [],
    },
    state: {
        temporaryVisible: true,
        temporaryReloadVerified,
        restorationInFinally: true,
        freshReloadVerified,
        independentNativeReadVerified: independentVerified,
    },
    browser: {
        consoleErrorCount: observations.consoleErrors.length,
        pageErrorCount: observations.pageErrors.length,
        unhandledRejectionCount: observations.unhandledRejections,
        relevantNetworkFailureCount: observations.failedRequests.length,
        relevantHttpErrorCount: observations.httpErrors.length,
        ignoredBackgroundXhrFailureCount: observations.ignoredBackgroundXhrFailureCount,
    },
});

const listFilesRecursively = async root => {
    const entries = await fs.promises.readdir(root, {withFileTypes: true});
    const results = [];
    for (const entry of entries) {
        const candidate = path.join(root, entry.name);
        if (entry.isDirectory()) {
            results.push(...await listFilesRecursively(candidate));
        } else if (entry.isFile()) {
            results.push(candidate);
        }
    }
    return results;
};

const publicPrivacyScan = async() => {
    const forbidden = [
        {category: 'base-url', value: baseUrl},
        {category: 'course-id', value: String(courseId)},
        {category: 'course-shortname', value: courseShortname},
        {category: 'course-title', value: courseTitle},
        {category: 'group-id', value: String(groupId)},
        {category: 'original-group-name', value: configuredOriginalName},
        {category: 'temporary-group-name', value: temporaryName},
        {category: 'username', value: username},
        {category: 'password', value: password},
        {category: 'sesskey', value: 'sesskey'},
        {category: 'cookie', value: 'cookie'},
        {category: 'authorization', value: 'authorization'},
        {category: 'authenticated-path', value: '/local/groupimport/'},
        {category: 'login-path', value: '/login/'},
        {category: 'storage-state', value: 'storageState'},
    ].filter(entry => entry.value);
    const matches = [];
    const files = await listFilesRecursively(publicRoot);
    for (const file of files) {
        const text = await fs.promises.readFile(file, 'utf8');
        forbidden.forEach(entry => {
            const found = /^\d+$/.test(entry.value) ?
                new RegExp('"' + entry.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"').test(text) :
                text.includes(entry.value);
            if (found) {
                matches.push({category: entry.category, file: path.relative(publicRoot, file)});
            }
        });
    }
    return {files: files.length, matches};
};

const assertCleanBrowser = observations => {
    expect(observations.consoleErrors).toEqual([]);
    expect(observations.pageErrors).toEqual([]);
    expect(observations.failedRequests).toEqual([]);
    expect(observations.httpErrors).toEqual([]);
    expect(observations.unhandledRejections).toBe(0);
};

const acquireFixtureLock = async() => {
    await fs.promises.mkdir(path.dirname(fixtureLockPath), {recursive: true});
    try {
        const handle = await fs.promises.open(fixtureLockPath, 'wx', 0o600);
        await handle.writeFile(JSON.stringify({scenario: scenarioId, processId: process.pid, startedAt: new Date().toISOString()}));
        await handle.close();
        return true;
    } catch (error) {
        if (error.code === 'EEXIST') {
            throw new Error('FIXTURE_LOCK_UNAVAILABLE');
        }
        throw error;
    }
};

test('executes one supported reversible rename with independent restoration proof', async({browser}) => {
    expect(isLocalUrl(baseUrl)).toBe(true);
    expect(isLocalUrl(managerUrl)).toBe(true);
    expect(path.resolve(publicRoot)).not.toBe(repositoryRoot);
    expect(path.resolve(privateRoot)).not.toBe(repositoryRoot);
    expect(path.parse(path.resolve(publicRoot)).root.toLowerCase()).toBe('d:\\');
    expect(path.parse(path.resolve(privateRoot)).root.toLowerCase()).toBe('d:\\');
    expect(path.parse(path.resolve(fixtureLockPath)).root.toLowerCase()).toBe('d:\\');
    expect(safePathWithin(path.dirname(publicRoot), publicRoot)).toBe(true);
    expect(safePathWithin(path.dirname(privateRoot), privateRoot)).toBe(true);
    expect(path.resolve(publicRoot)).not.toBe(path.resolve(privateRoot));
    expect(await fs.promises.stat(publicRoot)).toBeTruthy();
    expect(await fs.promises.stat(privateRoot)).toBeTruthy();

    let lockHeld = false;
    let context;
    let managerPage;
    let originalName = null;
    let forwardMutationRequested = false;
    let temporaryReloadVerified = false;
    let freshReloadVerified = false;
    let independentVerified = false;
    let mutationEvents = [];
    let restorationEvents = [];
    let primaryFailure = null;
    let cleanupFailure = null;
    const observations = createObservations();
    const startedAt = Date.now();
    let ajaxRequestCount = 0;

    try {
        await acquireFixtureLock();
        lockHeld = true;
        await recordCheckpoint('started');

        context = await browser.newContext({viewport: {width: 1024, height: 768}, acceptDownloads: false});
        managerPage = await context.newPage();
        await observePage(managerPage, observations);
        managerPage.on('request', request => {
            const url = new URL(request.url());
            if (url.pathname.endsWith('/local/groupimport/ajax.php') && request.method() === 'POST') {
                ajaxRequestCount += 1;
            }
        });
        await authenticate(managerPage);
        await recordCheckpoint('authenticated');

        const coursePage = await context.newPage();
        await observePage(coursePage, observations);
        await verifyCourseFixture(coursePage);
        await collectUnhandledRejections(coursePage, observations);
        await coursePage.close();

        let root = await openManager(managerPage);
        await expect(root).toHaveAttribute('data-easystud-course-id', String(courseId));
        const {group} = await groupForm(root);
        expect(await group.locator('[data-easystud-member-id]').count()).toBe(0);
        await expect(group.locator('.local-groupimport-easystud-group__name').first()).toHaveText(configuredOriginalName);
        const nativeInitialPage = await context.newPage();
        await observePage(nativeInitialPage, observations);
        await verifyNativeGroupName(nativeInitialPage, configuredOriginalName);
        await collectUnhandledRejections(nativeInitialPage, observations);
        await nativeInitialPage.close();
        await recordCheckpoint('fixture-identity-confirmed');

        originalName = await groupName(root);
        expect(originalName).toBe(configuredOriginalName);
        expect(originalName).not.toBe(temporaryName);
        privateCheckpoint.originalName = originalName;
        await recordCheckpoint('original-state-captured');

        await recordCheckpoint('mutation-requested');
        forwardMutationRequested = true;
        const forwardRename = await beginRename(managerPage, root, temporaryName);
        mutationEvents = await completeRename(managerPage, root, forwardRename, temporaryName);
        expect(ajaxRequestCount).toBe(1);
        await assertActionBusyLifecycle(root, mutationEvents);

        root = await openManager(managerPage);
        expect(await groupName(root)).toBe(temporaryName);
        temporaryReloadVerified = true;
        await recordCheckpoint('temporary-state-confirmed');
        await writePublicArtifact('mutation-observed.json', publicEvidence({
            startedAt,
            mutationEvents,
            restorationEvents: null,
            observations,
            temporaryReloadVerified,
            freshReloadVerified: false,
            independentVerified: false,
        }));
        await recordCheckpoint('public-evidence-written');
    } catch (error) {
        primaryFailure = error;
        try {
            await recordCheckpoint('failed-before-cleanup', {failureCategory: 'scenario-failure'});
        } catch (checkpointError) {
            cleanupFailure = checkpointError;
        }
        if (!forwardMutationRequested) {
            try {
                await writePublicArtifact('fixture-or-preflight-failed.json', {
                    schemaVersion: 'easystud-loading-batch3-evidence/v1',
                    fixture: {alias: fixtureAlias},
                    scenario: 'fixture-identity',
                    result: 'failed-before-mutation',
                });
            } catch (artifactError) {
                cleanupFailure = cleanupFailure || artifactError;
            }
        }
    } finally {
        if (forwardMutationRequested && managerPage) {
            try {
                try {
                    await recordCheckpoint('cleanup-started');
                } catch (error) {
                    cleanupFailure = cleanupFailure || error;
                }
                let root = await openManager(managerPage);
                const currentName = await groupName(root);
                if (currentName === temporaryName) {
                    const restoreRename = await beginRename(managerPage, root, originalName);
                    restorationEvents = await completeRename(managerPage, root, restoreRename, originalName);
                    expect(ajaxRequestCount).toBe(2);
                    await assertActionBusyLifecycle(root, restorationEvents);
                    try {
                        await recordCheckpoint('original-value-restored', {restorationResult: 'restored'});
                    } catch (error) {
                        cleanupFailure = cleanupFailure || error;
                    }
                } else if (currentName === originalName) {
                    try {
                        await recordCheckpoint('original-value-restored', {restorationResult: 'already-original'});
                    } catch (error) {
                        cleanupFailure = cleanupFailure || error;
                    }
                } else {
                    throw new Error('FIXTURE_CONCURRENT_VALUE_DETECTED');
                }

                root = await openManager(managerPage);
                expect(await groupName(root)).toBe(originalName);
                freshReloadVerified = true;
                try {
                    await recordCheckpoint('fresh-reload-confirmed');
                } catch (error) {
                    cleanupFailure = cleanupFailure || error;
                }

                const independentPage = await context.newPage();
                await observePage(independentPage, observations);
                await verifyNativeGroupName(independentPage, originalName);
                await collectUnhandledRejections(independentPage, observations);
                await independentPage.close();
                independentVerified = true;
                try {
                    await recordCheckpoint('independent-verification-confirmed');
                    await recordCheckpoint('completed');
                } catch (error) {
                    cleanupFailure = cleanupFailure || error;
                }
            } catch (error) {
                cleanupFailure = cleanupFailure || error;
                try {
                    await recordCheckpoint('cleanup-failed', {restorationResult: 'unconfirmed'});
                } catch (checkpointError) {
                    cleanupFailure = cleanupFailure || checkpointError;
                }
            }
        }

        if (managerPage) {
            try {
                await collectUnhandledRejections(managerPage, observations);
            } catch (error) {
                cleanupFailure = cleanupFailure || error;
            }
        }
        if (context) {
            try {
                await context.close();
            } catch (error) {
                cleanupFailure = cleanupFailure || error;
            }
        }
        if (lockHeld) {
            try {
                await fs.promises.unlink(fixtureLockPath);
            } catch (error) {
                cleanupFailure = cleanupFailure || error;
            }
        }
    }

    if (primaryFailure) {
        throw primaryFailure;
    }
    if (cleanupFailure) {
        throw cleanupFailure;
    }
    expect(temporaryReloadVerified).toBe(true);
    expect(freshReloadVerified).toBe(true);
    expect(independentVerified).toBe(true);
    assertCleanBrowser(observations);

    await writePublicArtifact('restoration-confirmed.json', publicEvidence({
        startedAt,
        mutationEvents,
        restorationEvents,
        observations,
        temporaryReloadVerified,
        freshReloadVerified,
        independentVerified,
    }));
    const firstPrivacyScan = await publicPrivacyScan();
    expect(firstPrivacyScan.matches).toEqual([]);
    await writePublicArtifact('privacy-scan.json', {
        schemaVersion: 'easystud-loading-batch3-evidence/v1',
        fixture: {alias: fixtureAlias},
        scenario: 'privacy-scan',
        result: 'passed',
        scannedFileCount: firstPrivacyScan.files,
        forbiddenMatchCount: 0,
    });
    const finalPrivacyScan = await publicPrivacyScan();
    expect(finalPrivacyScan.matches).toEqual([]);
});
