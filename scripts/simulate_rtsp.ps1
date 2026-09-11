# ============================================================
# IBVAP - MediaMTX RTSP Stream Simulator
# ============================================================
# This script loops your test footage as fake "live" CCTV feeds
# using MediaMTX + FFmpeg.
#
# PREREQUISITES:
#   1. Download MediaMTX from: https://github.com/bluenviron/mediamtx/releases
#      Extract mediamtx.exe into the scripts/ folder (or add to PATH).
#   2. Install FFmpeg: https://ffmpeg.org/download.html (add to PATH).
#
# USAGE:
#   Right-click this file > "Run with PowerShell"
#   Or from terminal: powershell -ExecutionPolicy Bypass -File .\simulate_rtsp.ps1
# ============================================================

$FOOTAGE_DIR = "..\footage"

# Camera Assignments (approved configuration)
$cameras = @(
    @{ Name = "cam1"; File = "B1.mp4";   Label = "Border Road Surveillance" },
    @{ Name = "cam2"; File = "E1.mp4";   Label = "Restricted Zone (Rooftop)" },
    @{ Name = "cam3"; File = "C2.mp4";   Label = "Campus Checkpoint" },
    @{ Name = "cam4"; File = "F2.mp4";  Label = "Night Perimeter" }
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IBVAP Stream Simulator - Starting Feeds"    -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start MediaMTX in the background
Write-Host "[1/2] Starting MediaMTX server..." -ForegroundColor Yellow
$mediamtx = Start-Process -FilePath "mediamtx.exe" -PassThru -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "  MediaMTX started (PID: $($mediamtx.Id))" -ForegroundColor Green
Write-Host ""

# Step 2: Start FFmpeg for each camera
Write-Host "[2/2] Starting camera streams..." -ForegroundColor Yellow
Write-Host ""

$ffmpegProcesses = @()

foreach ($cam in $cameras) {
    $videoPath = Join-Path $FOOTAGE_DIR $cam.File
    
    if (-Not (Test-Path $videoPath)) {
        Write-Host "  [SKIP] $($cam.Label): File not found - $videoPath" -ForegroundColor Red
        continue
    }
    
    # FFmpeg command: loop the video infinitely and push to MediaMTX RTSP
    # -stream_loop -1  = loop forever
    # -re              = read at native framerate (simulate real-time)
    # -an              = drop audio (prevents MediaMTX 400 Bad Request errors)
    $rtspUrl = "rtsp://localhost:8554/$($cam.Name)"
    
    $ffmpegArgs = "-stream_loop -1 -re -i `"$videoPath`" -an -c:v copy -f rtsp -rtsp_transport tcp `"$rtspUrl`""
    
    $proc = Start-Process -FilePath "ffmpeg" -ArgumentList $ffmpegArgs -PassThru -WindowStyle Minimized
    $ffmpegProcesses += $proc
    
    Write-Host "  [OK] $($cam.Label)" -ForegroundColor Green
    Write-Host "       File: $($cam.File)" -ForegroundColor DarkGray
    Write-Host "       RTSP: $rtspUrl" -ForegroundColor DarkGray
    Write-Host "       HLS:  http://localhost:8888/$($cam.Name)" -ForegroundColor DarkGray
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  All streams are LIVE!" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend connects to:  rtsp://localhost:8554/camX" -ForegroundColor White
Write-Host "  Frontend connects to: http://localhost:8888/camX" -ForegroundColor White
Write-Host ""
Write-Host "  Press Ctrl+C to stop all streams." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

# Keep the script alive until user presses Ctrl+C
try {
    while ($true) { Start-Sleep -Seconds 5 }
} finally {
    Write-Host ""
    Write-Host "Shutting down streams..." -ForegroundColor Yellow
    foreach ($proc in $ffmpegProcesses) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    Stop-Process -Id $mediamtx.Id -Force -ErrorAction SilentlyContinue
    Write-Host "All streams stopped." -ForegroundColor Green
}
