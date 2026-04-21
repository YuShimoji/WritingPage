param(
  [Parameter(Mandatory = $true)]
  [string]$AppPath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $AppPath)) {
  throw "Packaged app not found: $AppPath"
}

function Convert-ToWslPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$WindowsPath
  )

  if ($WindowsPath -notmatch '^(?<drive>[A-Za-z]):\\(?<rest>.*)$') {
    return $null
  }

  $drive = $Matches['drive'].ToLowerInvariant()
  $rest = $Matches['rest'] -replace '\\', '/'
  if ([string]::IsNullOrWhiteSpace($rest)) {
    return "/mnt/$drive"
  }
  return "/mnt/$drive/$rest"
}

function Close-RepoPlaywrightElectron {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ResolvedAppPath
  )

  $repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ResolvedAppPath))
  $repoRootWindows = [System.IO.Path]::GetFullPath($repoRoot)
  $repoRootForward = $repoRootWindows -replace '\\', '/'
  $repoRootWsl = Convert-ToWslPath -WindowsPath $repoRootWindows
  $loaderNeedle = 'playwright-core/lib/server/electron/loader'

  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Name -eq 'electron.exe' -and
      $_.CommandLine -and
      ($_.CommandLine -replace '\\', '/').IndexOf($loaderNeedle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 -and
      (
        ($_.CommandLine -replace '\\', '/').IndexOf($repoRootForward, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 -or
        ($repoRootWsl -and ($_.CommandLine -replace '\\', '/').IndexOf($repoRootWsl, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)
      )
    } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
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

Close-RepoPlaywrightElectron -ResolvedAppPath $AppPath

Start-Process -FilePath $AppPath | Out-Null
