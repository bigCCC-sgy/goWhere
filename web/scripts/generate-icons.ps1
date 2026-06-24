Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-PinPath {
  param([float]$Scale)

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.StartFigure()
  $path.AddBezier(
    512 * $Scale, 812 * $Scale,
    356 * $Scale, 666 * $Scale,
    293 * $Scale, 540 * $Scale,
    293 * $Scale, 427 * $Scale
  )
  $path.AddBezier(
    293 * $Scale, 427 * $Scale,
    293 * $Scale, 306 * $Scale,
    391 * $Scale, 210 * $Scale,
    512 * $Scale, 210 * $Scale
  )
  $path.AddBezier(
    512 * $Scale, 210 * $Scale,
    633 * $Scale, 210 * $Scale,
    731 * $Scale, 306 * $Scale,
    731 * $Scale, 427 * $Scale
  )
  $path.AddBezier(
    731 * $Scale, 427 * $Scale,
    731 * $Scale, 540 * $Scale,
    668 * $Scale, 666 * $Scale,
    512 * $Scale, 812 * $Scale
  )
  $path.CloseFigure()
  return $path
}

function Save-AppIcon {
  param(
    [string]$Path,
    [int]$Size,
    [bool]$Maskable = $false
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $scale = $Size / 1024
  $radius = if ($Maskable) { 180 * $scale } else { 232 * $scale }
  $bgRect = [System.Drawing.RectangleF]::new(0, 0, $Size, $Size)
  $bgPath = New-RoundedRectPath 0 0 $Size $Size $radius
  $bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $bgRect,
    [System.Drawing.Color]::FromArgb(255, 255, 253, 249),
    [System.Drawing.Color]::FromArgb(255, 234, 221, 208),
    135
  )
  $graphics.FillPath($bgBrush, $bgPath)

  $routePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 185, 169, 155), 42 * $scale)
  $routePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $routePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $routePath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $routePath.AddBezier(222 * $scale, 654 * $scale, 305 * $scale, 582 * $scale, 396 * $scale, 596 * $scale, 468 * $scale, 644 * $scale)
  $routePath.AddBezier(468 * $scale, 644 * $scale, 554 * $scale, 702 * $scale, 638 * $scale, 711 * $scale, 790 * $scale, 591 * $scale)
  $graphics.DrawPath($routePen, $routePath)

  $routeHighlight = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(230, 255, 248, 239), 20 * $scale)
  $routeHighlight.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $routeHighlight.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawPath($routeHighlight, $routePath)

  $endpointPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 217, 74, 74), 20 * $scale)
  $endpointBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 253, 249))
  foreach ($point in @(@(224, 654), @(790, 591))) {
    $cx = $point[0] * $scale
    $cy = $point[1] * $scale
    $r = 42 * $scale
    $graphics.FillEllipse($endpointBrush, $cx - $r, $cy - $r, $r * 2, $r * 2)
    $graphics.DrawEllipse($endpointPen, $cx - $r, $cy - $r, $r * 2, $r * 2)
  }

  $pinPath = New-PinPath $scale
  $pinBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.RectangleF]::new(293 * $scale, 210 * $scale, 438 * $scale, 602 * $scale),
    [System.Drawing.Color]::FromArgb(255, 243, 106, 112),
    [System.Drawing.Color]::FromArgb(255, 185, 50, 53),
    90
  )
  $graphics.FillPath($pinBrush, $pinPath)

  $centerBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 248, 239))
  $centerR = 82 * $scale
  $graphics.FillEllipse($centerBrush, (512 * $scale) - $centerR, (421 * $scale) - $centerR, $centerR * 2, $centerR * 2)

  $innerBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 217, 74, 74))
  $innerR = 39 * $scale
  $graphics.FillEllipse($innerBrush, (512 * $scale) - $innerR, (421 * $scale) - $innerR, $innerR * 2, $innerR * 2)

  $format = [System.Drawing.Imaging.ImageFormat]::Png
  $bitmap.Save($Path, $format)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$icons = Join-Path $root "public\icons"
New-Item -ItemType Directory -Force -Path $icons | Out-Null

Save-AppIcon -Path (Join-Path $icons "icon-192.png") -Size 192
Save-AppIcon -Path (Join-Path $icons "icon-512.png") -Size 512
Save-AppIcon -Path (Join-Path $icons "icon-maskable-512.png") -Size 512 -Maskable $true
Save-AppIcon -Path (Join-Path $root "public\apple-touch-icon.png") -Size 180
Save-AppIcon -Path (Join-Path $icons "favicon-32.png") -Size 32

$faviconPng = Join-Path $icons "favicon-32.png"
$faviconIco = Join-Path $root "src\app\favicon.ico"
$faviconBitmap = [System.Drawing.Bitmap]::FromFile($faviconPng)
$faviconHandle = $faviconBitmap.GetHicon()
$faviconIcon = [System.Drawing.Icon]::FromHandle($faviconHandle)
$faviconStream = [System.IO.File]::Create($faviconIco)
$faviconIcon.Save($faviconStream)
$faviconStream.Close()
$faviconIcon.Dispose()
$faviconBitmap.Dispose()
