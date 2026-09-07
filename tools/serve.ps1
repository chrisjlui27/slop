<#
  A dependency-free static server, for developing SLOP on a machine with
  neither Node nor Python.

  `npm run dev` shells out to `python3 -m http.server`, which is fine on the
  machine it was written on and unavailable on this one. ES modules will not
  load over file:// — the browser blocks the cross-origin request — so some
  server has to exist before the game can be opened at all. HttpListener ships
  with .NET, so this needs nothing installed.

  localhost also counts as a secure context, which means the service worker
  registers here exactly as it will on GitHub Pages. That makes this the only
  place the offline path can be tested before deploying.

      powershell -ExecutionPolicy Bypass -File tools/serve.ps1 [-Port 8000]
#>
param(
  [int]$Port = 8000,
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'

# Modules are rejected outright if the JS arrives as text/plain, and the
# manifest is ignored without its own type, so this map is load-bearing rather
# than cosmetic.
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff2'= 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "SLOP dev server: http://localhost:$Port/  (root: $Root)"
Write-Host "Ctrl+C to stop."

$rootFull = (Resolve-Path $Root).Path

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    try {
      $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
      $path = Join-Path $rootFull ($rel -replace '/', '\')

      # Refuse anything that escapes the project root. A dev server still gets
      # ../../ probes from anything else running on the machine.
      $full = [System.IO.Path]::GetFullPath($path)
      if (-not $full.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
        $res.StatusCode = 403; $res.Close(); continue
      }

      if ((Test-Path $full -PathType Container)) { $full = Join-Path $full 'index.html' }

      if (-not (Test-Path $full -PathType Leaf)) {
        $res.StatusCode = 404
        $body = [System.Text.Encoding]::UTF8.GetBytes("404 $rel")
        $res.OutputStream.Write($body, 0, $body.Length)
        $res.Close()
        Write-Host "404 $rel"
        continue
      }

      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      # No-store keeps an edited module from being served out of the browser
      # cache; the service worker's own cache is still exercised normally.
      $res.Headers.Add('Cache-Control', 'no-store')

      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.Close()
      Write-Host "200 $rel"
    }
    catch {
      Write-Host "500 $($_.Exception.Message)"
      try { $res.StatusCode = 500; $res.Close() } catch {}
    }
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
