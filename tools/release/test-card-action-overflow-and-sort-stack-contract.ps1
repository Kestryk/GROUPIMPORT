$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$source = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'amd\src\course_manager.js')
$build = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'amd\build\course_manager.min.js')
$structure = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_structure.scss')

$requiredSource = @(
    'is-easystud-card-action-overflow',
    'event.stopImmediatePropagation()',
    'is-sort-menu-open',
    'pagination.classList.toggle',
    'ResizeObserver',
    'data-easystud-group-actions-menu'
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

$requiredStructure = @(
    'is-groupings-summary-hidden',
    'keep the same plain icon treatment as sibling actions',
    'Do not visually shorten a Grouping name in the header',
    'text-overflow: clip;'
)

foreach ($needle in $requiredStructure) {
    if (-not $structure.Contains($needle)) {
        throw "Missing card-header containment contract: $needle"
    }
}

if ($structure -match '&-group\.is-groupings-summary-hidden[\s\S]{0,500}border:\s*1px') {
    throw 'The recovered Grouping More trigger must not regain a pill border.'
}

Write-Output 'Card action overflow and Sort stacking contract passed.'
