$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$source = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\views\_mass-import.scss')
$styles = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'styles.css')

function Assert-Contains([string]$value, [string]$needle, [string]$message) {
    if (-not $value.Contains($needle)) {
        throw $message
    }
}

Assert-Contains $source 'box-sizing: border-box;' 'Import history actions must share border-box sizing.'
Assert-Contains $source 'min-height: 1.9rem;' 'Import history actions must share the Kit compact control height.'
Assert-Contains $source 'margin-top: 0;' 'Import history actions must share a common baseline.'
Assert-Contains $source '@include easyedu.action-button(small);' 'Import history buttons must use the Kit action geometry.'
Assert-Contains $source '@media (max-width: 30rem)' 'Import history actions must wrap at narrow widths.'
Assert-Contains $styles '.local-groupimport-import-history__actions .btn' 'Generated CSS must contain the Import history action selector.'
Assert-Contains $styles 'min-height: 1.9rem' 'Generated CSS must preserve the compact action height.'
Assert-Contains $styles 'margin-top: 0' 'Generated CSS must preserve the shared action baseline.'
Assert-Contains $styles '@media (max-width: 30rem)' 'Generated CSS must contain the narrow-width action wrap.'

Write-Output 'Import history action contract passed.'
