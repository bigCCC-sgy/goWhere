$ErrorActionPreference = "Stop"

$scriptRoot = $PSScriptRoot

& (Join-Path $scriptRoot "start-backend.ps1")
& (Join-Path $scriptRoot "start-web.ps1")

Write-Host ""
Write-Host "GoWhere local services are ready:"
Write-Host "  Web:     http://127.0.0.1:3000"
Write-Host "  Backend: http://127.0.0.1:8080"
