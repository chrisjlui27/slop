<#
  Checks sw.js's SHELL list against what is actually on disk, in both
  directions.

  This exists because the failure it catches is silent. The install handler
  deliberately swallows per-entry failures — addAll would otherwise throw the
  whole cache away over one 404 — so a module that gets renamed or added
  without updating SHELL produces a service worker that installs cleanly,
  reports success, and then cannot open the game offline. Nothing surfaces
  until a phone loses signal.

      powershell -ExecutionPolicy Bypass -File tools/check-shell.ps1

  Exits non-zero on any mismatch so it can gate a deploy.
#>
param([string]$Root = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = 'Stop'
$rootFull = (Resolve-Path $Root).Path
$swPath = Join-Path $rootFull 'sw.js'

if (-not (Test-Path $swPath)) { Write-Error "sw.js not found at $swPath"; exit 1 }

$sw = Get-Content $swPath -Raw

if ($sw -notmatch '(?s)const SHELL = \[(.*?)\];') {
  Write-Error 'Could not find the SHELL array in sw.js.'
  exit 1
}
$shell = $matches[1] -split ',' |
  ForEach-Object { $_.Trim() -replace "^['`"]|['`"]$", '' } |
  Where-Object { $_ -and $_ -notmatch '^\s*//' }

# '.' is the start_url and has no file of its own.
$declared = $shell | Where-Object { $_ -ne '.' }

$problems = @()

foreach ($rel in $declared) {
  $p = Join-Path $rootFull ($rel -replace '/', '\')
  if (-not (Test-Path $p -PathType Leaf)) { $problems += "MISSING ON DISK: $rel" }
}

# The other direction: anything the browser will actually request at runtime
# but that no one added to SHELL.
$onDisk = @()
$onDisk += Get-ChildItem -Path $rootFull -Filter '*.js' -File |
  Where-Object { $_.Name -ne 'sw.js' } | ForEach-Object { $_.Name }
foreach ($dir in @('src', 'styles')) {
  $d = Join-Path $rootFull $dir
  if (Test-Path $d) {
    $onDisk += Get-ChildItem -Path $d -Recurse -File -Include '*.js', '*.css' |
      ForEach-Object { $_.FullName.Substring($rootFull.Length + 1) -replace '\\', '/' }
  }
}

foreach ($rel in $onDisk) {
  if ($declared -notcontains $rel) { $problems += "NOT IN SHELL: $rel" }
}

if ($problems.Count) {
  Write-Host "sw.js SHELL is out of sync ($($problems.Count) problem(s)):" -ForegroundColor Red
  $problems | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  Write-Host ''
  Write-Host 'Fix SHELL in sw.js, then bump CACHE so phones pick the change up.'
  exit 1
}

Write-Host "sw.js SHELL is in sync: $($declared.Count) files, all present." -ForegroundColor Green
exit 0
