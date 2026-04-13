# Recolor PNG na Voidspan 16 paletu (Hull & Amber).
# Každý ne-transparentní pixel se snapne na nejbližší paletu (RGB Euklid).
# Alpha kanál zůstává (transparentní pixely zůstávají průhledné).
#
# Použití:
#   powershell -File scripts/recolor-to-palette.ps1 -SrcPath <src.png> -DstPath <dst.png>
#
# Výstup na stdout: audit — per-color count + max distance před snapem.

param(
  [Parameter(Mandatory=$true)] [string]$SrcPath,
  [Parameter(Mandatory=$true)] [string]$DstPath
)

Add-Type -AssemblyName System.Drawing

# Voidspan 16 — hex hodnoty z style-guide (AXIOM).
$PALETTE_HEX = @(
  '#0a0a10','#1a1e28','#2e3440','#4c5462','#6a7080','#8a8e98','#c0c4cc', # world 01-07
  '#ff4848','#ff8020','#ffc030','#60c060','#4088c8',                     # status 08-12
  '#080808','#b08030','#ffd060','#ffffff'                                # ui 13-16
)

# Parsuj paletu na pole triplet {R,G,B}.
$palette = @()
foreach ($hex in $PALETTE_HEX) {
  $h = $hex.TrimStart('#')
  $palette += ,@(
    [Convert]::ToInt32($h.Substring(0,2), 16),
    [Convert]::ToInt32($h.Substring(2,2), 16),
    [Convert]::ToInt32($h.Substring(4,2), 16)
  )
}

# Načti do paměti (byte[]) a zruš file handle — jinak Save(src) selže na GDI+ lock.
$bytes = [System.IO.File]::ReadAllBytes($SrcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$img = [System.Drawing.Image]::FromStream($ms)
$W = $img.Width
$H = $img.Height

# Kopie do 32bppArgb pro LockBits přístup.
$bmp = New-Object System.Drawing.Bitmap -ArgumentList $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gInit = [System.Drawing.Graphics]::FromImage($bmp)
$gInit.DrawImage($img, 0, 0, $W, $H)
$gInit.Dispose()
$img.Dispose()
$ms.Dispose()

$rect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytesTotal = $stride * $H
$buf = New-Object byte[] $bytesTotal
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $bytesTotal)

# Audit counters — kolik pixelů dostalo kterou paletu, a max delta.
$counts = New-Object int[] $palette.Count
$maxDist = 0.0
$touchedPixels = 0

# Format32bppArgb v paměti: BGRA (little-endian). Pořadí: B, G, R, A.
for ($y = 0; $y -lt $H; $y++) {
  $row = $y * $stride
  for ($x = 0; $x -lt $W; $x++) {
    $i = $row + $x * 4
    $a = $buf[$i+3]
    if ($a -eq 0) { continue } # plně průhledný — nesahat

    $b = $buf[$i]
    $g = $buf[$i+1]
    $r = $buf[$i+2]

    # Najdi nejbližší paletovou barvu.
    $bestIdx = 0
    $bestD2 = [double]::MaxValue
    for ($p = 0; $p -lt $palette.Count; $p++) {
      $pr = $palette[$p][0]
      $pg = $palette[$p][1]
      $pb = $palette[$p][2]
      $dr = $r - $pr; $dg = $g - $pg; $db = $b - $pb
      $d2 = $dr*$dr + $dg*$dg + $db*$db
      if ($d2 -lt $bestD2) {
        $bestD2 = $d2
        $bestIdx = $p
      }
    }

    # Zapiš nejbližší barvu.
    $buf[$i]   = [byte]$palette[$bestIdx][2] # B
    $buf[$i+1] = [byte]$palette[$bestIdx][1] # G
    $buf[$i+2] = [byte]$palette[$bestIdx][0] # R
    # alpha zůstává

    $counts[$bestIdx]++
    $touchedPixels++
    $dist = [Math]::Sqrt($bestD2)
    if ($dist -gt $maxDist) { $maxDist = $dist }
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $bytesTotal)
$bmp.UnlockBits($data)

# Uložit výstup.
$bmp.Save($DstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# --- Audit report ---
Write-Host ""
Write-Host "=== Recolor audit: $SrcPath ==="
Write-Host ("touched pixels: {0} / {1} ({2:N0}%)" -f $touchedPixels, ($W*$H), (100 * $touchedPixels / ($W*$H)))
Write-Host ("max distance before snap: {0:N1} (0 = exact match; >30 = významný shift)" -f $maxDist)
Write-Host ""
Write-Host "per-color count:"
for ($p = 0; $p -lt $palette.Count; $p++) {
  if ($counts[$p] -gt 0) {
    Write-Host ("  {0}  {1,5}  ({2})" -f $PALETTE_HEX[$p].PadRight(8), $counts[$p], $counts[$p])
  }
}
Write-Host ""
Write-Host "OK -> $DstPath"
