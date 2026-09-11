# ============================================================
# IBVAP - MediaMTX Launcher
# ============================================================
# The backend now handles the FFmpeg source streams directly.
# This script just launches the MediaMTX server.
# ============================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IBVAP MediaMTX Server Launcher"             -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Start MediaMTX
$MTX_EXE = Join-Path $PSScriptRoot "mediamtx.exe"
$mediamtx = Start-Process -FilePath $MTX_EXE -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Minimized
Write-Host "MediaMTX started (PID: $($mediamtx.Id))." -ForegroundColor Green
Write-Host "Keep this window open or press Ctrl+C to stop it." -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host "Shutting down MediaMTX..." -ForegroundColor Yellow
    if ($mediamtx) { Stop-Process -Id $mediamtx.Id -Force -ErrorAction SilentlyContinue }
}
