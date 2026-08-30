[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile([string]$relativePath) {
    $path = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $relativePath"
    }
    return Get-Content -LiteralPath $path -Raw
}

function Assert-Contains([string]$label, [string]$text, [string]$pattern) {
    if ($text -notmatch $pattern) {
        throw "$label is missing contract pattern: $pattern"
    }
}

$entry = Read-RequiredFile 'scss/easystud.scss'
$source = Read-RequiredFile 'scss/components/_typography-identity.scss'
$kit = Read-RequiredFile 'scss/easyedu/components/_typography.scss'
$kitcontract = Read-RequiredFile 'easyedu-kit-docs/ai/COMPONENT_CONTRACT.md'
$css = Read-RequiredFile 'styles.css'

Assert-Contains 'Sass entrypoint' $entry '@use "components/typography-identity";\s*$'
Assert-Contains 'Embedded Kit typography' $kit '@mixin type-page-identity\s*\{\s*@include type-page-title;'
Assert-Contains 'Embedded Kit component contract' $kitcontract 'use `type-page-identity` for plugin view identity headings'

foreach ($selector in @(
    '\.local-groupimport-easystud',
    '\.local-groupimport-import',
    '#page-admin-setting-local_groupimport'
)) {
    Assert-Contains 'Typography source' $source $selector
    Assert-Contains 'Generated CSS' $css $selector
}

foreach ($role in @(
    'type-page-identity',
    'type-panel-title',
    'type-section-title',
    'type-modal-title',
    'type-control-label',
    'type-body',
    'type-eyebrow'
)) {
    Assert-Contains 'Typography source' $source "easyedu\.$role"
}

Assert-Contains 'More filters heading source' $source '&-advanced-filters &__filter-label\s*\{\s*@include easyedu\.type-eyebrow;'
Assert-Contains 'More filters heading generated CSS' $css '\.local-groupimport-easystud-advanced-filters \.local-groupimport-easystud__filter-label\s*\{[^}]*font-size:\s*var\(--easyedu-font-size-eyebrow\);'

$massimport = Read-RequiredFile 'index.php'
Assert-Contains 'Mass Import page title uses Kit identity role' $massimport "'class' => 'local-groupimport-import__title'"
Assert-Contains 'Mass Import section title uses Kit card role' $massimport "'class' => 'local-groupimport-import-card__title'"
Assert-Contains 'Shared card title descender clearance' $kit 'line-height:\s*1\.35;'

if ($source -match 'font-weight:\s*[0-9]' -or $source -match 'letter-spacing:\s*-') {
    throw 'The consumer adoption layer must not introduce numeric weights or negative letter spacing.'
}

Write-Host 'EasyStud typography and identity contract passed.'
