# MediaMTX setup for RTSP and HLS simulation
# Download MediaMTX (formerly rtsp-simple-server) from: https://github.com/bluenviron/mediamtx/releases
# Extract and place `mediamtx.exe` in this scripts folder or add to PATH.

Write-Host "Please ensure mediamtx.exe is downloaded and running."
Write-Host "Download from: https://github.com/bluenviron/mediamtx/releases"
Write-Host "Once MediaMTX is running on its default ports (RTSP 8554, HLS 8888), use FFmpeg to loop a test video."
Write-Host ""
Write-Host "Example FFmpeg command to stream a file continuously to MediaMTX:"
Write-Host "ffmpeg -re -stream_loop -1 -i ../footage/A1_daytime_pedestrians.mp4 -c copy -f rtsp rtsp://localhost:8554/cam1"
Write-Host ""
Write-Host "Backend can read from: rtsp://localhost:8554/cam1"
Write-Host "Frontend can play HLS from: http://localhost:8888/cam1"
