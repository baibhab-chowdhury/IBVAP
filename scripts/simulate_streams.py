import os
import time
import subprocess
from pathlib import Path

FOOTAGE_DIR = Path(__file__).parent.parent / "footage"
SCRIPTS_DIR = Path(__file__).parent.parent / "scripts"
MEDIAMTX_EXE = SCRIPTS_DIR / "mediamtx.exe"

print("============================================")
print("  IBVAP Robust 2-Camera Mode Simulator")
print("============================================")

if not MEDIAMTX_EXE.exists():
    print(f"ERROR: MediaMTX not found at {MEDIAMTX_EXE}")
    exit(1)

# Start MediaMTX
print("[1] Starting MediaMTX server...")
mtx_proc = subprocess.Popen([str(MEDIAMTX_EXE)], cwd=str(SCRIPTS_DIR), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3)

# Start Cam 2 (Subhodeep Loop)
cam2_vid = FOOTAGE_DIR / "C2.mp4"
print("[2] Starting Cam 2 loop (Subhodeep)...")
cam2_cmd = [
    "ffmpeg", "-stream_loop", "-1", "-re", "-i", str(cam2_vid),
    "-an", "-c:v", "copy", "-f", "rtsp", "-rtsp_transport", "tcp", "rtsp://localhost:8554/cam2"
]
cam2_proc = subprocess.Popen(cam2_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Generate a seamless playlist for Cam 1
videos = list(FOOTAGE_DIR.glob("*.mp4"))
playlist_path = SCRIPTS_DIR / "playlist.txt"

print(f"[3] Generating seamless playlist of {len(videos)} videos for Cam 1...")
with open(playlist_path, "w") as f:
    for vid in videos:
        # FFmpeg requires forward slashes and absolute paths in the text file
        f.write(f"file '{vid.as_posix()}'\n")

cam1_cmd = [
    "ffmpeg", "-stream_loop", "-1", "-re", "-f", "concat", "-safe", "0", 
    "-i", str(playlist_path),
    "-an", "-c:v", "copy", "-f", "rtsp", "-rtsp_transport", "tcp", "rtsp://localhost:8554/cam1"
]
cam1_proc = subprocess.Popen(cam1_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

try:
    print("\n[SUCCESS] Both cameras are live! Press Ctrl+C to stop.")
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nShutting down streams...")
    cam1_proc.terminate()
    cam2_proc.terminate()
    mtx_proc.terminate()
    if playlist_path.exists():
        playlist_path.unlink()
    print("Done.")
