# Build shipped assets: mirror art/ → apps/client/public/assets/
#
# Pipeline per source:
#   1) orphan cleanup: smaže soubory v public/assets/, které už nemají zdroj v art/
#   2) pro každé art/<kat>/<name>.png zavolá scripts/downscale-asset.ps1
#      s chroma key #ff00ff (projektová konvence — magenta je vždy průhledná)
#   3) výstup do apps/client/public/assets/<kat>/<name>.png
#
# Přeskakuje:
#   - _*.png         (soubory začínající podtržítkem = pracovní templates / scratch)
#   - reference/**    (moodboard, palette, img2img refs)
#   - cokoli ne-.png
#
# Použití:
#   powershell -ExecutionPolicy Bypass -File scripts/build-assets.ps1

$ErrorActionPreference = 'Stop'

# Kořeny — relativní k repo rootu. Script předpokládá spuštění z root dir.
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$srcRoot  = Join-Path $repoRoot 'art'
$dstRoot  = Join-Path $repoRoot 'apps\client\public\assets'
$keyScript = Join-Path $PSScriptRoot 'downscale-asset.ps1'

Write-Host "art  : $srcRoot"
Write-Host "ship : $dstRoot"
Write-Host ""

# --- 1) Najdi zdroje -------------------------------------------------------
# Všechny .png v art/ mimo reference/ a empty.png templates.
$sources = Get-ChildItem -Path $srcRoot -Recurse -Filter '*.png' |
  Where-Object { $_.FullName -notmatch '\\reference\\' } |
  Where-Object { -not $_.Name.StartsWith('_') }

# Map source path → expected dest path (zrcadlí strukturu od kořenů).
$expectedDests = @{}
foreach ($src in $sources) {
  $rel = $src.FullName.Substring($srcRoot.Length).TrimStart('\')
  $dst = Join-Path $dstRoot $rel
  $expectedDests[$dst] = $src.FullName
}

# --- 2) Orphan cleanup -----------------------------------------------------
# Smaž soubory v public/assets/, ke kterým neexistuje odpovídající source v art/.
$existingShipped = Get-ChildItem -Path $dstRoot -Recurse -Filter '*.png' -ErrorAction SilentlyContinue
$orphanCount = 0
foreach ($s in $existingShipped) {
  if (-not $expectedDests.ContainsKey($s.FullName)) {
    Write-Host "orphan: $($s.FullName)" -ForegroundColor Yellow
    Remove-Item $s.FullName
    $orphanCount++
  }
}
if ($orphanCount -gt 0) {
  Write-Host "removed $orphanCount orphan(s)" -ForegroundColor Yellow
  Write-Host ""
}

# --- 3) Build každý source -------------------------------------------------
$builtCount = 0
foreach ($src in $sources) {
  $rel = $src.FullName.Substring($srcRoot.Length).TrimStart('\')
  $dst = Join-Path $dstRoot $rel

  # Zajisti existenci cílového adresáře.
  $dstDir = Split-Path $dst -Parent
  if (-not (Test-Path $dstDir)) {
    New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
  }

  Write-Host "build: $rel"
  & powershell -ExecutionPolicy Bypass -File $keyScript -SrcPath $src.FullName -DstPath $dst -ChromaKey '#ff00ff'
  $builtCount++
}

Write-Host ""
Write-Host "done: $builtCount built, $orphanCount orphan(s) removed" -ForegroundColor Green
