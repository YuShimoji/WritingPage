[CmdletBinding()]
param(
    [string]$Root,
    [string]$OutFile
)

$ErrorActionPreference = 'Stop'

if (-not $Root) {
    $scriptPath = $PSCommandPath
    if (-not $scriptPath) {
        $scriptPath = $MyInvocation.MyCommand.Path
    }
    $scriptDir = Split-Path -Parent $scriptPath
    $Root = (Resolve-Path (Join-Path $scriptDir '..')).Path
}

$excludedSegments = @(
    '.git',
    'node_modules',
    'dist',
    'build',
    '.venv',
    'venv',
    '__pycache__',
    'tmp',
    '.tmp',
    '.cache',
    'playwright-report',
    'test-results',
    'test-artifacts',
    '.tmp-playwright-libs',
    '.agents',
    '.claude',
    '.cursor',
    '.serena',
    '.shared-workflows',
    'shared-workflows',
    '.github',
    'docs/local-view',
    'css',
    'js',
    'electron',
    'e2e',
    'test',
    'scripts',
    'tools',
    'vendor'
)

function Convert-ToNavPath {
    param([string]$Path)
    return ($Path -replace '\\', '/')
}

function Get-RelativePath {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $base = (Resolve-Path -LiteralPath $BasePath).Path.TrimEnd('\') + '\'
    $target = (Resolve-Path -LiteralPath $TargetPath).Path
    $baseUri = New-Object System.Uri($base)
    $targetUri = New-Object System.Uri($target)
    return [System.Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString())
}

function Test-ExcludedPath {
    param([string]$RelativePath)

    $path = Convert-ToNavPath $RelativePath
    if ($path -like 'debug-*.md') {
        return $true
    }
    if ($path -like 'build-*/*' -or $path -like 'build-session*/*') {
        return $true
    }

    foreach ($segment in $excludedSegments) {
        if ($path -eq $segment -or $path.StartsWith("$segment/")) {
            return $true
        }
    }

    return $false
}

function Get-NavLabel {
    param([string]$RelativePath)

    $path = Convert-ToNavPath $RelativePath
    if ($path -eq 'index.md') {
        return 'Home'
    }

    return ($path -replace '\.md$', '')
}

function Get-SitePath {
    param([string]$RelativePath)

    $path = Convert-ToNavPath $RelativePath
    if ($path -eq 'docs/index.md') {
        return 'index.md'
    }
    if ($path -eq 'docs/README.md') {
        return 'local-view/docs/README.md'
    }
    if ($path.StartsWith('docs/')) {
        return $path.Substring(5)
    }
    if ($path.StartsWith('samples/')) {
        return "local-view/$path"
    }

    return "local-view/root/$path"
}

function Get-Category {
    param([string]$RelativePath)

    $path = Convert-ToNavPath $RelativePath

    switch -Regex ($path) {
        '^docs/index\.md$' {
            return 'Home'
        }
        '^(README|CHANGELOG|CONTRIBUTING|DEVELOPMENT|SECURITY|CODE_OF_CONDUCT|AGENTS|CLAUDE)\.md$' {
            return 'Overview'
        }
        '^docs/(README|APP_LAUNCH_GUIDE|EDITOR_HELP|PROJECT_OVERVIEW|VISUAL_EVIDENCE_INDEX|TURN_PLAN)\.md$' {
            return 'Overview'
        }
        '^docs/specs/' {
            return 'Specs'
        }
        '^docs/(APP_SPECIFICATION|ARCHITECTURE|UI_SURFACE_AND_CONTROLS|WRITING_PIPELINE|VISUAL_PROFILE|THEMES|GADGETS|EDITOR_EXTENSIONS|EMBED_SDK|REFACTORING_SAFETY_CHAPTER_STORAGE|WP004_PHASE3_PARITY_AUDIT|spec-context-toolbar|spec-editor-rebuild)\.md$' {
            return 'Specs'
        }
        '^docs/(CURRENT_STATE|INVARIANTS|INTERACTION_NOTES|USER_REQUEST_LEDGER|ROADMAP|FEATURE_REGISTRY|OPERATOR_WORKFLOW|EDITOR_TRUST_WORKFLOW|AUTOMATION_BOUNDARY)\.md$' {
            return 'Runtime State'
        }
        '^docs/ai/' {
            return 'Runtime State'
        }
        '^docs/(CODING_STANDARDS|TESTING|TROUBLESHOOTING|PLUGIN_GUIDE|BRANCHING|RELEASE|DEPLOY|MANUAL_TEST_GUIDE|LABELS|project-context)\.md$' {
            return 'Development Notes'
        }
        '^docs/design/' {
            return 'Development Notes'
        }
        '^docs/verification/' {
            return 'Artifacts'
        }
        '^docs/archive/' {
            return 'Artifacts'
        }
        '^samples/' {
            return 'Artifacts'
        }
        default {
            return 'Misc'
        }
    }
}

function Quote-YamlScalar {
    param([string]$Value)
    return "'" + ($Value -replace "'", "''") + "'"
}

$files = Get-ChildItem -LiteralPath $Root -Filter '*.md' -File -Recurse -Force |
    ForEach-Object {
        $relative = Get-RelativePath -BasePath $Root -TargetPath $_.FullName
        $relative = Convert-ToNavPath $relative
        if (-not (Test-ExcludedPath $relative)) {
            [PSCustomObject]@{
                Path = $relative
                SitePath = Get-SitePath $relative
                Label = Get-NavLabel $relative
                Category = Get-Category $relative
            }
        }
    } |
    Sort-Object Category, Path

$groups = [ordered]@{
    'Overview' = @()
    'Specs' = @()
    'Runtime State' = @()
    'Development Notes' = @()
    'Artifacts' = @()
    'Misc' = @()
}

foreach ($file in $files) {
    if ($file.Category -eq 'Home') {
        continue
    }

    $groups[$file.Category] += $file
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('nav:')

if ($files.SitePath -contains 'index.md') {
    $lines.Add('  - Home: index.md')
}

foreach ($category in $groups.Keys) {
    if ($groups[$category].Count -eq 0) {
        continue
    }

    $lines.Add("  - ${category}:")
    foreach ($file in $groups[$category]) {
        $lines.Add("      - $(Quote-YamlScalar $file.Label): $($file.SitePath)")
    }
}

$result = $lines -join [Environment]::NewLine

if ($OutFile) {
    Set-Content -LiteralPath $OutFile -Value $result -Encoding utf8
} else {
    $result
}
