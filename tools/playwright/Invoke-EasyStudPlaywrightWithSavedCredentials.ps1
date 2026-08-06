[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$CredentialLoaderPath,

    [Parameter(Mandatory = $true)]
    [string]$OrchestrationModulePath,

    [string]$Spec = 'responsive-audit.spec.js',

    # Optional explicit root for a source-checkout spec. It is allowlisted only
    # when it resolves to that checkout's own local_groupimport/tools/playwright.
    [string]$AllowedSpecRoot,

    [string]$Grep = 'desktop layouts and guide launcher remain available',

    [string]$MoodleUrl = 'http://localhost/local/groupimport/manage.php?id=5',

    [string]$ArtifactRoot,

    [string]$LeaseResource = 'groupimport-active-runtime-write',

    [switch]$WaitForLease,

    [ValidateRange(1, 86400)]
    [int]$LeaseWaitTimeoutSeconds = 900,

    [ValidateRange(1, 60)]
    [int]$LeaseWaitPollSeconds = 5,

    [ValidateRange(60, 1800)]
    [int]$WatchdogSeconds = 300,

    [switch]$DiscoveryOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-ExistingLeaf {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "$Label does not exist: $Path"
    }
    return (Resolve-Path -LiteralPath $Path).Path
}

function Test-PathIsSameOrBelow {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Root
    )

    $candidate = [IO.Path]::GetFullPath($Path).TrimEnd('\', '/')
    $boundary = [IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
    return $candidate.Equals($boundary, [StringComparison]::OrdinalIgnoreCase) -or
        $candidate.StartsWith(
            $boundary + [IO.Path]::DirectorySeparatorChar,
            [StringComparison]::OrdinalIgnoreCase
        )
}

function ConvertTo-ProcessArgument {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value)

    if ($Value -notmatch '[\s"]') {
        return $Value
    }
    return '"' + $Value.Replace('\', '\').Replace('"', '\"') + '"'
}

function Invoke-OwnedNodeProcess {
    param(
        [Parameter(Mandatory = $true)][string]$NodePath,
        [Parameter(Mandatory = $true)][string[]]$Argument,
        [Parameter(Mandatory = $true)][int]$TimeoutSeconds
    )

    $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $NodePath
    $startInfo.Arguments = (($Argument | ForEach-Object {
        ConvertTo-ProcessArgument -Value $_
    }) -join ' ')
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.WorkingDirectory = $script:PlaywrightRoot

    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    if (-not $process.Start()) {
        throw 'Unable to start the owned Node process.'
    }

    $script:OwnedProcess = $process
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    $timedOut = -not $process.WaitForExit($TimeoutSeconds * 1000)
    if ($timedOut) {
        & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
        $process.WaitForExit()
    }

    $stdout = $stdoutTask.GetAwaiter().GetResult()
    $stderr = $stderrTask.GetAwaiter().GetResult()
    $exitCode = if ($timedOut) { 124 } else { $process.ExitCode }
    $process.Dispose()
    $script:OwnedProcess = $null

    return [pscustomobject]@{
        ExitCode = $exitCode
        TimedOut = $timedOut
        StdOut = $stdout
        StdErr = $stderr
    }
}

function Protect-SensitiveText {
    param([AllowNull()][string]$Text)

    if ($null -eq $Text) {
        return ''
    }
    $protected = $Text
    foreach ($secret in @($script:LoadedPassword, $script:LoadedUsername)) {
        if (-not [string]::IsNullOrEmpty($secret)) {
            $protected = $protected.Replace($secret, '[REDACTED]')
        }
    }
    return [regex]::Replace(
        $protected,
        '(?i)(password|token|cookie|sesskey)=([^&\s]+)',
        '$1=[REDACTED]'
    )
}

function Write-JsonFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$Value
    )

    $json = $Value | ConvertTo-Json -Depth 10
    [IO.File]::WriteAllText($Path, $json, [Text.UTF8Encoding]::new($false))
}

