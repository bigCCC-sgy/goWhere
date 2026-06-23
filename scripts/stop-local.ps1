$ErrorActionPreference = "SilentlyContinue"

$scriptRoot = $PSScriptRoot

& (Join-Path $scriptRoot "stop-web.ps1")
& (Join-Path $scriptRoot "stop-backend.ps1")
