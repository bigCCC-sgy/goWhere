param(
  [switch]$Child
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root "logs"
$pidFile = Join-Path $logs "backend-only.pid.txt"
$hostLog = Join-Path $logs "backend-only.host.log"
$hostErrorLog = Join-Path $logs "backend-only.host.err.log"
$backendLog = Join-Path $logs "backend-only.out.log"
$port = 8080
$url = "http://127.0.0.1:$port/api/config/scenes"

New-Item -ItemType Directory -Force -Path $logs | Out-Null

function Import-EnvFile($path) {
  if (-not (Test-Path $path)) {
    return
  }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0 -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }
    $name, $value = $line -split "=", 2
    [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
  }
}

function Test-BackendReady {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (-not $Child) {
  if (Test-BackendReady) {
    Write-Host "Backend is already running: http://127.0.0.1:$port"
    exit 0
  }

  if (Test-Path $hostErrorLog) {
    Remove-Item -LiteralPath $hostErrorLog -Force
  }

  $hostProcess = Start-Process `
    -FilePath "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $PSCommandPath, "-Child") `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -PassThru

  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (-not (Get-Process -Id $hostProcess.Id -ErrorAction SilentlyContinue)) {
      Write-Host "Backend host process exited early. Check logs:"
      Write-Host "  $backendLog"
      Write-Host "  $hostErrorLog"
      exit 1
    }
    if (Test-BackendReady) {
      Write-Host "Backend started: http://127.0.0.1:$port"
      Write-Host "Host PID: $($hostProcess.Id)"
      exit 0
    }
  }

  Write-Host "Backend did not respond yet. Check logs:"
  Write-Host "  $backendLog"
  Write-Host "  $hostErrorLog"
  exit 1
}

try {
  "host_pid=$PID" | Set-Content -Encoding UTF8 $pidFile
  "started_at=$(Get-Date -Format o)" | Set-Content -Encoding UTF8 $hostLog
  Import-EnvFile (Join-Path $root ".env.local")
  Import-EnvFile (Join-Path $root "backend\.env.local")

  $jar = Join-Path $root "backend\target\gowhere-backend-0.1.0-SNAPSHOT.jar"
  if (-not (Test-Path $jar)) {
    throw "Backend jar not found. Run Maven package first."
  }

  $javaHomeBin = Join-Path $root ".java\bin\java.exe"
  if (Test-Path "D:\java_jdk\corretto-18.0.2\bin\java.exe") {
    $java = "D:\java_jdk\corretto-18.0.2\bin\java.exe"
  } elseif (Test-Path $javaHomeBin) {
    $java = $javaHomeBin
  } else {
    $java = (Get-Command java).Source
  }

  Set-Location (Join-Path $root "backend")
  & $java -jar $jar *> $backendLog
  "java_exit_code=$LASTEXITCODE" | Add-Content -Encoding UTF8 $hostLog
} catch {
  $_ | Out-String | Set-Content -Encoding UTF8 $hostErrorLog
  throw
}