$runtimePlaywrightRoot = (Resolve-Path -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)).Path
$script:PlaywrightRoot = $runtimePlaywrightRoot
$pluginRoot = (Resolve-Path -LiteralPath (Join-Path $script:PlaywrightRoot '..\..')).Path
if (-not [string]::IsNullOrWhiteSpace($AllowedSpecRoot)) {
    $candidateSpecRoot = (Resolve-Path -LiteralPath $AllowedSpecRoot).Path
    $candidatePluginRoot = (Resolve-Path -LiteralPath (Join-Path $candidateSpecRoot '..\..')).Path
    $expectedSpecRoot = (Join-Path $candidatePluginRoot 'tools\playwright')
    if (-not $candidateSpecRoot.Equals($expectedSpecRoot, [StringComparison]::OrdinalIgnoreCase) -or
        -not (Test-Path -LiteralPath (Join-Path $candidatePluginRoot 'version.php') -PathType Leaf)) {
        throw 'AllowedSpecRoot must be the tools/playwright directory of a local_groupimport checkout.'
    }
    $script:PlaywrightRoot = $candidateSpecRoot
    $pluginRoot = $candidatePluginRoot
}
$credentialLoader = Resolve-ExistingLeaf -Path $CredentialLoaderPath -Label 'Credential loader'
$orchestrationModule = Resolve-ExistingLeaf -Path $OrchestrationModulePath -Label 'Orchestration module'
$manifestRegistrar = Resolve-ExistingLeaf `
    -Path (Join-Path (Split-Path -Parent $orchestrationModule) 'Register-EasyEduArtifactManifest.ps1') `
    -Label 'Artifact manifest registrar'
$playwrightCli = Resolve-ExistingLeaf `
    -Path (Join-Path $script:PlaywrightRoot 'node_modules\@playwright\test\cli.js') `
    -Label 'Playwright CLI'
$playwrightConfig = Resolve-ExistingLeaf `
    -Path (Join-Path $script:PlaywrightRoot 'playwright.config.js') `
    -Label 'Playwright configuration'
