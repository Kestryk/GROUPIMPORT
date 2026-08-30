$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Read-RequiredFile {
    param([string]$RelativePath)

    $path = Join-Path $pluginRoot $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $RelativePath"
    }
    return Get-Content -Raw -LiteralPath $path
}

$template = Read-RequiredFile 'templates/manage.mustache'
$layout = Read-RequiredFile 'scss/components/_layout.scss'
$forms = Read-RequiredFile 'scss/components/_forms.scss'
$settingsModal = Read-RequiredFile 'scss/components/_settings-modal.scss'
$controlTypography = Read-RequiredFile 'scss/components/_control-typography.scss'
$responsive = Read-RequiredFile 'scss/responsive/_desktop.scss'
$styles = Read-RequiredFile 'styles.css'

if ($template -match 'fa \{\{icon\}\} me-2') {
    throw 'Upper EasyStud actions still add a Bootstrap icon margin on top of the Kit gap.'
}

foreach ($needle in @(
    '--easyedu-action-icon-gap: 0.45rem;',
    '@include easyedu.action-button(small);',
    'margin-inline: 0 !important;',
    '[data-easystud-panel-actions-menu] .btn',
    'text-decoration: none !important;'
)) {
    if (-not $layout.Contains($needle) -and -not $controlTypography.Contains($needle)) {
        throw "Missing upper-action or More-actions contract: $needle"
    }
}

foreach ($source in @($forms, $settingsModal)) {
    if (-not $source.Contains('@include easyedu.action-button(small);') -or
            -not $source.Contains('margin-inline: 0 !important;')) {
        throw 'Inline rename or native-profile action does not use the shared action-button contract.'
    }
}

if (-not $responsive.Contains('&-mobile-actions__buttons') -or
        -not $responsive.Contains('@include easyedu.action-button(small);') -or
        -not $responsive.Contains('@include easyedu.mobile-action-tray-button;')) {
    throw 'Responsive selected-action buttons do not preserve the shared centred action contract.'
}

foreach ($needle in @(
    '.local-groupimport-easystud__panel-actions',
    '--easyedu-action-icon-gap: 0.45rem',
    '.local-groupimport-easystud-settings-modal__native > .btn',
    '.local-groupimport-easystud-rename__edit .btn',
    '[data-easystud-panel-actions-menu] .btn'
)) {
    if (-not $styles.Contains($needle)) {
        throw "Generated stylesheet is missing action-button alignment: $needle"
    }
}

Write-Output 'EasyStud action-button alignment contract passed.'
