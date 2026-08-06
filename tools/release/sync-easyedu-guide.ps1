param(
    [Parameter(Mandatory = $true)]
    [string]$CanonicalKitRoot,

    [string]$PluginRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,

    [switch]$Apply
)

$ErrorActionPreference = "Stop"

$kitRoot = (Resolve-Path -LiteralPath $CanonicalKitRoot).Path
$pluginRootPath = (Resolve-Path -LiteralPath $PluginRoot).Path

function Read-NormalizedText {
    param([string]$Path)

    return (Get-Content -LiteralPath $Path -Raw) -replace "`r`n", "`n"
}

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Resolve-OwnedPath {
    param(
        [string]$Root,
        [string]$RelativePath
    )

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $RelativePath))
    $rootPrefix = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    if (-not $fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Resolved path escapes the owned root: $fullPath"
    }
    return $fullPath
}

$canonicalJavascriptPath = Resolve-OwnedPath $kitRoot "guide\amd\src\easyedu_guide.js"
$canonicalTemplatePath = Resolve-OwnedPath $kitRoot "guide\templates\easyedu_guide.mustache"
$canonicalStylesPath = Resolve-OwnedPath $kitRoot "scss\easyedu\components\_guide.scss"

$canonicalJavascript = Read-NormalizedText $canonicalJavascriptPath
foreach ($marker in @("export const destroy =", "export const init =", "export default init;")) {
    if (-not $canonicalJavascript.Contains($marker)) {
        throw "Canonical guide source is missing required marker: $marker"
    }
}

$wrappedBody = $canonicalJavascript.Replace("export const destroy =", "const destroy =")
$wrappedBody = $wrappedBody.Replace("export const init =", "const init =")
$wrappedBody = $wrappedBody.Replace("export default init;", "")
$wrappedBody = $wrappedBody.TrimEnd()

$runtimeJavascript = @"
// This file is generated from the embedded EasyEdu guide kit source and adapted to Moodle AMD.
// Keep behaviour aligned with easyedu-guide-kit/amd/src/easyedu_guide.js, then pass
// selectors, paths and labels from plugin-specific PHP/Mustache data.

define([], function() {
$wrappedBody

return {
  destroy: destroy,
  init: init
};
});
"@
$runtimeJavascript = $runtimeJavascript.TrimEnd() + "`n"

$items = @(
    [pscustomobject]@{
        Name = "embedded JavaScript"
        Source = $canonicalJavascriptPath
        Target = Resolve-OwnedPath $pluginRootPath "easyedu-guide-kit\amd\src\easyedu_guide.js"
        Expected = $canonicalJavascript
    },
    [pscustomobject]@{
        Name = "embedded Mustache"
        Source = $canonicalTemplatePath
        Target = Resolve-OwnedPath $pluginRootPath "easyedu-guide-kit\templates\easyedu_guide.mustache"
        Expected = Read-NormalizedText $canonicalTemplatePath
    },
    [pscustomobject]@{
        Name = "runtime shared SCSS"
        Source = $canonicalStylesPath
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\components\_guide.scss"
        Expected = Read-NormalizedText $canonicalStylesPath
    },
    [pscustomobject]@{
        Name = "runtime AMD source"
        Source = $null
        Target = Resolve-OwnedPath $pluginRootPath "amd\src\easyedu_guide.js"
        Expected = $runtimeJavascript
    }
)

$drift = New-Object System.Collections.Generic.List[object]
foreach ($item in $items) {
    if (-not (Test-Path -LiteralPath $item.Target)) {
        throw "Required EasyStud target is missing: $($item.Target)"
    }
    $actual = Read-NormalizedText $item.Target
    if ($actual -cne $item.Expected) {
        $drift.Add($item) | Out-Null
        Write-Host "[DRIFT] $($item.Name): $($item.Target)"
    } else {
        Write-Host "[ALIGNED] $($item.Name): $($item.Target)"
    }
}

if (-not $Apply) {
    if ($drift.Count -gt 0) {
        throw "EasyStud guide synchronization check found $($drift.Count) drifted source file(s)."
    }
    Write-Host "EasyStud guide sources match the canonical UI Kit."
    return
}

foreach ($item in $drift) {
    Write-Utf8NoBom $item.Target ($item.Expected.TrimEnd() + "`n")
    Write-Host "[SYNCED] $($item.Name): $($item.Target)"
}

Write-Host "EasyStud guide source synchronization completed."
