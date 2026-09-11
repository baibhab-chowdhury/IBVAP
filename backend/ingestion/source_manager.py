import subprocess
import os
import signal
from pathlib import Path

class SourceManager:
    """Manages FFmpeg processes that push video to MediaMTX RTSP."""
    
    def __init__(self):
        self.processes = {}
        self.scripts_dir = Path(os.path.abspath(__file__)).parent.parent.parent / "scripts"
        
    def start_slideshow(self, footage_dir: str):
        """Generates concat playlist and starts invincible FFmpeg loop on Cam 1."""
        if 1 in self.processes:
            self._kill_process(1)
            
        footage_path = Path(footage_dir)
        videos = list(footage_path.glob("*.mp4"))
        
        if not videos:
            print("No footage found for slideshow.")
            return

        playlist_path = self.scripts_dir / "playlist.txt"
        with open(playlist_path, "w") as f:
            for vid in videos:
                f.write(f"file '{vid.as_posix().replace(chr(39), chr(92)+chr(39))}'\n")

        cmd = [
            "ffmpeg", "-stream_loop", "-1", "-re", "-f", "concat", "-safe", "0",
            "-i", str(playlist_path),
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
            "-an", "-c:v", "libx264", "-preset", "ultrafast", "-tune", "zerolatency",
            "-f", "rtsp", "-rtsp_transport", "tcp", "rtsp://localhost:8554/cam1"
        ]
        
        import threading
        import time
        
        def keep_alive():
            # Check a flag to ensure we don't respawn if intentionally switched
            self.running_slideshow = True
            while self.running_slideshow:
                proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                self.processes[1] = {"source": "slideshow", "proc": proc}
                proc.wait()
                if self.running_slideshow:
                    print("Slideshow reached end or hit a bad file. Looping in 1s...")
                    time.sleep(1)
                
        threading.Thread(target=keep_alive, daemon=True).start()
        print("Cam 1 Slideshow started.")

    def start_stream(self, source_url: str):
        """Switches Cam 1 to a live stream (e.g. IP Webcam)."""
        self.running_slideshow = False # Stop the slideshow auto-restarter
        if 1 in self.processes:
            self._kill_process(1)
            
        cmd = [
            "ffmpeg", "-re", "-i", source_url,
            "-an", "-c:v", "libx264", "-preset", "ultrafast", "-tune", "zerolatency",
            "-f", "rtsp", "-rtsp_transport", "tcp", "rtsp://localhost:8554/cam1"
        ]
        
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.processes[1] = {"source": source_url, "proc": proc}
        print(f"Cam 1 switched to Live Stream: {source_url}")

    def _kill_process(self, cam_id: int):
        if cam_id in self.processes:
            proc_info = self.processes.pop(cam_id)
            proc = proc_info["proc"]
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    
    def stop_all(self):
        self.running_slideshow = False
        self._kill_process(1)

source_manager = SourceManager()
