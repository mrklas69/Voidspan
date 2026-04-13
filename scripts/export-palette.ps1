# Export Voidspan 16 palety do dvou formátů:
#   art/_palette.png  — 16×1 px swatch (vizuální reference, axiom)
#   art/_palette.txt  — Paint.NET palette format (load přes Window → Colors → More → Palette)
#
# Paint.NET .txt formát: řádky AARRGGBB (uppercase). Komentáře přes ';'. Max 96 barev.

Add-Type -AssemblyName System.Drawing

$PALETTE_HEX = @(
  '#0a0a10','#1a1e28','#2e3440','#4c5462','#6a7080','#8a8e98','#c0c4cc', # world 01-07
  '#ff4848','#ff8020','#ffc030','#60c060','#4088c8',                     # status 08-12
  '#080808','#b08030','#ffd060','#ffffff'                                # ui 13-16
)
$ROLES = @(
  'void-black','hull-dark','hull-mid','hull-light','metal-gray','metal-light','bright-metal',
  'alert-red','warn-orange','warn-amber','ok-green','info-blue',
  'bg-near-black','amber-dim','amber-bright','text-white'
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$artDir = Join-Path (Split-Path -Parent $scriptDir) 'art'
$pngPath = Join-Path $artDir '_palette.png'
$txtPath = Join-Path $artDir '_palette.txt'

# --- PNG: 16×1 swatch ---
$bmp = New-Object System.Drawing.Bitmap -ArgumentList 16, 1, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($i = 0; $i -lt $PALETTE_HEX.Count; $i++) {
  $h = $PALETTE_HEX[$i].TrimStart('#')
  $r = [Convert]::ToInt32($h.Substring(0,2), 16)
  $g = [Convert]::ToInt32($h.Substring(2,2), 16)
  $b = [Convert]::ToInt32($h.Substring(4,2), 16)
  $c = [System.Drawing.Color]::FromArgb(255, $r, $g, $b)
  $bmp.SetPixel($i, 0, $c)
}
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "PNG -> $pngPath (16x1)"

# --- TXT: Paint.NET palette ---
$lines = @(
  '; Voidspan 16 - Hull & Amber',
  '; Axiom palette. Load in Paint.NET: Window -> Colors -> More -> Palette menu -> Open',
  '; Format: AARRGGBB (uppercase)',
  ''
)
for ($i = 0; $i -lt $PALETTE_HEX.Count; $i++) {
  $hex = $PALETTE_HEX[$i].TrimStart('#').ToUpper()
  $role = $ROLES[$i]
  $idx  = ('{0:D2}' -f ($i + 1))
  $lines += ('FF{0}   ; {1} {2}' -f $hex, $idx, $role)
}
[System.IO.File]::WriteAllLines($txtPath, $lines)
Write-Host "TXT -> $txtPath (Paint.NET format, 16 colors + header)"
