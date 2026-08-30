$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$structure = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_structure.scss')
$styles = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'styles.css')

if ($structure -notmatch '(?s)&-tree__section--ungrouped \{.*?--local-groupimport-easystud-ungrouped: #526c78;.*?identity-rail\(var\(--local-groupimport-easystud-icon-user\)\).*?&\.is-expanded:focus-within \{.*?card-focus-context' -or
        $structure -notmatch '(?s)&-tree__section--ungrouped > &-tree__toggle \{.*?card-title\(container, var\(--local-groupimport-easystud-ungrouped\)\)' -or
        $structure -notmatch '(?s)\[data-easystud-grouping-id\]\.is-expanded:focus-within.*?card-focus-context\(\s*0 0\.42rem 0\.9rem -0\.28rem rgba\(106, 127, 152, 0\.18\)\s*\)') {
    throw 'Missing Complete-view ungrouped identity or expanded-card focus contract in source SCSS.'
}

if ($styles -notmatch '(?s)\.local-groupimport-easystud-tree__section--ungrouped \{.*?--local-groupimport-easystud-ungrouped: #526c78;.*?border-left-color: var\(--local-groupimport-easystud-ungrouped-rail\);' -or
        $styles -notmatch '(?s)\.local-groupimport-easystud-tree__section--ungrouped\.is-expanded:focus-within \{.*?box-shadow: inset 0 0 0 var\(--easyedu-focus-ring-width\) var\(--easyedu-focus-ring\)') {
    throw 'Missing generated Complete-view ungrouped identity or inner focus rail contract.'
}

Write-Output 'EasyStud Complete-view ungrouped-card contract passed.'
