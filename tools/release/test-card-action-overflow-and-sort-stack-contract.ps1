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

Write-Output 'Card action overflow and Sort stacking contract passed.'
