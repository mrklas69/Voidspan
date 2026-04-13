# Magenta keying — FF00FF → alpha 0.
# Paint.NET workflow: kreslíš s magenta "průhledným" pozadím, pak tenhle skript
# magentu vypustí na alpha=0 pro použití v Phaser/web.
#
# Použití:
#   powershell -File scripts/key-transparency.ps1 -SrcPath <in.png> -DstPath <out.png>

param(
  [Parameter(Mandatory=$true)] [string]$SrcPath,
  [Parameter(Mandatory=$true)] [string]$DstPath
)

Add-Type -AssemblyName System.Drawing

# Načti do paměti (byte[]) a zruš file handle — GDI+ by jinak zamkl src při Save.
$bytes = [System.IO.File]::ReadAllBytes($SrcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$img = [System.Drawing.Image]::FromStream($ms)
$W = $img.Width
$H = $img.Height

$out = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$keyed = 0
for ($y = 0; $y -lt $H; $y++) {
  for ($x = 0; $x -lt $W; $x++) {
    $p = ($img -as [System.Drawing.Bitmap]).GetPixel($x, $y)
    if ($p.R -eq 255 -and $p.G -eq 0 -and $p.B -eq 255) {
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

Write-Host "=== Magenta key: $SrcPath ==="
Write-Host "  ${W}x${H} = $($W*$H) pixels, keyed to alpha: $keyed"
Write-Host "OK -> $DstPath"
