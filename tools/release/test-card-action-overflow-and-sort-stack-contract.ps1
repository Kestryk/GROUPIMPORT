$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$source = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'amd\src\course_manager.js')
$build = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'amd\build\course_manager.min.js')
$structure = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_structure.scss')
$responsive = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\responsive\_desktop.scss')
$tokens = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\easyedu\_tokens.scss')

$requiredSource = @(
    'is-easystud-card-action-overflow',
    'event.stopImmediatePropagation()',
    'is-sort-menu-open',
    'pagination.classList.toggle',
    'ResizeObserver',
    'data-easystud-group-actions-menu',
    'header.appendChild(trigger);'
)

foreach ($needle in $requiredSource) {
    if (-not $source.Contains($needle)) {
        throw "Missing source contract: $needle"
    }
}

foreach ($needle in @('is-easystud-card-action-overflow', 'is-sort-menu-open')) {
    if (-not $build.Contains($needle)) {
        throw "Missing generated AMD contract: $needle"
    }
    if (-not $structure.Contains($needle)) {
        throw "Missing SCSS contract: $needle"
    }
}

foreach ($needle in @(
    '&-group__actions-toggle.local-groupimport-easystud-card-menu',
    'border: 0;',
    'border-radius: 0.4rem;'
)) {
    if (-not $responsive.Contains($needle)) {
        throw "Missing responsive More-actions contract: $needle"
    }
}

if (-not $tokens.Contains('--easyedu-font-family-ui: inherit;') -or
        -not $structure.Contains('[data-easystud-list-sort-label]') -or
        -not $structure.Contains('font: inherit;')) {
    throw 'Missing inherited typography contract for More filters, counters or Sort.'
}

if ($source -notmatch 'ensureNestedGroupActionMenus\(root\);\s+// A nested-card action change[\s\S]*?scheduleGroupGroupingOverflow\(root\);' -or
        $source -notmatch 'const refreshResponsiveUi = \(\) => \{\s+scheduleResponsiveUiRefresh\(root\);\s+scheduleCompleteListAlignment\(root\);\s+scheduleGroupGroupingOverflow\(root\);') {
    throw 'Missing Grouping-label resize recovery contract.'
}

if (-not $structure.Contains('margin-inline-start: auto;') -or
        -not $structure.Contains('order: 2;')) {
    throw 'Missing logical end-alignment contract for recovered More actions.'
}

if (-not $structure.Contains('[data-easystud-list-sort-dropdown].is-open') -or
        -not $structure.Contains('z-index: 42;')) {
    throw 'Missing opened Sort dropdown paint-owner contract.'
}

Write-Output 'Card action overflow and Sort stacking contract passed.'
