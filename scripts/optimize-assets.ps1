$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { $PWD.Path }
$portraitSource = [System.Drawing.Image]::FromFile((Join-Path $projectRoot 'profile.png'))
$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$jpegParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$jpegParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)
try {
    foreach ($portraitWidth in @(480, 800)) {
        $portraitHeight = [int][Math]::Round($portraitSource.Height * $portraitWidth / $portraitSource.Width)
        $portraitBitmap = New-Object System.Drawing.Bitmap($portraitWidth, $portraitHeight)
        $portraitGraphics = [System.Drawing.Graphics]::FromImage($portraitBitmap)
        try {
            $portraitGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $portraitGraphics.DrawImage($portraitSource, 0, 0, $portraitWidth, $portraitHeight)
            $portraitBitmap.Save((Join-Path $projectRoot "profile-$portraitWidth.jpg"), $jpegEncoder, $jpegParameters)
        } finally { $portraitGraphics.Dispose(); $portraitBitmap.Dispose() }
    }
    # A deterministic social card using the original portrait and live text.
    $socialBitmap = New-Object System.Drawing.Bitmap(1200, 630)
    $socialGraphics = [System.Drawing.Graphics]::FromImage($socialBitmap)
    $socialResources = New-Object System.Collections.Generic.List[System.IDisposable]
    try {
        $socialGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $socialGraphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $socialGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $socialGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0b1117'))
        $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#7de3d3'))
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#edf2f2'))
        $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#a3b2bc'))
        $smallFont = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
        $nameFont = New-Object System.Drawing.Font('Segoe UI', 53, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $roleFont = New-Object System.Drawing.Font('Segoe UI', 26, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
        $bodyFont = New-Object System.Drawing.Font('Segoe UI', 23, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
        @($accentBrush, $textBrush, $mutedBrush, $smallFont, $nameFont, $roleFont, $bodyFont) | ForEach-Object { $socialResources.Add($_) }
        $socialGraphics.FillRectangle($accentBrush, 64, 64, 48, 4)
        $socialGraphics.DrawString('SUSHANTKULKARNI.ME', $smallFont, $accentBrush, 64, 94)
        $socialGraphics.DrawString('Sushant', $nameFont, $textBrush, 59, 160)
        $socialGraphics.DrawString('Kulkarni', $nameFont, $textBrush, 59, 222)
        $socialGraphics.DrawString('AI Engineer & Backend Developer', $roleFont, $accentBrush, 64, 322)
        $socialGraphics.DrawString("Production AI. Real-time systems.`nScalable APIs.", $bodyFont, $mutedBrush, 64, 385)
        $socialGraphics.DrawString('PUNE, INDIA', $smallFont, $mutedBrush, 64, 535)
        $socialGraphics.DrawImage($portraitSource, 796, 64, 340, 511)
        $socialBitmap.Save((Join-Path $projectRoot 'social-preview.jpg'), $jpegEncoder, $jpegParameters)
    } finally {
        foreach ($socialResource in $socialResources) { $socialResource.Dispose() }
        $socialGraphics.Dispose()
        $socialBitmap.Dispose()
    }
} finally { $portraitSource.Dispose(); $jpegParameters.Dispose() }
Get-Item (Join-Path $projectRoot 'profile-480.jpg'), (Join-Path $projectRoot 'profile-800.jpg'), (Join-Path $projectRoot 'social-preview.jpg') | Select-Object Name, Length
