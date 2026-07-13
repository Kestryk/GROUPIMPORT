param(
    [string] $MoodleUrl = 'http://localhost/local/groupimport/index.php?id=5',
    [string] $Username = 'Admin',
    [string] $Password = $env:EASYEDU_MOODLE_PASSWORD
)

$ErrorActionPreference = 'Stop'
$toolRoot = $PSScriptRoot
$pluginRoot = (Resolve-Path (Join-Path $toolRoot '..\..')).Path
$moodleRoot = (Resolve-Path (Join-Path $pluginRoot '..\..')).Path
$serverRoot = Split-Path -Parent $moodleRoot
$localPhpDirectory = Join-Path $serverRoot 'php'

if (-not $Password) {
    $securePassword = Read-Host 'Moodle password' -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
        $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
}

Push-Location $toolRoot
try {
    if (-not (Test-Path -LiteralPath '.\node_modules\@playwright\test')) {
        npm install --no-audit --no-fund
    }

    if (Test-Path -LiteralPath (Join-Path $localPhpDirectory 'php.exe')) {
        $env:Path = $localPhpDirectory + [System.IO.Path]::PathSeparator + $env:Path
    }

    $env:EASYEDU_MASS_IMPORT_URL = $MoodleUrl
    $env:EASYEDU_MOODLE_USERNAME = $Username
    $env:EASYEDU_MOODLE_PASSWORD = $Password

    npx playwright test .\mass-import-restore-audit.spec.js --reporter=line --workers=1 --timeout=180000
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
