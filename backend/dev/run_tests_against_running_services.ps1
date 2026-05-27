<#
Simple runner that assumes frontend (https://localhost:4200) and backend (https://localhost:8000)
are already running. It will:
 - optionally seed 1000 users using the test that encodes passwords
 - run Selenium E2E tests (maven profile `e2e`)
 - run JMeter plan and generate HTML report
 - collect logs and open the generated reports

Usage:
  .\run_tests_against_running_services.ps1 [-SkipSeed] [-Debug]

#>
[CmdletBinding()]
param(
    [switch]$SkipSeed,
    [switch]$DebugMode,
    [switch]$NoJMeterWait
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = (Resolve-Path (Join-Path $scriptDir '..')).Path
$logDir = Join-Path $backendDir "target\automation-logs\running-services-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$seedLog = Join-Path $logDir 'seed.log'
$e2eLog = Join-Path $logDir 'e2e.log'
$jmeterLog = Join-Path $logDir 'jmeter.log'

Write-Host "Logs: $logDir"

function Wait-Url {
    param([string]$u,[int]$t=15)
    try { Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec $t | Out-Null; return $true } catch { return $false }
}

if (-not (Wait-Url -u 'https://localhost:4200' -t 5)) {
    Write-Host 'AVISO: Frontend no responde en https://localhost:4200' -ForegroundColor Yellow
}
if (-not (Wait-Url -u 'https://localhost:8000/actuator/health' -t 5)) {
    Write-Host 'AVISO: Backend no responde en https://localhost:8000. Continuo de todas formas.' -ForegroundColor Yellow
}

if (-not $SkipSeed) {
    $seedArgs = @('-Dtest=SeedJmeterUsersWithEncodedPasswordTest','test')
    if ($DebugMode) { $seedArgs = @('-X') + $seedArgs }
    Write-Host 'Ejecutando seed de usuarios (puede tardar algunos segundos)...'
    Push-Location $backendDir
    try {
        & mvn @seedArgs 2>&1 | Tee-Object -FilePath $seedLog
        $seedExit = $LASTEXITCODE
    } catch {
        $seedExit = $LASTEXITCODE
    }
    Pop-Location

    if ($seedExit -ne 0) {
        Write-Warning "La seed devolvió código $seedExit - revisa $seedLog. Continuo de todas formas."
    } else {
        Write-Host 'Seed completada correctamente.' -ForegroundColor Green
    }
}

Write-Host 'Ejecutando pruebas E2E (Selenium) via Maven profile e2e...'
Push-Location $backendDir
$e2eArgs = @('-Pe2e','-DskipTests=false','verify')
if ($DebugMode) { $e2eArgs = @('-X') + $e2eArgs }
try {
    & mvn @e2eArgs 2>&1 | Tee-Object -FilePath $e2eLog
    $e2eExit = $LASTEXITCODE
} catch {
    $e2eExit = $LASTEXITCODE
}
if ($e2eExit -ne 0) { Write-Warning "E2E Maven returned code $e2eExit. Check $e2eLog" } else { Write-Host 'E2E tests completed successfully.' -ForegroundColor Green }
Pop-Location

Write-Host 'Ejecutando JMeter (prueba login 1000 usuarios)...'
${_jmc} = Get-Command jmeter -ErrorAction SilentlyContinue
if (${_jmc}) { $jmeterCmd = ${_jmc}.Source } else { $jmeterCmd = 'C:\Users\Elias\AppData\Local\Programs\JMeter\bin\jmeter.bat' }
if (-not (Test-Path $jmeterCmd)) { Write-Error 'JMeter no encontrado. Instala jmeter y ponlo en PATH o ajusta la ruta.'; exit 1 }

Push-Location $backendDir
if ($NoJMeterWait) {
    $cmdLine = "`"$jmeterCmd`" -n -t 'src/test/jmeter/prueba_rendimiento_login.jmx' -l 'src/test/jmeter/results_login.jtl' -e -o 'src/test/jmeter/report_login' >> `"$jmeterLog`" 2>&1"
    Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', $cmdLine) -WorkingDirectory $backendDir | Out-Null
    Write-Host 'JMeter lanzado en background. No se esperará a que termine. Revisa el reporte en src/test/jmeter/report_login cuando acabe.' -ForegroundColor Yellow
    $jmeterExit = 0
} else {
    try {
        & $jmeterCmd -n -t 'src/test/jmeter/prueba_rendimiento_login.jmx' -l 'src/test/jmeter/results_login.jtl' -e -o 'src/test/jmeter/report_login' 2>&1 | Tee-Object -FilePath $jmeterLog
        $jmeterExit = $LASTEXITCODE
    } catch {
        $jmeterExit = $LASTEXITCODE
    }
    if ($jmeterExit -ne 0) { Write-Warning "JMeter returned code $jmeterExit. Check $jmeterLog" } else { Write-Host 'JMeter run completed successfully.' -ForegroundColor Green }
}
Pop-Location

$report = Join-Path $backendDir 'src\test\jmeter\report_login\index.html'
if (Test-Path $report) { Start-Process $report } else { Write-Host 'Reporte JMeter no generado.' }

$failsafe = Join-Path $backendDir 'target\failsafe-reports'
if (Test-Path $failsafe) { Start-Process $failsafe }

Start-Process $logDir
Write-Host 'Ejecución completada.' -ForegroundColor Green