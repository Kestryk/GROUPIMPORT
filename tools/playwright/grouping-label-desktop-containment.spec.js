const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const rootSelector = '#local-groupimport-easystud';
const desktopWidths = [1024, 1025, 1200, 1201, 1280, 1440];

const login = async page => {
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running this scenario.');
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

const getGroupingCases = root => root.evaluate(manager => {
    const grouped = Array.from(manager.querySelectorAll(
        '[data-easystud-structure-groups] [data-easystud-group-id][data-grouping-ids]'
    )).filter(card => {
        return card.getAttribute('data-grouping-ids').split(',').filter(Boolean).length > 0;
    });
    const find = count => grouped.find(card => {
        return card.getAttribute('data-grouping-ids').split(',').filter(Boolean).length === count;
    });
    const one = find(1);
    const multiple = grouped.find(card => {
        return card.getAttribute('data-grouping-ids').split(',').filter(Boolean).length > 1;
    });
    [one, multiple].filter(Boolean).forEach((card, index) => {
        card.setAttribute('data-eed-ui-0029-case', String(index));
    });
    return {
        one: one ? '0' : '',
        multiple: multiple ? (one === multiple ? '0' : '1') : '',
    };
});

const prepareCapacityCase = async(card, title, groupingLabel) => {
    await card.evaluate((element, values) => {
        const titleNode = element.querySelector(':scope > .local-groupimport-easystud-group__header > ' +
            '.local-groupimport-easystud-group__name');
        const summaryNode = element.querySelector(':scope > .local-groupimport-easystud-group__header ' +
            '.local-groupimport-easystud-group__groupings-summary');
        if (!titleNode || !summaryNode) {
            throw new Error('The Group header does not expose both the title and grouping summary.');
        }
        const details = element.querySelector(':scope > [data-easystud-grouping-details]');
        element.classList.remove('is-groupings-expanded');
        if (details) {
            details.hidden = true;
        }
        titleNode.textContent = values.title;
        summaryNode.textContent = values.groupingLabel;
        window.dispatchEvent(new Event('resize'));
    }, {title, groupingLabel});
};

const assertCapacityState = async card => {
    await expect.poll(async() => card.evaluate(element => {
        const inline = element.querySelector(':scope > .local-groupimport-easystud-group__header > ' +
            '.local-groupimport-easystud-group__groupings--inline');
        return inline ? inline.getAttribute('data-easystud-grouping-label-fit') : '';
    })).toMatch(/^(visible|hidden)$/);

    const state = await card.evaluate(element => {
        const header = element.querySelector(':scope > .local-groupimport-easystud-group__header');
        const inline = header.querySelector(':scope > .local-groupimport-easystud-group__groupings--inline');
        const summary = inline.querySelector('.local-groupimport-easystud-group__groupings-summary');
        const accessible = header.querySelector('.local-groupimport-easystud-group__groupings-accessible');
        const style = window.getComputedStyle(summary);
        return {
            accessibleHidden: accessible.hidden,
            hidden: inline.hidden,
            summaryClientWidth: summary.clientWidth,
            summaryScrollWidth: summary.scrollWidth,
            textOverflow: style.textOverflow,
        };
    });

    const expected = state.hidden ? 'hidden' : 'visible';
    expect(state.accessibleHidden).toBe(expected !== 'hidden');
    if (expected === 'visible') {
        expect(state.summaryScrollWidth).toBeLessThanOrEqual(state.summaryClientWidth);
        expect(state.textOverflow).not.toBe('ellipsis');
    }
    return expected;
};

test('desktop Grouping labels are fully visible or entirely moved to More actions', async({page}, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 1440, height: 900});
    const root = await login(page);
    await root.locator('[data-easystud-layout-mode="structure"]').click();
    const cases = await getGroupingCases(root);
    expect(cases.one, 'The managed course needs one Group with one Grouping.').not.toBe('');
    expect(cases.multiple, 'The managed course needs one Group with several Groupings.').not.toBe('');

    const contextMenu = root.locator('[data-easystud-context-menu]');
    const detailsAction = contextMenu.locator(
        '[data-easystud-context-action="group-show-grouping-details"]'
    );
    const testCases = [
        {caseId: cases.one, title: 'Short Group', groupingLabel: 'Grouping'},
        {
            caseId: cases.multiple,
            title: 'A deliberately long Group title used to consume available header capacity',
            groupingLabel: 'A deliberately long Grouping label that must never be truncated in the Group header',
        },
    ];
    let openedDetailsFromMaskedLabel = false;
    let retainedFullyVisibleLabel = false;

    for (const width of desktopWidths) {
        await page.setViewportSize({width, height: 900});
        if (width === 1024 && await root.locator('[data-easystud-mobile-view="groups"]').count()) {
            await root.locator('[data-easystud-mobile-view="groups"]').click();
        }
        for (const item of testCases) {
            const card = root.locator('[data-eed-ui-0029-case="' + item.caseId + '"]').first();
            await prepareCapacityCase(card, item.title, item.groupingLabel);

            if (width === 1024) {
                await expect(card.locator('.local-groupimport-easystud-group__groupings--inline')).toBeHidden();
                await card.locator('[data-easystud-card-menu]').click();
                await expect(detailsAction).toBeHidden();
                await page.keyboard.press('Escape');
                continue;
            }

            const expected = await assertCapacityState(card);

            await card.locator(
                ':scope > [data-easystud-card-menu], :scope > .local-groupimport-easystud-group__header > ' +
                '[data-easystud-card-menu]'
            ).first().click();
            await expect(detailsAction).toHaveCount(1);
            if (expected === 'hidden') {
                await expect(detailsAction).toBeVisible();
                await detailsAction.click();
                await expect(card.locator('[data-easystud-grouping-details]')).toBeVisible();
                openedDetailsFromMaskedLabel = true;
            } else {
                await expect(detailsAction).toBeHidden();
                retainedFullyVisibleLabel = true;
                await page.keyboard.press('Escape');
            }
        }
        await page.screenshot({path: testInfo.outputPath('grouping-label-desktop-' + width + '.png')});
    }
    expect(openedDetailsFromMaskedLabel, 'A constrained desktop header must expose Grouping details in More actions.').toBe(true);
    expect(retainedFullyVisibleLabel, 'An unconstrained desktop header must retain the complete Grouping pill.').toBe(true);
});
