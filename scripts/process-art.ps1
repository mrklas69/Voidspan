# Zpracuje AI-generovaný sprite sheet: recolor na paletu + magenta chroma-key.
#
# Pipeline:
#   1. key-transparency:   FF00FF → alpha 0 (pozadí pryč)
#   2. recolor-to-palette: snap ne-transparentních pixelů na Voidspan 16
#
# Pořadí je klíčové — recolor neumí rozpoznat magenta, snapnul by FF00FF na
# nejbližší paletu (typicky alert-red #ff4848) a key by neměl co keyovat.
# Proto: key nejdřív (magenta → alpha), recolor potom (transparent pixely
# přeskočí, viz recolor-to-palette.ps1).
#
# Použití:
#   powershell -File scripts/process-art.ps1 -SrcPath <in.png> [-DstPath <out.png>]
#   pnpm process:art -- -SrcPath <in.png>
#
# Pokud DstPath není zadán, výstup jde do stejné složky s příponou `_clean.png`.

param(
  [Parameter(Mandatory=$true)] [string]$SrcPath,
  [string]$DstPath = "",
  [int]$Tolerance = 40,
  [int]$KeyR = 255,
  [int]$KeyG = 0,
  [int]$KeyB = 255
)

if (-not (Test-Path $SrcPath)) {
  Write-Error "Source file not found: $SrcPath"
  exit 1
}

# Default DstPath: same dir + _clean suffix
if ([string]::IsNullOrEmpty($DstPath)) {
  $dir = Split-Path -Parent $SrcPath
  $name = [System.IO.Path]::GetFileNameWithoutExtension($SrcPath)
  $DstPath = Join-Path $dir ($name + "_clean.png")
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Dočasný mezisoubor — nejdřív recolor do tempu, pak key do finálního DstPath.
$tempPath = [System.IO.Path]::GetTempFileName() + ".png"

Write-Host "=== STEP 1/2: Chroma-key (RGB ${KeyR},${KeyG},${KeyB} +-${Tolerance} -> alpha 0) ==="
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scriptDir "key-transparency.ps1") -SrcPath $SrcPath -DstPath $tempPath -Tolerance $Tolerance -KeyR $KeyR -KeyG $KeyG -KeyB $KeyB
if ($LASTEXITCODE -ne 0) {
  Write-Error "Keying failed."
  Remove-Item $tempPath -ErrorAction SilentlyContinue
  exit 1
}

Write-Host ""
Write-Host "=== STEP 2/2: Recolor to Voidspan 16 palette ==="
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scriptDir "recolor-to-palette.ps1") -SrcPath $tempPath -DstPath $DstPath
if ($LASTEXITCODE -ne 0) {
  Write-Error "Recolor failed."
  Remove-Item $tempPath -ErrorAction SilentlyContinue
  exit 1
}

Remove-Item $tempPath -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "=== DONE: $DstPath ==="
