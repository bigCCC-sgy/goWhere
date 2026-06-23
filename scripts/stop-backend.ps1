$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root "logs"
$pidFile = Join-Path $logs "backend-only.pid.txt"
$port = 8080
$stopped = $false

if (Test-Path $pidFile) {
  Get-Content $pidFile | ForEach-Object {
    $parts = $_ -split "="
    if ($parts.Length -eq 2) {
      $pidValue = [int]$parts[1]
      if (Get-Process -Id $pidValue -ErrorAction SilentlyContinue) {
        Stop-Process -Id $pidValue -Force
        $stopped = $true
      }
    }
  }
}

Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
  if (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue) {
    Stop-Process -Id $_.OwningProcess -Force
    $stopped = $true
  }
}

if (Test-Path $pidFile) {
  Remove-Item -LiteralPath $pidFile -Force
}

if ($stopped) {
  Write-Host "Backend stopped."
} else {
  Write-Host "Backend was not running."
}
