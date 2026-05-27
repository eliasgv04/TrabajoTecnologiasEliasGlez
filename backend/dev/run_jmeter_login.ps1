[CmdletBinding()]
param(
    [switch]$DebugMode
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = (Resolve-Path (Join-Path $scriptDir '..')).Path

$jmeterCmd = Get-Command jmeter -ErrorAction SilentlyContinue
if ($jmeterCmd) {
    $jmeterExe = $jmeterCmd.Source
} else {
    $candidate = 'C:\Users\Elias\AppData\Local\Programs\JMeter\bin\jmeter.bat'
    if (Test-Path $candidate) {
        $jmeterExe = $candidate
    } else {
        throw 'No se encontró JMeter en PATH ni en la ruta por defecto.'
    }
}

$testPlan = Join-Path $backendDir 'src\test\jmeter\prueba_rendimiento_login.jmx'
$resultFile = Join-Path $backendDir 'src\test\jmeter\results_login.jtl'
$reportDir = Join-Path $backendDir 'src\test\jmeter\report_login'

if (Test-Path $resultFile) {
    Remove-Item $resultFile -Force
}

if (Test-Path $reportDir) {
    Remove-Item $reportDir -Recurse -Force
}

New-Item -ItemType Directory -Path $reportDir -Force | Out-Null

$jmeterArgs = @(
    '-n',
    '-t', $testPlan,
    '-l', $resultFile,
    '-e',
    '-o', $reportDir
)

if ($DebugMode) {
    $jmeterArgs = @('-LDEBUG') + $jmeterArgs
}

Push-Location $backendDir
try {
    & $jmeterExe @jmeterArgs
    if ($LASTEXITCODE -ne 0) {
        throw "JMeter falló con código $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

$reportIndex = Join-Path $reportDir 'index.html'
if (Test-Path $reportIndex) {
    Start-Process $reportIndex | Out-Null
}
