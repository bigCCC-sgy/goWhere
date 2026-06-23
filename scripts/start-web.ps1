$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root "logs"
$pidFile = Join-Path $logs "web-only.pid.txt"
$webLog = Join-Path $logs "web-only.out.log"
$webErrorLog = Join-Path $logs "web-only.err.log"
$port = 3000
$url = "http://127.0.0.1:$port"

New-Item -ItemType Directory -Force -Path $logs | Out-Null

function Test-WebReady {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (Test-WebReady) {
  Write-Host "Frontend is already running: $url"
  exit 0
}

if (Test-Path $webLog) {
  Remove-Item -LiteralPath $webLog -Force
}
if (Test-Path $webErrorLog) {
  Remove-Item -LiteralPath $webErrorLog -Force
}

$webDir = Join-Path $root "web"
$command = "cmd.exe /c cd /d `"$webDir`" && npm.cmd run start -- --hostname 127.0.0.1 --port $port > `"$webLog`" 2> `"$webErrorLog`""
$result = ([wmiclass]"Win32_Process").Create($command, $root, $null)
if ($result.ReturnValue -ne 0) {
  throw "Failed to start frontend process. WMI return value: $($result.ReturnValue)"
}

"pid=$($result.ProcessId)" | Set-Content -Encoding UTF8 $pidFile
"started_at=$(Get-Date -Format o)" | Add-Content -Encoding UTF8 $pidFile

for ($i = 0; $i -lt 24; $i++) {
  Start-Sleep -Milliseconds 500
  if (Test-WebReady) {
    Write-Host "Frontend started: $url"
    Write-Host "PID: $($result.ProcessId)"
    exit 0
  }
  if (-not (Get-Process -Id $result.ProcessId -ErrorAction SilentlyContinue)) {
    break
  }
}

Write-Host "Frontend did not respond yet. Check logs:"
Write-Host "  $webLog"
Write-Host "  $webErrorLog"
exit 1
