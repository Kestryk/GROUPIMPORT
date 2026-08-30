[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source = Get-Content (Join-Path $root 'scss\components\_typography.scss') -Raw
$css = Get-Content (Join-Path $root 'styles.css') -Raw
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-Contains {
    param([string]$Contents, [string]$Needle, [string]$Message)
    if ($Contents -notmatch [regex]::Escape($Needle)) { $failures.Add($Message) }
}

foreach ($selector in @(
    '.local-groupimport-easystud__panel-title',
    '.local-groupimport-easystud-tree__section--ungrouped',
    '.local-groupimport-easystud-group__name',
    '.local-groupimport-easystud-grouping__name',
    '.local-groupimport-import__title',
    '.local-groupimport-import-card__title',
    '.local-groupimport-import-fields__header strong',
    '.local-groupimport-import-form .fitemtitle',
    '.local-groupimport-import-preview__table thead th'
)) {
    Assert-Contains $css $selector "Generated CSS is missing $selector."
}

foreach ($sourceSelector in @(
    '&__panel-title',
    '&-tree__section--ungrouped',
    '&-group__name',
    '&-grouping__name',
    '&__title',
    '&-card__title',
    '&-fields__header strong',
    '&-form .fitemtitle',
    '&-preview__table thead th'
)) {
    Assert-Contains $source $sourceSelector "Source contract is missing $sourceSelector."
}

foreach ($role in @('type-page-title', 'type-panel-title', 'type-section-title', 'type-card-title', 'type-control-label', 'type-body', 'type-caption', 'type-eyebrow')) {
    Assert-Contains $source "easyedu.$role" "Source contract does not consume $role."
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host 'EasyStud typography contract passed.' -ForegroundColor Green
