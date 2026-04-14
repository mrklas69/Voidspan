# Chroma-key — pozadí určité barvy → alpha 0.
# Paint.NET workflow: kreslíš s pozadím v konkrétní "průhledné" barvě, pak tenhle
# skript tu barvu vypustí na alpha=0 pro použití v Phaser/web.
#
# Default: magenta #FF00FF (standardní chroma-key ve Voidspanu).
# Kdyby AI generátor nerespektoval magenta instrukci, lze přepnout na jinou
# barvu přes `-KeyR <R> -KeyG <G> -KeyB <B>` (např. alert-red pozadí: 255 0 0).
#
# AI generátory produkují chroma-key ne-přesně — antialiasing, JPG-style artefakty,
# gradient okraje. Proto tolerance: defaultně ±40 v každé složce. Vypne se
# `-Tolerance 0` pro strict match.
#
# Použití:
#   powershell -File scripts/key-transparency.ps1 -SrcPath <in.png> -DstPath <out.png>
#   powershell -File scripts/key-transparency.ps1 -SrcPath a.png -DstPath b.png -Tolerance 60
#   powershell -File scripts/key-transparency.ps1 -SrcPath a.png -DstPath b.png -KeyR 255 -KeyG 60 -KeyB 60

param(
  [Parameter(Mandatory=$true)] [string]$SrcPath,
  [Parameter(Mandatory=$true)] [string]$DstPath,
  [int]$Tolerance = 40,
  [int]$KeyR = 255,
  [int]$KeyG = 0,
  [int]$KeyB = 255
)

Add-Type -AssemblyName System.Drawing

# Načti do paměti (byte[]) a zruš file handle — GDI+ by jinak zamkl src při Save.
$bytes = [System.IO.File]::ReadAllBytes($SrcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$img = [System.Drawing.Image]::FromStream($ms)
$W = $img.Width
$H = $img.Height

# Match function: každá složka musí být v $Tolerance kolem target barvy.
# Používá per-komponent toleranci (box v RGB) — KISS, rychlé.
$rMin = [Math]::Max(0, $KeyR - $Tolerance)
$rMax = [Math]::Min(255, $KeyR + $Tolerance)
$gMin = [Math]::Max(0, $KeyG - $Tolerance)
$gMax = [Math]::Min(255, $KeyG + $Tolerance)
$bMin = [Math]::Max(0, $KeyB - $Tolerance)
$bMax = [Math]::Min(255, $KeyB + $Tolerance)

$out = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$keyed = 0
for ($y = 0; $y -lt $H; $y++) {
  for ($x = 0; $x -lt $W; $x++) {
    $p = ($img -as [System.Drawing.Bitmap]).GetPixel($x, $y)
    if ($p.R -ge $rMin -and $p.R -le $rMax -and $p.G -ge $gMin -and $p.G -le $gMax -and $p.B -ge $bMin -and $p.B -le $bMax) {
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      $keyed++
    } else {
      $out.SetPixel($x, $y, $p)
    }
  }
}

$out.Save($DstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$ms.Dispose()

Write-Host "=== Chroma key: $SrcPath (RGB target ${KeyR},${KeyG},${KeyB} ±${Tolerance}) ==="
Write-Host "  ${W}x${H} = $($W*$H) pixels, keyed to alpha: $keyed"
Write-Host "OK -> $DstPath"
