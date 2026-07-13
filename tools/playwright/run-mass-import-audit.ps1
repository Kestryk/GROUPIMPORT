param(
    [string] $MoodleUrl = 'http://localhost/local/groupimport/index.php?id=5',
    [string] $Username = 'Admin',
    [string] $Password = $env:EASYEDU_MOODLE_PASSWORD
)

$ErrorActionPreference = 'Stop'
$toolRoot = $PSScriptRoot

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

    $env:EASYEDU_MASS_IMPORT_URL = $MoodleUrl
    $env:EASYEDU_MOODLE_USERNAME = $Username
    $env:EASYEDU_MOODLE_PASSWORD = $Password

    npx playwright test .\mass-import-audit.spec.js --reporter=line --workers=1 --timeout=90000
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
