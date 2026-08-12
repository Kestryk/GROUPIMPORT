param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile {
    param([string]$RelativePath)

    $path = Join-Path $root $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing Navigation Skeleton contract file: $RelativePath"
    }

    return Get-Content -LiteralPath $path -Raw
}

function Assert-Contains {
    param(
        [string]$Label,
        [string]$Contents,
        [string]$Fragment
    )

    if (-not $Contents.Contains($Fragment)) {
        throw "$Label is missing required contract fragment: $Fragment"
    }
}

$snapshot = 'c9277a82fb471018f4cc07b24dd336d2adfa310d'
$component = Read-RequiredFile 'scss\easyedu\components\_navigation-skeleton.scss'
$components = Read-RequiredFile 'scss\easyedu\_components.scss'
$kitReadme = Read-RequiredFile 'scss\easyedu\README.md'
$studentMarkup = Read-RequiredFile 'templates\manage.mustache'
$massImport = Read-RequiredFile 'index.php'
$studentStyles = Read-RequiredFile 'scss\components\_layout.scss'
$massImportStyles = Read-RequiredFile 'scss\views\_mass-import.scss'
$documentation = Read-RequiredFile 'docs\testing\navigation-skeleton-parity.md'
$zoomScenario = Read-RequiredFile 'tools\playwright\navigation-skeleton-zoom.spec.js'

foreach ($fragment in @(
    '@mixin navigation-skeleton-frame',
    '@mixin navigation-skeleton-cue',
    '@mixin navigation-skeleton-cue-overlay',
    '@mixin navigation-skeleton-cue-stack',
    'skeleton-shimmer-direct',
    'skeleton-shimmer-overlay',
    ':dir(rtl)',
    '[dir="rtl"]',
    'forced-colors: active'
)) {
    Assert-Contains 'Vendored Navigation Skeleton component' $component $fragment
}

$frameStart = $component.IndexOf('@mixin navigation-skeleton-frame')
$frameEnd = $component.IndexOf('@mixin navigation-skeleton-cue', $frameStart)
if ($frameStart -lt 0 -or $frameEnd -le $frameStart) {
    throw 'Navigation Skeleton frame mixin boundary is missing.'
}
$frameMixin = $component.Substring($frameStart, $frameEnd - $frameStart)
if ($frameMixin.Contains('animation') -or $frameMixin.Contains('shimmer')) {
    throw 'Navigation Skeleton frame must remain static; animation belongs to internal cues only.'
}

Assert-Contains 'Kit aggregator' $components '@forward "components/navigation-skeleton";'
Assert-Contains 'Embedded Kit README' $kitReadme $snapshot
Assert-Contains 'Student Management markup' $studentMarkup 'data-easyedu-navigation-skeleton="1"'
Assert-Contains 'Student Management markup' $studentMarkup 'aria-hidden="true"'
Assert-Contains 'Mass Import markup' $massImport "'data-easyedu-navigation-skeleton' => '1'"
Assert-Contains 'Mass Import markup' $massImport "'aria-hidden' => 'true'"
Assert-Contains 'Student Management styles' $studentStyles 'navigation-skeleton-frame'
Assert-Contains 'Student Management styles' $studentStyles 'navigation-skeleton-cue-overlay'
$viewToggleStart = $studentStyles.IndexOf('&__loading-view-toggle {')
$viewToggleEnd = $studentStyles.IndexOf('&__loading-view-toggle-item {', $viewToggleStart)
if ($viewToggleStart -lt 0 -or $viewToggleEnd -le $viewToggleStart) {
    throw 'Student Management Navigation Skeleton frame boundary is missing.'
}
$viewToggle = $studentStyles.Substring($viewToggleStart, $viewToggleEnd - $viewToggleStart)
Assert-Contains 'Student Management Navigation Skeleton frame' $viewToggle 'box-sizing: border-box'
Assert-Contains 'Student Management Navigation Skeleton frame' $viewToggle 'max-inline-size: 100%'
Assert-Contains 'Student Management styles' $studentStyles '@media (max-width: 20rem)'
Assert-Contains 'Student Management styles' $studentStyles '&__loading-header-actions,'
Assert-Contains 'Student Management styles' $studentStyles '&__loading-pagination-rail {'
Assert-Contains 'Mass Import styles' $massImportStyles 'navigation-skeleton-frame'
Assert-Contains 'Mass Import styles' $massImportStyles 'navigation-skeleton-cue'
Assert-Contains 'Mass Import styles' $massImportStyles '@media (max-width: 20rem)'
Assert-Contains 'Mass Import styles' $massImportStyles '&__loading-actions {'
Assert-Contains 'Mass Import styles' $massImportStyles '&__loading-action {'

foreach ($consumer in @(
    @{Label = 'Student Management styles'; Contents = $studentStyles},
    @{Label = 'Mass Import styles'; Contents = $massImportStyles}
)) {
    if ($consumer.Contents.Contains('skeleton-shimmer-direct') -or
        $consumer.Contents.Contains('skeleton-shimmer-overlay')) {
        throw "$($consumer.Label) must use the Navigation Skeleton cue primitive rather than a local shimmer mixin."
    }
}

$studentCueCount = [regex]::Matches(
    $studentMarkup,
    'class="[^"]*local-groupimport-easystud__loading-surface[^"]*"'
).Count
if ($studentCueCount -ne 48) {
    throw "Student Management must retain 48 animated internal cues; found $studentCueCount."
}

$loopStart = $massImport.IndexOf('for ($skeletoncard = 0;')
if ($loopStart -lt 0) {
    throw 'Mass Import Skeleton card loop is missing.'
}
$loopEnd = $massImport.IndexOf('echo html_writer::end_div();', $loopStart)
if ($loopEnd -lt 0) {
    throw 'Mass Import Skeleton card loop terminator is missing.'
}
$massImportHeader = $massImport.Substring(0, $loopStart)
$massImportCard = $massImport.Substring($loopStart, $loopEnd - $loopStart)
$massImportHeaderCueCount = [regex]::Matches(
    $massImportHeader,
    'local-groupimport-import__loading-surface'
).Count
$massImportCuePerCard = [regex]::Matches(
    $massImportCard,
    'local-groupimport-import__loading-surface'
).Count
if ($massImportHeaderCueCount -ne 5 -or $massImportCuePerCard -ne 7 -or
    -not $massImportCard.Contains('$skeletoncard < 2')) {
    throw 'Mass Import Skeleton cue formula must remain five header cues plus two cards with seven cues each.'
}
$massImportCueCount = $massImportHeaderCueCount + (2 * $massImportCuePerCard)
if ($massImportCueCount -ne 19) {
    throw "Mass Import must retain 19 animated internal cues; found $massImportCueCount."
}

Assert-Contains 'Navigation Skeleton documentation' $documentation '| Student Management | 48 | 48 |'
Assert-Contains 'Navigation Skeleton documentation' $documentation '| Mass Import | 19 | 19 |'
Assert-Contains 'Navigation Skeleton documentation' $documentation $snapshot
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'documentScrollWidth'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'documentClientWidth + 1'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'skeleton?.getBoundingClientRect()'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'skeletonScrollWidth'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'skeleton.clientWidth + 1'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'EASYEDU_CHROMIUM_EXECUTABLE'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'per_host_zoom_levels: {'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'x: {'

Write-Host "Navigation Skeleton source contract passed: Student Management 48 -> 48 cues; Mass Import 19 -> 19 cues."
