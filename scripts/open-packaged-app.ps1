param(
  [Parameter(Mandatory = $true)]
  [string]$AppPath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $AppPath)) {
  throw "Packaged app not found: $AppPath"
}

$pollutingPrefixes = @(
  'PLAYWRIGHT_',
  'PW_'
)

$pollutingExactNames = @(
  'NODE_OPTIONS',
  'ELECTRON_RUN_AS_NODE'
)

Get-ChildItem Env: | ForEach-Object {
  $name = $_.Name
  if ($pollutingExactNames -contains $name) {
    Remove-Item -LiteralPath ("Env:\" + $name) -ErrorAction SilentlyContinue
    return
  }
  foreach ($prefix in $pollutingPrefixes) {
    if ($name.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      Remove-Item -LiteralPath ("Env:\" + $name) -ErrorAction SilentlyContinue
      break
    }
  }
}

Start-Process -FilePath $AppPath | Out-Null