$specPath = Resolve-ExistingLeaf -Path (Join-Path $script:PlaywrightRoot $Spec) -Label 'Playwright spec'
if (-not (Test-PathIsSameOrBelow -Path $specPath -Root $script:PlaywrightRoot)) {
    throw 'The Playwright spec must stay below the allowlisted tools/playwright root.'
}
$specArgument = $specPath.Substring($script:PlaywrightRoot.Length).TrimStart('\', '/').Replace('\', '/')
if ([string]::IsNullOrWhiteSpace($Grep)) {
    throw 'Grep must identify exactly one Playwright test.'
}

$nodeCommand = Get-Command node -CommandType Application -ErrorAction Stop |
    Select-Object -First 1
$nodePath = $nodeCommand.Source
$script:OwnedProcess = $null
$script:LoadedPassword = $null
$script:LoadedUsername = $null

# Discovery is deliberately performed before artifact writes, credentials and leases.
$listArguments = @(
    $playwrightCli,
    'test',
    $specArgument,
    ('--config=' + $playwrightConfig.Replace('\', '/')),
    "--grep=$Grep",
    '--list',
    '--workers=1'
)
$discovery = Invoke-OwnedNodeProcess `
    -NodePath $nodePath `
    -Argument $listArguments `
    -TimeoutSeconds ([Math]::Min($WatchdogSeconds, 120))
$discoveryText = $discovery.StdOut + [Environment]::NewLine + $discovery.StdErr
if ($discovery.ExitCode -ne 0) {
    throw "Playwright discovery failed with exit code $($discovery.ExitCode)."
}
$totalMatch = [regex]::Match($discoveryText, '(?im)^\s*Total:\s*(\d+)\s+test(?:s)?\b')
if (-not $totalMatch.Success -or [int]$totalMatch.Groups[1].Value -ne 1) {
    throw 'Playwright discovery must select exactly one test.'
}

if ([string]::IsNullOrWhiteSpace($ArtifactRoot)) {
    $ArtifactRoot = if (-not [string]::IsNullOrWhiteSpace($env:EASYEDU_PLAYWRIGHT_ARTIFACTS_ROOT)) {
        $env:EASYEDU_PLAYWRIGHT_ARTIFACTS_ROOT
    } else {
        Join-Path $env:LOCALAPPDATA 'EasyEdu\artifacts'
    }
}
$approvedArtifactRoot = [IO.Path]::GetFullPath($ArtifactRoot).TrimEnd('\', '/')
if ((Test-PathIsSameOrBelow -Path $approvedArtifactRoot -Root $pluginRoot) -or
    (Test-PathIsSameOrBelow -Path $pluginRoot -Root $approvedArtifactRoot)) {
    throw 'ArtifactRoot must be external to, and must not contain, the EasyStud checkout.'
}

$runId = 'easystud-authenticated-{0}-{1}' -f
    ([DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')),
    $PID
$runRoot = Join-Path $approvedArtifactRoot (Join-Path 'easystud\authenticated' $runId)
$playwrightOutput = Join-Path $runRoot 'playwright-output'
$profileRoot = Join-Path $runRoot 'profile'
New-Item -ItemType Directory -Path $playwrightOutput -Force | Out-Null
New-Item -ItemType Directory -Path $profileRoot -Force | Out-Null

$discoveryLog = Join-Path $runRoot 'discovery.log'
[IO.File]::WriteAllText(
    $discoveryLog,
    (Protect-SensitiveText -Text $discoveryText),
    [Text.UTF8Encoding]::new($false)
)

$credentialEnvironmentNames = @(
    'EASYEDU_MOODLE_URL',
    'EASYEDU_MOODLE_USERNAME',
    'EASYEDU_MOODLE_PASSWORD',
    'EASYEDU_LOADING_DIAGNOSTIC_URL',
    'EASYEDU_CCB_MOODLE_URL',
    'EASYEDU_CCB_MOODLE_USERNAME',
    'EASYEDU_CCB_MOODLE_PASSWORD'
)
$runnerEnvironmentNames = @(
    'PLAYWRIGHT_OUTPUT_DIR',
    'PLAYWRIGHT_PROFILE_DIR',
    'EASYEDU_PLAYWRIGHT_PROFILE_ROOT'
)
$previousRunnerEnvironment = @{}
foreach ($name in $runnerEnvironmentNames) {
    $previousRunnerEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

$leaseAcquired = $false
$leaseReleased = $false
$credentialsCleared = $false
$ownedChildStopped = $true
$testExitCode = $null
$runnerExitCode = 1
$timedOut = $false
$status = if ($DiscoveryOnly) { 'incomplete' } else { 'failed' }
$failureMessage = $null
$startedAt = [DateTime]::UtcNow

try {
    if ($DiscoveryOnly) {
        $runnerExitCode = 0
    } else {
        Import-Module -Name $orchestrationModule -Force
        $leaseSeconds = [Math]::Min(3600, [Math]::Max(120, $WatchdogSeconds + 120))
        $leaseArguments = @{
            Resource = $LeaseResource
            ProjectNamespace = 'easystud'
            RunId = $runId
            Repository = $pluginRoot
            Purpose = 'Authenticated EasyStud Playwright test'
            LeaseSeconds = $leaseSeconds
            OwnerPid = $PID
        }
        if ($WaitForLease) {
            $leaseArguments.MaxWaitSeconds = $LeaseWaitTimeoutSeconds
            $leaseArguments.PollSeconds = $LeaseWaitPollSeconds
            Wait-EasyEduResourceLease @leaseArguments | Out-Null
        } else {
            Acquire-EasyEduResourceLease @leaseArguments | Out-Null
        }
        $leaseAcquired = $true

        . $credentialLoader | Out-Null
        $script:LoadedUsername = [Environment]::GetEnvironmentVariable(
            'EASYEDU_MOODLE_USERNAME',
            'Process'
        )
        $script:LoadedPassword = [Environment]::GetEnvironmentVariable(
            'EASYEDU_MOODLE_PASSWORD',
            'Process'
        )
        if ([string]::IsNullOrEmpty($script:LoadedUsername) -or
            [string]::IsNullOrEmpty($script:LoadedPassword)) {
            throw 'The DPAPI loader did not provide process-local Moodle credentials.'
        }

        [Environment]::SetEnvironmentVariable('EASYEDU_MOODLE_URL', $MoodleUrl, 'Process')
        [Environment]::SetEnvironmentVariable('EASYEDU_LOADING_DIAGNOSTIC_URL', $MoodleUrl, 'Process')
        [Environment]::SetEnvironmentVariable('PLAYWRIGHT_OUTPUT_DIR', $playwrightOutput, 'Process')
        [Environment]::SetEnvironmentVariable('PLAYWRIGHT_PROFILE_DIR', $profileRoot, 'Process')
        [Environment]::SetEnvironmentVariable('EASYEDU_PLAYWRIGHT_PROFILE_ROOT', $profileRoot, 'Process')

        $testArguments = @(
            $playwrightCli,
            'test',
            $specArgument,
            ('--config=' + $playwrightConfig.Replace('\', '/')),
            "--grep=$Grep",
            '--reporter=line',
            '--workers=1',
            '--retries=0',
            '--timeout=90000',
            '--output',
            $playwrightOutput
        )
        $testResult = Invoke-OwnedNodeProcess `
            -NodePath $nodePath `
            -Argument $testArguments `
            -TimeoutSeconds $WatchdogSeconds
        $testExitCode = $testResult.ExitCode
        $timedOut = $testResult.TimedOut
        [IO.File]::WriteAllText(
            (Join-Path $runRoot 'playwright.stdout.log'),
            (Protect-SensitiveText -Text $testResult.StdOut),
            [Text.UTF8Encoding]::new($false)
        )
        [IO.File]::WriteAllText(
            (Join-Path $runRoot 'playwright.stderr.log'),
            (Protect-SensitiveText -Text $testResult.StdErr),
            [Text.UTF8Encoding]::new($false)
        )
        if ($testExitCode -ne 0) {
            throw "The Playwright test failed with exit code $testExitCode."
        }

        $status = 'passed'
        $runnerExitCode = 0
    }
} catch {
    $failureMessage = Protect-SensitiveText -Text $_.Exception.Message
    $runnerExitCode = 1
    $status = 'failed'
} finally {
    if ($null -ne $script:OwnedProcess) {
        try {
            if (-not $script:OwnedProcess.HasExited) {
                & taskkill.exe /PID $script:OwnedProcess.Id /T /F 2>$null | Out-Null
                $script:OwnedProcess.WaitForExit()
            }
        } catch {
            $ownedChildStopped = $false
            $runnerExitCode = 1
            $status = 'failed'
        } finally {
            $script:OwnedProcess.Dispose()
            $script:OwnedProcess = $null
        }
    }

    foreach ($name in $credentialEnvironmentNames) {
        [Environment]::SetEnvironmentVariable($name, $null, 'Process')
    }
    $credentialsCleared = $true
    $script:LoadedPassword = $null
    $script:LoadedUsername = $null

    foreach ($name in $runnerEnvironmentNames) {
        [Environment]::SetEnvironmentVariable($name, $previousRunnerEnvironment[$name], 'Process')
    }

    if ($leaseAcquired) {
        try {
            Release-EasyEduResourceLease -Resource $LeaseResource -RunId $runId
            $leaseReleased = $true
        } catch {
            $leaseReleased = $false
            $runnerExitCode = 1
            $status = 'failed'
            if ([string]::IsNullOrEmpty($failureMessage)) {
                $failureMessage = 'The owned Moodle fixture lease could not be released.'
            }
        }
    } else {
        $leaseReleased = $true
    }
}

$finishedAt = [DateTime]::UtcNow
$cleanup = [ordered]@{
    schemaVersion = 1
    runId = $runId
    credentialsCleared = $credentialsCleared
    leaseAcquired = $leaseAcquired
    leaseReleased = $leaseReleased
    ownedChildStopped = $ownedChildStopped
    profileExternal = -not (Test-PathIsSameOrBelow -Path $profileRoot -Root $pluginRoot)
}
Write-JsonFile -Path (Join-Path $runRoot 'cleanup.json') -Value $cleanup

$result = [ordered]@{
    schemaVersion = 1
    projectNamespace = 'easystud'
    runId = $runId
    status = $status
    discoveryOnly = [bool]$DiscoveryOnly
    selectedTests = 1
    testExitCode = $testExitCode
    runnerExitCode = $runnerExitCode
    timedOut = $timedOut
    startedAtUtc = $startedAt.ToString('o')
    finishedAtUtc = $finishedAt.ToString('o')
    failure = $failureMessage
}
Write-JsonFile -Path (Join-Path $runRoot 'runner-result.json') -Value $result

$progress = @(
    [ordered]@{
        phase = 'discovery'
        status = 'passed'
        selectedTests = 1
    },
    [ordered]@{
        phase = if ($DiscoveryOnly) { 'execution' } else { 'authenticated-test' }
        status = $status
        testExitCode = $testExitCode
    },
    [ordered]@{
        phase = 'cleanup'
        status = if ($credentialsCleared -and $leaseReleased -and $ownedChildStopped) {
            'passed'
        } else {
            'failed'
        }
    }
)
$progressJson = ($progress | ForEach-Object { $_ | ConvertTo-Json -Compress })
[IO.File]::WriteAllLines(
    (Join-Path $runRoot 'phase-progress.jsonl'),
    $progressJson,
    [Text.UTF8Encoding]::new($false)
)

$manifestFailure = $null
try {
    & $manifestRegistrar `
        -RunRoot $runRoot `
        -ApprovedRoot $approvedArtifactRoot `
        -ProjectNamespace 'easystud' `
        -RunId $runId `
        -Status $status | Out-Null
} catch {
    $runnerExitCode = 1
    $status = 'failed'
    $manifestFailure = Protect-SensitiveText -Text $_.Exception.Message
    $result.status = $status
    $result.runnerExitCode = $runnerExitCode
    $result.failure = "Artifact manifest registration failed: $manifestFailure"
    Write-JsonFile -Path (Join-Path $runRoot 'runner-result.json') -Value $result
}

$manifestPath = Join-Path $runRoot 'artifact-manifest.json'
if ($null -ne $manifestFailure) {
    Write-Error -ErrorAction Continue "Artifact manifest registration failed: $manifestFailure"
}
Write-Output "Run ID: $runId"
Write-Output 'Selected tests: 1'
Write-Output "Exit code: $runnerExitCode"
Write-Output "Artifacts: $runRoot"
Write-Output "Manifest: $manifestPath"
exit $runnerExitCode
