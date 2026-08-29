param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile {
    param([string]$RelativePath)

    $path = Join-Path $root $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing Administration loading contract file: $RelativePath"
    }

    return Get-Content -LiteralPath $path -Raw
}

function Assert-Contains {
    param([string]$Label, [string]$Contents, [string]$Fragment)

    if (-not $Contents.Contains($Fragment)) {
        throw "$Label is missing required contract fragment: $Fragment"
    }
}

$settings = Read-RequiredFile 'settings.php'
$bootstrap = Read-RequiredFile 'js\admin_settings_loading.js'
$styles = Read-RequiredFile 'scss\views\_admin-settings.scss'
$documentation = Read-RequiredFile 'docs\testing\admin-settings-loading-state.md'

Assert-Contains 'Administration skeleton markup' $settings "'data-easystud-loading-skeleton' => '1'"
Assert-Contains 'Administration no-script fallback' $settings 'html_writer::tag('
Assert-Contains 'Administration no-script fallback' $settings "'noscript',"
Assert-Contains 'Administration no-script Markdown context block' $settings '"\n" . html_writer::tag(''style'','
Assert-Contains 'Administration no-script fallback' $settings '#adminsettings > .settingsform > * { display: block !important; }'
Assert-Contains 'Administration no-script fallback' $settings 'fieldset:first-of-type > * { display: block !important; }'
Assert-Contains 'Administration no-script fallback' $settings '[data-easystud-loading-skeleton] { display: none !important; }'
Assert-Contains 'Administration no-script specificity override' $settings '.settingsform .local-groupimport-admin-settings__loading-skeleton[data-easystud-loading-skeleton] { display: none !important; }'
Assert-Contains 'Administration JavaScript busy lifecycle' $bootstrap "root.setAttribute('aria-busy', 'true');"
Assert-Contains 'Administration JavaScript ready lifecycle' $bootstrap "root.setAttribute('aria-busy', 'false');"
Assert-Contains 'Administration fail-open deadline' $bootstrap '}, 1500);'
Assert-Contains 'Administration loading styles' $styles 'body.local-groupimport-admin-settings-page--loading'
Assert-Contains 'Administration no-script documentation' $documentation 'no-script fallback'
if ($settings.Contains("'aria-busy' => 'true'")) {
    throw 'Administration must not emit aria-busy server-side when no-script reveals usable native settings.'
}

Write-Host 'Administration settings loading contract passed.'
