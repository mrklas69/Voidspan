# Chroma key + bbox crop + downscale assetu na 40×40.
#
# Pipeline:
#   1) Chroma key: pixely blízko -ChromaKey barvě → alpha 0 (smooth edge přes tolerance)
#   2) Bbox: najdi bounding box netransparentního obsahu
#   3) Downscale: crop podle bbox, vykresli do 36×36 centrálního čtverce (2px margin)
#
# Použití:
#   powershell -File scripts/downscale-asset.ps1 -SrcPath <src.png> -DstPath <dst.png>
#   powershell -File scripts/downscale-asset.ps1 -SrcPath <src> -DstPath <dst> -ChromaKey '#ffff00'
#
# Parametry chroma keyingu (Euklidovská vzdálenost v RGB 0..441):
#   -HardThreshold   pixely s dist < hard → alpha 0 (default 40)
#   -SoftThreshold   pixely hard..soft → alpha lineárně (default 100); smooth edge po downscale

param(
  [Parameter(Mandatory=$true)] [string]$SrcPath,
  [Parameter(Mandatory=$true)] [string]$DstPath,
  [string]$ChromaKey = '',        # prázdné = žádný keying (jen bbox+downscale)
  [int]$HardThreshold = 40,
  [int]$SoftThreshold = 100
)

Add-Type -AssemblyName System.Drawing

# --- Parsuj hex barvu na R,G,B ---
function Parse-Hex([string]$hex) {
  $h = $hex.TrimStart('#')
  return @(
    [Convert]::ToInt32($h.Substring(0,2), 16),
    [Convert]::ToInt32($h.Substring(2,2), 16),
    [Convert]::ToInt32($h.Substring(4,2), 16)
  )
}

$img = [System.Drawing.Image]::FromFile($SrcPath)
$W = $img.Width
$H = $img.Height

# Kopie do Bitmap s alpha kanálem, ať můžeme přepsat pixely.
$bmp = New-Object System.Drawing.Bitmap -ArgumentList $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gInit = [System.Drawing.Graphics]::FromImage($bmp)
$gInit.DrawImage($img, 0, 0, $W, $H)
$gInit.Dispose()

# --- 1) Chroma key (pokud zadán) -------------------------------------------
# Optimalizace přes LockBits — GetPixel/SetPixel na 4M pixelů trvá minuty.
# LockBits dá raw byte array ve formátu BGRA, zpracujeme v paměti, zapíšeme zpět.
if ($ChromaKey -ne '') {
  $key = Parse-Hex $ChromaKey
  $keyR = $key[0]; $keyG = $key[1]; $keyB = $key[2]
  Write-Host "chroma key: R=$keyR G=$keyG B=$keyB  hard<$HardThreshold  soft<$SoftThreshold"

  $rect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $data.Stride
  $bytesTotal = $stride * $H
  $buf = New-Object byte[] $bytesTotal
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $bytesTotal)

  # Format32bppArgb v paměti: BGRA (little-endian). Pořadí: B, G, R, A.
  $softMinusHard = [double]($SoftThreshold - $HardThreshold)
  for ($y = 0; $y -lt $H; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $W; $x++) {
      $i = $row + $x * 4
      $b = $buf[$i]
      $g = $buf[$i+1]
      $r = $buf[$i+2]
      # Euklidovská vzdálenost od key barvy v RGB.
      $dr = $r - $keyR
      $dg = $g - $keyG
      $db = $b - $keyB
      $dist = [Math]::Sqrt($dr*$dr + $dg*$dg + $db*$db)
      if ($dist -lt $HardThreshold) {
        $buf[$i+3] = 0
      } elseif ($dist -lt $SoftThreshold) {
        # Lineární ramp: hard→0, soft→plná alpha.
        $t = ($dist - $HardThreshold) / $softMinusHard
        $origA = $buf[$i+3]
        $buf[$i+3] = [byte]([Math]::Round($origA * $t))
      }
      # dist >= soft → alpha zůstává původní (plná).
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $bytesTotal)
  $bmp.UnlockBits($data)
}

# --- 2) Bbox netransparentního obsahu --------------------------------------
# Pro velké obrázky bychom znovu použili LockBits — ale po keyingu už víme,
# že většina pozadí je alpha=0. GetPixel tady je jednorázový a 4M pixelů zvládne.
# KISS: necháme jednoduchou smyčku, na 2048×2048 cca 20 s.
$minX = $W; $minY = $H; $maxX = -1; $maxY = -1
for ($y = 0; $y -lt $H; $y++) {
  for ($x = 0; $x -lt $W; $x++) {
    $a = $bmp.GetPixel($x, $y).A
    if ($a -gt 10) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}

if ($maxX -lt 0) {
  Write-Host "ERROR: po keyingu žádný obsah (všechno transparentní). Uprav thresholdy nebo ChromaKey."
  exit 1
}

$cw = $maxX - $minX + 1
$ch = $maxY - $minY + 1
Write-Host "bbox: $minX,$minY - $maxX,$maxY  (obsah ${cw}x${ch}, src ${W}x${H})"

# --- 3) Render do 40×40 ----------------------------------------------------
# Dvě větve:
#   a) obsah už sedí do 40×40 → 1:1 copy, centrováno (zdroj nativní, nechceme ztratit detail)
#   b) obsah větší než 40×40 → downscale do 36×36 (2px margin) bicubic
$out = New-Object System.Drawing.Bitmap -ArgumentList 40, 40, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$srcRect = New-Object System.Drawing.Rectangle $minX, $minY, $cw, $ch
if ($cw -le 40 -and $ch -le 40) {
  # 1:1 copy, centrováno do 40×40.
  $offX = [int]((40 - $cw) / 2)
  $offY = [int]((40 - $ch) / 2)
  $dstRect = New-Object System.Drawing.Rectangle $offX, $offY, $cw, $ch
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  Write-Host "mode: 1:1 copy (source fits), centered offset ${offX},${offY}"
} else {
  # Downscale do 36×36 s 2px marginem.
  $dstRect = New-Object System.Drawing.Rectangle 2, 2, 36, 36
  Write-Host "mode: downscale ${cw}x${ch} -> 36x36"
}
$g.DrawImage($bmp, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$out.Save($DstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $out.Dispose(); $bmp.Dispose(); $img.Dispose()

Write-Host "OK -> $DstPath"
